/*!
 * itny.js — Itinerary aggregate (DDD).  SOURCE OF TRUTH for the simulator.
 * ----------------------------------------------------------------------------
 * A single, self-contained domain model that encapsulates BOTH the itinerary
 * data AND all of its business logic.  It has NO knowledge of the DOM, of HTML,
 * or of how it is rendered — itny.html is a thin view over this file.
 *
 * Loaded as a classic script:  <script src="itny.js"></script>  (so it works on
 * file://, unlike the old fetch('itny.json') which browsers block).  Also usable
 * under Node via module.exports for headless testing.
 *
 * Public surface (everything the UI needs):
 *   const itn = Itinerary.create();      // seeded demo itinerary
 *   itn.reset();                         // back to the seeded start
 *   await itn.happyPath();               // drive DRAFT → … → CONFIRMED
 *   itn.select(itemId);                  // set the focused item (for item actions)
 *   itn.getActions();                    // [{ id, ruleId, category, name,
 *                                        //    precondition, outcome, input(schema),
 *                                        //    enabled(), reason(), exec(input), source }]
 *   itn.summary() / itn.projection() / itn.dbDocument() / itn.history
 *
 * Action method convention (exactly as requested):
 *   {category}{ActionName}Enabled(...)  → { ok:boolean, why:string }
 *   {category}{ActionName}Exec(input)   → Promise<void>   (mutates the aggregate)
 *   category ∈ { 'itny', 'item', 'pendingChanges' }.
 *
 * Commercial model (supplier-side, per item) — target / requested / confirmed:
 *   target    = the figure+spec the seller currently intends (derived live).
 *   requested = what is currently out to the supplier on a voucher, or null:
 *               { fp, price, ver, state:'AWAITING'|'REJECTED' }.
 *   confirmed = the last figure the supplier agreed, or null: { fp, price, ver }.
 *   supplier status is DERIVED from those three (see Item#supplierStatus) into one
 *   of: NeedsRequest, AwaitingSupplier, Booked, Rejected (NeedsDecision is reserved — no producer yet).
 *   NB: item `status` is INTENT only (NEW/CONFIRMED/CANCELLED); the supplier-sync
 *   bit (waiting/refused) and the amended-but-stale `isUpdated` label both live OUTSIDE status.
 *
 * Lineage: faithful re-architecture of itny.json (v1.0, src itinerary.logic.md v2.4).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; // Node
  root.Itinerary = api.Itinerary;                                         // browser
  root.ITNY = api;                                                        // enums/config
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Simulator version — stamped into the `__metadata` of every saved snapshot (serialize) and checked on load so a
  // file from a different build prompts the user before continuing. Bump the MINOR digit for behavioural changes.
  const SIM_VERSION = '2.4';

  /* ======================================================================
   * 1. Enumerations & reference data  (was itny.json: enums/constants/suppliers)
   * ==================================================================== */

  const ItineraryStatus = Object.freeze({
    DRAFT: 'DRAFT', PREPARED: 'PREPARED', QUOTED: 'QUOTED', APPROVED: 'APPROVED',
    INVOICED: 'INVOICED', VOUCHERED: 'VOUCHERED', CONFIRMED: 'CONFIRMED',
    LOST: 'LOST', SUPERSEDED: 'SUPERSEDED', CANCELLED: 'CANCELLED',
  });

  // What kind of itinerary this is. BOOKING — the full commercial spine (suppliers, payments, documents, the whole
  // ladder). BROCHURE — a cut-down planning shell that only walks DRAFT ↔ PREPARED: you build services/travellers and
  // mark it PREPARED, but there is NO supplier/voucher, payment or document machinery. A brochure is promoted to a
  // booking via the "Create Itinerary" action (PREPARED → itineraryType BOOKING), which unlocks everything.
  const ItineraryType = Object.freeze({ BOOKING: 'BOOKING', BROCHURE: 'BROCHURE' });

  // Client-money status — fully DERIVED from paid-vs-total (see _recalcPayment), never pinned by a per-state button.
  //   NEW           — nothing collectable yet: no client money (payments/credit notes), no supplier vouchers, AND still
  //                   pre-approval (itinerary status before APPROVED). Once APPROVED, an unpaid itinerary is NEEDS_PAYMENT.
  //   NEEDS_PAYMENT — money owed: paid < total (a balance is outstanding across the milestone schedule).
  //   FULLY_PAID    — paid === total (> 0).
  //   OVERPAID      — paid > total (client overpaid, or the total dropped below money already collected).
  //   CANCELLED     — the itinerary is dead (status CANCELLED/LOST/SUPERSEDED); money flow stops.
  const PaymentStatus = Object.freeze({
    NEW: 'NEW', NEEDS_PAYMENT: 'NEEDS_PAYMENT', FULLY_PAID: 'FULLY_PAID', OVERPAID: 'OVERPAID', CANCELLED: 'CANCELLED',
  });

  // Direction of a scheduled payment milestone — money IN from the client, or OUT back to them (a refund).
  const MilestoneType = Object.freeze({ RECEIVE_FROM_CLIENT: 'RECEIVE_FROM_CLIENT', REFUND_TO_CLIENT: 'REFUND_TO_CLIENT' });

  // Supplier hold status — HELD (granted) ↔ RELEASED (let go); toggled per-hold in the UI. (REQUESTED is legacy —
  // there is no request-a-hold step any more; "Add Hold" records a HELD hold directly.)
  const HoldStatus = Object.freeze({ REQUESTED: 'REQUESTED', HELD: 'HELD', RELEASED: 'RELEASED' });

  // Per-item operational lifecycle status — INTENT only: NEW → CONFIRMED, or CANCELLED. The supplier-sync
  // dimension (waiting / refused) lives in `supplier status`; an amended-but-stale CONFIRMED line surfaces a
  // derived `isUpdated` LABEL. Supplier HOLDS are a separate record (the `holds` array + the "Add Hold" action,
  // surfaced in the item modal / list) — they no longer drive a HELD/HOLD_REQUESTED status.
  const ServiceStatus = Object.freeze({
    NEW: 'NEW', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED',
  });

  // Pre-supplier-commitment status — a line sits at NEW (arranging holds) until it commits to CONFIRMED/CANCELLED.
  const HOLD_PHASE = [ServiceStatus.NEW];

  // Where the trip sits against the demo clock (currentDate) vs the recomputed travel span (travelStart/travelEnd).
  // DERIVED — never stored: NOT_STARTED (today < start), IN_PROGRESS (start ≤ today ≤ end), COMPLETED (today > end).
  const TravelStatus = Object.freeze({
    NOT_STARTED: 'TRAVEL_NOT_STARTED', IN_PROGRESS: 'TRAVEL_IN_PROGRESS', COMPLETED: 'TRAVEL_COMPLETED',
  });

  // Mirrors the BE Catalog ServiceTypeCode enum (src/Modules/SOL.Catalog.Api/Enums/ServiceTypeCode.cs) — same set.
  const ServiceType = Object.freeze({
    ACCOMMODATION: 'ACCOMMODATION', ACTIVITY: 'ACTIVITY', OTHERS: 'OTHERS',
    TRANSPORT: 'TRANSPORT', FLIGHT: 'FLIGHT', FEE: 'FEE',
  });
  const PaxType = Object.freeze({ ADULT: 'ADULT', CHILD: 'CHILD', INFANT: 'INFANT' });
  const PendingOp = Object.freeze({ ADD: 'ADD', MODIFY: 'MODIFY', CANCEL: 'CANCEL', REMOVE: 'REMOVE' });
  const ChangeTrigger = Object.freeze({ SELLER: 'SELLER', CLIENT_REQUEST: 'CLIENT_REQUEST', CANCELLATION: 'CANCELLATION' });
  // When in the change's lifetime the modification happens, stamped on the changeSet at open (orthogonal to trigger).
  // PreBookingModif  — opened before suppliers are vouchered (itinerary not yet VOUCHERED) → Apply/Cancel only.
  // PostBookingModif — opened once VOUCHERED+ → full prepare→quote→approve→invoice→apply flow.
  const ModificationType = Object.freeze({ PRE_BOOKING: 'PreBookingModif', POST_BOOKING: 'PostBookingModif' });

  // Who is operating the simulator. Role drives a few role-gated actions: only a FIN (finance) user may Unlock a line
  // that a supplier payment locked (or record client money); only an OPS user may toggle OPS_READY / Generate the FCA.
  // OPS otherwise carries the SAME permissions as SP (the default sales/product operator) — it just adds the two ops
  // actions SP is NOT allowed to do.
  const UserRole = Object.freeze({ SP: 'SP', FIN: 'FIN', OPS: 'OPS' });
  const AvailableUsers = Object.freeze([
    { name: 'Sam (Sales)', role: UserRole.SP },        // first option → selected by default
    { name: 'Fiona (Finance)', role: UserRole.FIN },
    { name: 'Olivia (Ops)', role: UserRole.OPS },
  ]);

  // Agency / agent presets — each carries the commercial levers the price engine uses for every line: a CPS (seller)
  // margin and a TC (travel-consultant) commission. Selecting an agency in the header applies its margin + TC to the
  // whole itinerary's sell calc. The first is the default; an arbitrary agent name (set via Convert) maps to it.
  const Agencies = Object.freeze([
    { id: 'Agent A', margin: 30, tc: 0 },     // standard agency — CPS margin only, no TC commission
    { id: 'Agent TC', margin: 30, tc: 6 },    // travel-consultant agency — CPS margin + 6% TC commission
  ]);

  // The novel supplier-side supplier status state, DERIVED from target/requested/confirmed.
  const SupplierStatus = Object.freeze({
    NeedsRequest: 'NeedsRequest',         // target differs from confirmed and nothing is out (or what's out is stale) → raise/send a request
    AwaitingSupplier: 'AwaitingSupplier', // a request that still matches target is out, supplier silent
    NeedsDecision: 'NeedsDecision',       // RESERVED — no producer yet (kept for a future supplier counter-offer / differing-figure case)
    Booked: 'Booked',                   // target == confirmed and nothing outstanding
    Rejected: 'Rejected',                 // supplier refused the outstanding request → seller must resolve (reinstate / re-request / drop)
  });

  // Voucher lifecycle (a per-supplier request). DRAFT is reserved for P2 (explicit send); P1 issues
  // straight to SENT. ALWAYS test liveness via Voucher#isLive(), never `=== 'SENT'`, so P2 can widen it.
  const VoucherStatus = Object.freeze({ DRAFT: 'DRAFT', SENT: 'SENT', CONFIRMED: 'CONFIRMED', REJECTED: 'REJECTED', SUPERSEDED: 'SUPERSEDED' });
  // What a voucher line asks the supplier to do for that item.
  const LineAction = Object.freeze({ CONFIRM: 'CONFIRM', CANCEL: 'CANCEL' });

  const Suppliers = Object.freeze({
    A: { name: 'Lodge Co', depositPct: 0.30, balanceDays: 30 },
    B: { name: 'AirReps', depositPct: 0.50, balanceDays: 14 },
    C: { name: 'Activity Co', depositPct: 0.20, balanceDays: 21 },
    // Extra accommodation suppliers — distinct lodge brands so the route graph charts them as DISTINCT places (a stay
    // node is keyed by supplier; two lodges sharing a supplier would merge into one node and hide a route fork).
    D: { name: 'Serengeti Camps', depositPct: 0.30, balanceDays: 30 },
    E: { name: 'Crater Lodges', depositPct: 0.30, balanceDays: 30 },
  });

  /* ---- lifecycle ladders — the SINGLE source for the simulator stepper AND the reference page.
   *      Each step: { key:<status>, sub:<short label>, next:<trigger to the following step> }.
   *      Add/rename/re-order a state here and both the simulator and itny.lifecycle.html follow. ---- */
  const ItineraryFlow = Object.freeze([
    { key: 'DRAFT', sub: 'build', next: 'prepare' }, { key: 'PREPARED', sub: 'ready', next: 'quote' },
    { key: 'QUOTED', sub: 'sent', next: 'accept' }, { key: 'APPROVED', sub: 'accepted', next: 'invoice' },
    { key: 'INVOICED', sub: 'deposit', next: 'voucher' }, { key: 'VOUCHERED', sub: 'suppliers', next: 'confirm' },
    { key: 'CONFIRMED', sub: 'booked' },
  ]);
  // Brochure ladder — a brochure only walks DRAFT ↔ PREPARED (no QUOTED…CONFIRMED, no terminals). The simulator
  // stepper renders whichever ladder Itinerary#flow() returns, so a brochure shows just these two steps.
  const BrochureFlow = Object.freeze([
    { key: 'DRAFT', sub: 'build', next: 'prepare' }, { key: 'PREPARED', sub: 'ready' },
  ]);
  const ChangeFlow = Object.freeze([
    { key: 'DRAFT', sub: 'staging', next: 'prepare' }, { key: 'PREPARED', sub: 'ready', next: 'quote' },
    { key: 'QUOTED', sub: 'sent', next: 'approve' }, { key: 'APPROVED', sub: 'accepted', next: 'invoice' },
    { key: 'INVOICED', sub: 'final due', next: 'apply' },
  ]);
  const ItemFlow = Object.freeze([
    { key: 'NEW', next: 'confirm' }, { key: 'CONFIRMED', sub: 'booked' },
  ]);

  const Constants = Object.freeze({
    AUTO_CONFIRM: ['OTHERS'],                                   // types that confirm themselves on voucher (e.g. insurance)
    CANCEL_OK: ['CONFIRMED'],                                    // committed (CONFIRMED-intent) → CANCEL (fee once supplier-agreed)
    REMOVE_OK: ['NEW'],                                          // pre-commitment state → REMOVE (no fee)
    CANCEL_FEE_PCT: 0.25,                                        // fee on cancelling a CONFIRMED line
    // Client-facing lifecycle ladder shown as a stepper: [status, sub-label] — derived from ItineraryFlow.
    FLOW: ItineraryFlow.map((s) => [s.key, s.sub]),
  });

  /* ---- small JSON-schema input fragments reused across actions ---- */
  const NO_INPUT = { type: 'object', properties: {}, additionalProperties: false };
  const schema = (properties, required) => ({ type: 'object', properties, required: required || [], additionalProperties: false });
  const fEnum = (values, title, def) => ({ type: 'string', enum: values, title, default: def });
  const fNum = (title, def) => ({ type: 'number', title, default: def });
  const fStr = (title, def) => ({ type: 'string', title, default: def });
  // A date field — rendered as a native date picker by the view (format:'date'); value is an ISO 'YYYY-MM-DD' string.
  const fDate = (title, def) => ({ type: 'string', format: 'date', title, default: def });
  // Default description for an item-attached document (Add Document) — a link to the shared docs folder.
  const DEFAULT_DOC_URL = 'https://drive.google.com/drive/folders/itinerary-docs';
  // Edit Pax form prefills — a freshly-seeded/reset traveller stores an EMPTY group + full name; the Edit Pax form
  // defaults to these (a sample family group + a sample full name) so editing one is one click. Picked deterministically
  // (no Math.random — keeps the catalogue/tests stable) by a rotating index so successive edits suggest different names.
  const SAMPLE_GROUP = 'Smiths';
  const SAMPLE_FULLNAMES = ['John Smith', 'Mary Brooks', 'Chidi Okoro', 'Lucia Garcia', 'Ken Nakamura', 'Aisha Khan', 'Tom Brooks', 'Nadia Okoro'];
  // Seeded traveller profiles keyed by the default tag — the SINGLE source for both the happy path and the Edit Pax
  // form: editing a fresh traveller pre-fills the demo data for its tag (group / full name / age / FCA comment), so a
  // freshly-reset booking can be named one click at a time and match the happy-path output.
  const PAX_SAMPLES = {
    ADT1: { group: 'Smiths', fullName: 'John Smith', age: 35, comment: 'window seat' },
    ADT2: { group: 'Brooks', fullName: 'Tom Brooks', age: 35, comment: 'wheelchair assistance' },
    CHD1: { group: 'Smiths', fullName: 'Lucy Smith', age: 9, comment: 'child meal' },
  };

  /* ---- utilities ---- */
  const deep = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  // A verdict is { ok, why, gated?, label? }. `label` names the check for the per-action checklist UI;
  // it is only attached when supplied, so a plain ok()/no() keeps its original { ok, why } shape (back-compat).
  const _verdict = (isOk, why, isGated, label) => { const v = { ok: isOk, why: why || '' }; if (isGated) v.gated = true; if (label) v.label = label; return v; };
  const ok = (why, label) => _verdict(true, why, false, label);
  const no = (why, label) => _verdict(false, why, false, label);
  // Like no(), but marks "right step, blocked only by a SATISFIABLE runtime condition" (pay, confirm
  // lines, resolve the open change, …). Same {ok:false, why} shape plus gated:true —
  // callers that only read .ok/.why are unaffected; the lifecycle matrix renders these as ✓*.
  const gated = (why, label) => _verdict(false, why, true, label);
  // FIN-only gate — finance actions (toggle finance lock, record client payment/refund, add/transfer credit notes)
  // are available only while a Finance (FIN) user is operating. The role is a SATISFIABLE runtime condition (switch
  // the operating user), so a wrong-role verdict is GATED (renders ✓* in the lifecycle matrix), not a hard no — and
  // allChecks ranks a real wrong-step/state `no` above it, so the gate never masks a genuine block. Labelled for the list.
  const finOnly = (itn) => (itn.currentUser && itn.currentUser.role === UserRole.FIN)
    ? ok('Finance (FIN) user is operating.')
    : gated('Finance (FIN) only — switch the operating user to a Finance user.');
  // OPS-only gate — operational actions (toggle OPS_READY, Generate FCA) are available only while an Ops (OPS) user
  // is operating. OPS otherwise has SP's permissions; SP (and FIN) cannot perform these. Like finOnly, a wrong-role
  // verdict is GATED (✓*) — switching the operating user satisfies it. Labelled verdict for the checks.
  const opsOnly = (itn) => (itn.currentUser && itn.currentUser.role === UserRole.OPS)
    ? ok('Ops (OPS) user is operating.')
    : gated('Ops (OPS) only — switch the operating user to an Ops user.');
  // Combine sub-verdicts into ONE aggregate that ALSO lists every individual check on `.checks` (each a
  // verdict with its own ok/why/label). The aggregate HEADLINE (ok/why/gated) is the first HARD blocker (a
  // definite `no`) if any, else the first SATISFIABLE blocker (a `gated` maybe — e.g. a role/condition gate),
  // else the LAST check when all pass. Ranking a hard no above a gated maybe means a satisfiable gate (✓*)
  // never masks a genuine wrong-step/state block (·) in the lifecycle matrix; `.ok` is unchanged (false if any
  // check fails), and a wrong-role gate now surfaces as ✓* rather than a dead ·. Nested `.checks` are flattened,
  // so the shared gate checks and a compound action body read as one flat list. Convention: a split body ends
  // with a trailing always-ok summary check carrying the success message (it becomes the headline when all pass).
  // Falsy entries are skipped (lets a check be conditionally included with `cond && ok(...)`).
  const allChecks = (...verdicts) => {
    const checks = [];
    verdicts.forEach((v) => { if (!v) return; (v.checks || [v]).forEach((c) => checks.push(c)); });
    const head = checks.find((c) => !c.ok && !c.gated) || checks.find((c) => !c.ok) || checks[checks.length - 1] || ok('');
    const agg = { ok: head.ok, why: head.why, checks };
    if (head.gated) agg.gated = true;
    return agg;
  };
  // An action may declare its rule as a COLLECTION OF CHECKS instead of a hand-written isAllowed:
  //   checks: [ { description:'<what this asserts>', check:(itn, u, input) => ok()/no()/gated() }, … ]
  // The static `description` names the check (it becomes the verdict's label, so the lifecycle checklist /
  // itny.html breakdown can render each row by name) while the returned verdict carries the dynamic reason.
  // runActionChecks() runs the WHOLE collection (no short-circuit) and folds it through allChecks(), so the
  // derived isAllowed headline (ok/why/gated) is the first HARD blocker, else the first gated one (see allChecks).
  // A check returning a falsy value is skipped (conditional inclusion, mirroring allChecks); errors surface as
  // a failing check. Authoring an action with `checks` REPLACES its `isAllowed` (gateAllowed prefers checks).
  const runActionChecks = (itn, a, u, input) => {
    const verds = (a.checks || []).map((c) => {
      let v; try { v = c.check(itn, u, input || {}); } catch (e) { return no('error: ' + e.message, c.description || 'Rule'); }
      if (!v) return null;                                                        // falsy → skip (conditional check)
      return v.label ? v : Object.assign({}, v, { label: c.description || 'Rule' });
    });
    return allChecks(...verds);
  };
  // Readable JS source for a checks-collection (mirrors a hand-written isAllowed's .toString()) — used for the
  // `.code` the catalogue/lifecycle pages display. One commented description per check, then its check source.
  const checksCode = (a) => (a.checks || []).map((c) => '// ' + c.description + '\n' + c.check.toString()).join('\n\n');
  const round = Math.round;
  const sortedIds = (ids) => (ids || []).slice().sort();
  /* ---- date model -----------------------------------------------------------------------------------------------
   * A "day number" (D1 = the demo's first day) is the internal pivot for ALL date arithmetic, anchored to a REAL
   * calendar so every date stores & renders as YYYY-MM-DD. The anchor's month/day are FIXED (ANCHOR_MD = Jul 1);
   * the YEAR is dynamic — the current year + 2 — so a freshly-loaded demo always sits ~2 years out. dayNum() is the
   * one-way door from any stored date (ISO / legacy 'D{n}' / bare number) back to the integer the maths runs on. */
  const DAY_MS = 86400000;
  const ANCHOR_MD = { month: 6, day: 1 };                       // D1 = July 1 (month is 0-based) of (current year + 2)
  const anchorYear = () => new Date().getFullYear() + 2;
  const anchorMs = () => Date.UTC(anchorYear(), ANCHOR_MD.month, ANCHOR_MD.day);
  const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
  // ISO 'YYYY-MM-DD' for a day number (D1 = anchor, D2 = anchor + 1 day, …; n may be ≤ 0 → a date before the anchor).
  const isoForDay = (n) => new Date(anchorMs() + (Math.round(n) - 1) * DAY_MS).toISOString().slice(0, 10);
  // Day number for an ISO date (inverse of isoForDay).
  const dayForISO = (iso) => round((Date.parse(iso + 'T00:00:00Z') - anchorMs()) / DAY_MS) + 1;
  // Any stored date → its integer day number. Accepts ISO ('2028-07-04'), a legacy 'D{n}' token, or a bare number.
  // A payment due date is (travel start − dueDays) and may go ≤ 0.
  const dayNum = (d) => {
    if (d == null || d === '') return 0;
    const s = String(d);
    if (isISO(s)) return dayForISO(s);
    const n = parseInt(s.replace(/[^\d-]/g, ''), 10); return isNaN(n) ? 0 : n;
  };
  // Normalise any date input (ISO / 'D{n}' / number) to the stored ISO form — used at every date-storage boundary.
  const isoDate = (d) => (d == null || d === '') ? null : isoForDay(dayNum(d));
  // Display label for a day number — its ISO date, or '—' for null/undefined.
  const dayLabel = (n) => (n == null ? '—' : isoForDay(n));
  // A due "token" is just the ISO date now (kept as a distinct name for the supplier-timeline read-model).
  const dueToken = (n) => (n == null ? '—' : isoForDay(n));
  // Demo clock default: the simulator's "today" starts this many days before D1 (D1 − 100 = day −99).
  const DEFAULT_CURRENT_OFFSET = -100;

  /* ======================================================================
   * 2. Item entity  (a service, or an extra attached to a service)
   *    Encapsulates its own commercial triple + supplier status.
   * ==================================================================== */

  /* ======================================================================
   *  Price model  (rateType + net/rack/sell breakdown + margin + promotions)
   *  A line's price is split so a pending change shows only what the SELLER edited:
   *    itemSystemPrice — DERIVED/config: what the system computes from the rate card (net/rack/sell, per unit-idx
   *                      & per pax-type) + the input systemMargin. Recomputed, never shown in the change diff.
   *    itemManualPrice — the SELLER-EDITABLE intent (shown in the change diff): manualTotalSell, manualMargin,
   *                      per-line sell overrides, the validated-net pin and the hypothetical flag.
   *    promotionIds    — the SELLER-EDITABLE ids of the selected promo INSTANCES (itn.promotions) this line is a member
   *                      of. The staged source of truth for promo association; shows in the change diff & on docs/voucher.
   *    itemTotalPrice  — DERIVED calc: the manual breakdown + totalNet/Rack/Sell, sellBeforePromos, promoDiscount,
   *                      effectiveSell, overpriced. Recomputed, never shown in the change diff.
   *  CLIENT money uses the effective (post-promotion) SELL; the SUPPLIER voucher/supplier status uses NET + promotions.
   * ==================================================================== */
  // SPEC_FIELDS snapshot/restore the whole line (incl. every price field, so revert + effPrice are exact);
  // DIFF_FIELDS are what a staged change DISPLAYS/compares — the DERIVED price fields are excluded so the change
  // panel shows only the seller-editable price fields (itemManualPrice + promotionIds), never the system breakdown/totals.
  const SPEC_FIELDS = ['name', 'type', 'supplierId', 'startDate', 'endDate', 'rates', 'rateType', 'paxIds', 'qty', 'itemSystemPrice', 'itemManualPrice', 'promotionIds', 'itemTotalPrice'];
  const DERIVED_PRICE_FIELDS = ['itemSystemPrice', 'itemTotalPrice'];
  const DIFF_FIELDS = SPEC_FIELDS.filter((f) => !DERIVED_PRICE_FIELDS.includes(f));
  const DEFAULT_MARGIN = 30;                                 // default system margin (%) — sell = net × 1.3 unless an explicit sell/override is set
  const PAX_CODE = { ADULT: 'ADT', CHILD: 'CHD', INFANT: 'INF' };   // itinerary pax type → voucher pax code (else 'ANY')
  const RT_DEFAULT = { chargeType: 'Person', timeUnit: 'Night' };   // reproduces the legacy days × pax-rate semantics
  // Rate-card cell normaliser: a bare number N (legacy/seed) → { net:N, rack:N×(1+margin), sell:null } (rack defaults to
  // the standard-margin retail so a default item isn't flagged overpriced); a triple passes through unchanged.
  const normRate = (r) => (r && typeof r === 'object')
    ? { net: +r.net || 0, rack: (r.rack != null ? +r.rack : round((+r.net || 0) * (1 + DEFAULT_MARGIN / 100))), sell: (r.sell == null ? null : +r.sell) }
    : { net: +r || 0, rack: round((+r || 0) * (1 + DEFAULT_MARGIN / 100)), sell: null };
  const normalizeRates = (rates) => { const out = {}; Object.keys(rates || {}).forEach((k) => { out[k] = normRate(rates[k]); }); return out; };
  const netRatesOf = (rates) => { const out = {}; Object.keys(rates || {}).forEach((k) => { out[k] = (rates[k] && typeof rates[k] === 'object') ? (rates[k].net || 0) : (+rates[k] || 0); }); return out; };
  // per-cell sell: an explicit sell wins, else derived from net + margin%.
  const sellOf = (cell, margin) => (cell && cell.sell != null) ? cell.sell : round((cell ? cell.net : 0) * (1 + (margin || 0) / 100));
  const reSell = (net, margin) => round((net || 0) * (1 + (margin || 0) / 100));   // re-derive a sell from net at a margin
  const p3 = (net, rack, sell) => ({ net: round(net), rack: round(rack), sell: round(sell) });
  const rateTypeTitle = (rt) => 'P' + ((rt && rt.chargeType === 'Unit') ? 'U' : 'P') + 'P' + ((!rt || rt.timeUnit === 'Night') ? 'N' : rt.timeUnit === 'Day' ? 'D' : 'S');
  const unitsOf = (item) => { const rt = item.rateType || RT_DEFAULT; return rt.timeUnit === 'Stay' ? 1 : item.days(); };
  // unitPrices use idx:null as a WILDCARD — the price for every unit that has no specific indexed entry. So a flat
  // per-night price is one {idx:null} row (not N identical rows); a specific {idx:k} row overrides night k.
  const priceForUnit = (unitPrices, u) => (unitPrices || []).find((x) => x.idx === u) || (unitPrices || []).find((x) => x.idx == null) || null;
  // Seed the price fields on a fresh item. A numeric `seedSystem` (legacy/test) seeds a FLAT system price; the
  // hypothetical flag lives on the SYSTEM price and defaults TRUE (an unvalidated estimate) unless seeded false.
  const initItemPrice = (item, seedSystem, seedManual, seedHypo) => {
    const hypo = seedHypo !== false;
    item.itemSystemPrice = (typeof seedSystem === 'number')
      ? { total: p3(seedSystem, seedSystem, seedSystem), unitPrices: [{ idx: null, price: p3(seedSystem, seedSystem, seedSystem) }], paxPrices: [], systemMargin: DEFAULT_MARGIN, hypothetical: hypo }
      : { total: p3(0, 0, 0), unitPrices: [], paxPrices: [], systemMargin: DEFAULT_MARGIN, hypothetical: hypo };
    item.itemManualPrice = { manualTotalSell: (seedManual != null ? +seedManual : null), manualMargin: null, unitOverrides: [], paxOverrides: [], validatedNet: null };
    item.promotionIds = [];                                   // ids of selected promo INSTANCES (itn.promotions) this line is a member of
    item.itemTotalPrice = { manualPrice: null, totalNet: 0, totalRack: 0, totalSell: 0, sellBeforePromos: 0, promoDiscount: 0, effectiveSell: 0, netDiscount: 0, effectiveNet: 0, overpriced: false, underpriced: false,
      // SYSTEM price-engine breakdown (display): purchase = net → + CPS margin (system) + TC commission build the
      // last-contracted sell; the uplift lifts it to systemSell for hypothetical future-dated lines. NEVER moved by a manual lever.
      purchaseNet: 0, cpsMargin: DEFAULT_MARGIN, cpsAmount: 0, tcEnabled: false, tcRate: 0, tcAmount: 0,
      upliftRate: 0, upliftYears: 0, upliftFactor: 1, upliftApplied: false, upliftPct: 0, upliftAmount: 0, lastContractedSell: 0, derivedSell: 0, rackCeiling: 0, systemSell: 0,
      // MANUAL price (only when a manual lever is set): null | {kind:'flat',sell} | {kind:'breakdown',cpsMargin,purchaseNet,cpsAmount,tc*,sum,sell,breakdown}. IGNORES uplift; manual wins over systemSell.
      manual: null };
    refreshDerived(item);
  };
  // Build the SYSTEM breakdown from the rate card × rateType × duration × travellers/qty (margin carried as input).
  // It carries NO rateType (that lives on the Item); unitPrices is a single {idx:null} wildcard (same price all units).
  const buildSystemBreakdown = (item, margin) => {
    const rt = item.rateType || RT_DEFAULT;
    const units = unitsOf(item), qty = item.qty || 1;
    const paxPrices = [];
    let pN = 0, pR = 0, pS = 0;                                                          // per-unit (per time index) price
    let sellProvided = false;                                                            // any rate cell carries an explicit sell? → seller margin already baked in
    if (rt.chargeType === 'Unit') {
      const r = (item.rates && item.rates.UNIT) || { net: 0, rack: 0, sell: null };
      pN = r.net * qty; pR = r.rack * qty; pS = sellOf(r, margin) * qty; if (r.sell != null) sellProvided = true;
    } else {
      const types = (item.paxIds || []).map((pid) => { const p = item._itn.pax.find((x) => x.id === pid); return p ? p.type : null; }).filter(Boolean);
      const seen = {};
      types.forEach((t) => { if (seen[t]) return; seen[t] = true; const r = (item.rates && item.rates[t]) || { net: 0, rack: 0, sell: null }; paxPrices.push({ type: PAX_CODE[t] || 'ANY', idx: 0, price: p3(r.net, r.rack, sellOf(r, margin)) }); });
      types.forEach((t) => { const r = (item.rates && item.rates[t]) || { net: 0, rack: 0, sell: null }; pN += r.net * qty; pR += r.rack * qty; pS += sellOf(r, margin) * qty; if (r.sell != null) sellProvided = true; });
    }
    const unitPrices = [{ idx: null, price: p3(pN, pR, pS) }];                           // same price for every unit (wildcard)
    return { total: p3(pN * units, pR * units, pS * units), unitPrices, paxPrices, systemMargin: margin, sellProvided };
  };
  // Build the MANUAL breakdown (SELL-only) — only when a margin override or per-cell sell override exists. It CARRIES
  // rateType (the system breakdown does not). A wildcard {idx:null} base manual sell + any specific {idx:k} overrides.
  const buildManualBreakdown = (item) => {
    const man = item.itemManualPrice, sys = item.itemSystemPrice; if (!man || !sys) return null;
    const rt = item.rateType || RT_DEFAULT;
    const ovU = {}; let ovUNull;                                                         // idx:null override = wildcard (all units)
    (man.unitOverrides || []).forEach((o) => { if (o.idx == null) ovUNull = +o.sell; else ovU[o.idx] = +o.sell; });
    const ovP = {}; (man.paxOverrides || []).forEach((o) => { ovP[o.type + ':' + o.idx] = +o.sell; });
    const hasUnit = man.unitOverrides && man.unitOverrides.length, hasPax = man.paxOverrides && man.paxOverrides.length;
    if (!hasUnit && !hasPax && man.manualMargin == null) return null;
    const m = man.manualMargin != null ? man.manualMargin : sys.systemMargin;
    const units = unitsOf(item);
    const baseCell = priceForUnit(sys.unitPrices, 1);                                    // the wildcard per-unit system price
    const baseSell = ovUNull != null ? ovUNull : (baseCell ? reSell(baseCell.price.net, m) : 0);   // a unit-price override wins for the wildcard
    const unitPrices = [{ idx: null, price: { sell: baseSell } }];                       // wildcard manual sell for all units…
    Object.keys(ovU).forEach((k) => unitPrices.push({ idx: Number(k), price: { sell: ovU[k] } }));   // …plus any per-night overrides
    const paxPrices = sys.paxPrices.map((pp) => ({ type: pp.type, idx: pp.idx, price: { sell: (ovP[pp.type + ':' + pp.idx] != null ? ovP[pp.type + ':' + pp.idx] : reSell(pp.price.net, m)) } }));
    let totalSell;
    if (hasUnit) { totalSell = 0; for (let u = 1; u <= units; u++) { const e = priceForUnit(unitPrices, u); totalSell += e ? (e.price.sell || 0) : 0; } }
    else if (hasPax) {
      const qty = item.qty || 1;
      totalSell = (item.paxIds || []).reduce((a, pid) => {
        const p = item._itn.pax.find((x) => x.id === pid); if (!p) return a;
        const code = PAX_CODE[p.type] || 'ANY', r = (item.rates && item.rates[p.type]) || { net: 0 };
        const s = ovP[code + ':0'] != null ? ovP[code + ':0'] : reSell(r.net, m);
        return a + s * qty;
      }, 0) * units;
    } else totalSell = reSell(sys.total.net, m);
    return { total: { net: sys.total.net, rack: sys.total.rack, sell: round(totalSell) }, rateType: { chargeType: rt.chargeType, timeUnit: rt.timeUnit }, unitPrices, paxPrices };
  };
  // Price-engine config accessors — tolerant of older snapshots that predate these fields (loadFromJSON parity).
  // The CPS margin + TC commission come from the selected agency (Agencies preset, by this.agencyAgent).
  const agencyOf = (itn) => { const id = itn && itn.agencyAgent; return Agencies.find((a) => a.id === id) || Agencies[0]; };
  const tcCfg = (itn) => { const ag = agencyOf(itn); return { enabled: (+ag.tc || 0) > 0, rate: +ag.tc || 0 }; };
  const upCfg = (itn) => (itn && itn.futureUplift) ? itn.futureUplift : { rate: 15, baseYear: anchorYear() };
  // Years a line is into the future relative to the uplift baseYear (0 for the contracted year / undated lines).
  const upliftYearsOf = (item) => {
    const s = item.startDate, y = s ? parseInt(String(s).slice(0, 4), 10) : NaN;
    const base = (upCfg(item._itn).baseYear) || anchorYear();
    return isNaN(y) ? 0 : Math.max(0, y - base);
  };
  // Refresh the DERIVED calc fields (itemTotalPrice) from the system breakdown + the manual levers + the itinerary
  // TC/uplift config. Does NOT rebuild the system breakdown. Two independent build-ups:
  //   SYSTEM price (tot.* top-level) — the pure engine output, shown AS-IS, NEVER moved by a manual lever:
  //     purchase = net  →  + CPS margin (SYSTEM rate)  →  + TC commission = last-contracted sell  →  × uplift
  //     (hypothetical future-dated lines) = systemSell.
  //   MANUAL price (tot.manual, only when a manual lever is set) — IGNORES uplift; manual WINS over systemSell:
  //     flat (manualTotalSell, top priority) → the number as-is; else a system-style build-up at the manual margin
  //     (defaults to the SYSTEM margin) / custom per-line sell → purchase → + CPS margin → + TC = manual sell.
  // Unset manual levers fall back to system values. With TC off the systemSell equals the legacy net×(1+margin) sell.
  // promo*/effective* are set by the post-pass _applyPromotions() (a promo can span sibling lines).
  const refreshDerived = (item) => {
    const sys = item.itemSystemPrice, man = item.itemManualPrice, tot = item.itemTotalPrice;
    if (!sys || !man || !tot) return;
    const tc = tcCfg(item._itn), up = upCfg(item._itn);
    const manualBreakdown = buildManualBreakdown(item);
    const hasOverrides = (man.unitOverrides || []).length > 0 || (man.paxOverrides || []).length > 0;
    const purchaseNet = sys.total.net;
    const rackBase = sys.total.rack;
    const tcEnabled = !!tc.enabled, tcRate = tcEnabled ? (+tc.rate || 0) : 0;
    const tcAmount = tcEnabled ? round(purchaseNet * tcRate / 100) : 0;   // TC commission on net — both system & manual earn it
    const upliftRate = +up.rate || 0, upliftYears = upliftYearsOf(item);

    // ---- SYSTEM price: the pure engine output. Insulated from every manual lever. ----
    const sysBase = sys.total.sell;                              // net × (1 + systemMargin) — or the rate card's provided sell
    const sysCps = round(sysBase - purchaseNet);                 // CPS margin amount at the SYSTEM margin
    const sysSum = sysBase + tcAmount;                           // last-contracted sell (pre-uplift)
    // A HYPOTHETICAL line ALWAYS gets the uplift (a future, un-confirmed price) — at least one full uplift, growing
    // linearly the further out it is: factor years = max(1, yearsOut). NOT compounded.
    const upliftApplied = sys.hypothetical;
    const upliftPct = upliftApplied ? Math.max(1, upliftYears) * upliftRate : 0;
    const upliftFactor = 1 + upliftPct / 100;
    const systemSell = round(sysSum * upliftFactor);
    // The rack CEILING is uplifted by the same factor — so the overprice check stays apples-to-apples (an uplifted
    // hypothetical sell is compared to an uplifted ceiling, never to today's un-uplifted rack).
    const rackCeiling = round(rackBase * upliftFactor);

    // ---- MANUAL price: only when the seller set a manual lever. IGNORES uplift. The CPS margin & TC are calc'd
    // additively FROM the base (manual sell = base + base×margin% + base×tc%), mirroring the system chain's structure:
    //   flat → just the number; custom per-line RATES → base = the "manual total rate" (the entered rate total);
    //   manual MARGIN only → base = the system net (purchase price), the manual margin applied to it.
    let manual = null;
    if (man.manualTotalSell != null) {
      manual = { kind: 'flat', sell: round(man.manualTotalSell) };
    } else if (hasOverrides || man.manualMargin != null) {
      const mMargin = man.manualMargin != null ? man.manualMargin : sys.systemMargin;
      const onRate = hasOverrides;                                            // custom per-line rates → "manual total rate" base
      const base = onRate ? (manualBreakdown ? manualBreakdown.total.sell : purchaseNet) : purchaseNet;
      const mCps = round(base * mMargin / 100);                              // CPS margin amount calc'd FROM the base
      const mTc = tcEnabled ? round(base * tcRate / 100) : 0;                // TC commission calc'd FROM the base
      const mSell = round(base + mCps + mTc);
      manual = { kind: 'breakdown', base: onRate ? 'rate' : 'net', manualTotalRate: (onRate ? base : null), purchaseNet,
        cpsMargin: mMargin, cpsAmount: mCps, tcEnabled, tcRate, tcAmount: mTc, sum: mSell, sell: mSell, breakdown: (onRate ? manualBreakdown : null) };
    }
    const resolved = manual ? manual.sell : systemSell;          // a manual price WINS over the system price

    tot.manualPrice = manualBreakdown;
    tot.totalNet = sys.total.net;
    tot.totalRack = rackBase;
    tot.rackCeiling = rackCeiling;
    // SYSTEM engine breakdown (display) — top-level fields mirror the SYSTEM chain (manual lives under tot.manual)
    tot.purchaseNet = purchaseNet;
    tot.cpsMargin = sys.systemMargin; tot.cpsAmount = sysCps;     // always the SYSTEM margin — never the manual one
    tot.tcEnabled = tcEnabled; tot.tcRate = tcRate; tot.tcAmount = tcAmount;
    tot.upliftRate = upliftRate; tot.upliftYears = upliftYears; tot.upliftFactor = upliftFactor; tot.upliftApplied = upliftApplied;
    tot.upliftPct = upliftPct;                                  // effective uplift % actually applied (max(1, yearsOut) × rate)
    tot.upliftAmount = systemSell - sysSum;                     // the uplift in $ (0 in the contracted year)
    tot.lastContractedSell = sysSum; tot.derivedSell = systemSell;
    tot.systemSell = systemSell;
    tot.manual = manual;
    tot.totalSell = resolved;
    tot.sellBeforePromos = resolved;                            // client price BEFORE promotions (manual wins, else system)
    tot.promoDiscount = 0;
    tot.effectiveSell = resolved;
    tot.netDiscount = 0;
    tot.effectiveNet = sys.total.net;                           // supplier net AFTER promotions (promos apply to both sides)
    tot.overpriced = resolved > rackCeiling;                    // sell above the (uplifted) rack ceiling
    tot.underpriced = resolved < tot.totalNet;                  // sell below cost (net) — selling at a loss
  };
  // Recompute a line's price: rebuild the system breakdown when forced (a priced-input edit) or while the figure
  // is still a hypothetical estimate (a validated line keeps its system figure); then refresh the derived fields.
  const recomputeItemPrice = (item, forceSystem) => {
    const man = item.itemManualPrice, sys0 = item.itemSystemPrice; if (!man) return;
    const hypo = sys0 ? sys0.hypothetical : true;
    if (forceSystem || hypo) { item.itemSystemPrice = buildSystemBreakdown(item, sys0 ? sys0.systemMargin : DEFAULT_MARGIN); item.itemSystemPrice.hypothetical = hypo; }   // preserve the flag across a rebuild
    // a validated net pin (a seller intent set by Validate price) overrides the rate-card net total, re-deriving sell at the system margin.
    if (man.validatedNet != null && item.itemSystemPrice) { const sp = item.itemSystemPrice; sp.total = p3(man.validatedNet, sp.total.rack, sellOf({ net: man.validatedNet, sell: null }, sp.systemMargin)); }
    refreshDerived(item);
  };
  // Effective (discounted) client sell from a unit OR a spec snapshot (both carry itemTotalPrice).
  const effPrice = (s) => (s && s.itemTotalPrice) ? (s.itemTotalPrice.effectiveSell || 0) : 0;

  /* ======================================================================
   *  Promotions & Discounts  (supplier promotion catalog + item-specific MANUAL promos)
   *  Two lists. The CATALOG (itn.promotionCatalog) is the menu of available promotion TEMPLATES (seeded). Selecting
   *  one creates a selected INSTANCE in itn.promotions (duplicates allowed — the same template can be selected many
   *  times for different items). A line is ASSOCIATED with an instance via item.promotionIds (the staged source of
   *  truth); an instance's member items are derived by scanning. One instance can span SEVERAL services (e.g. a
   *  circuit deal needs two lodges — you select it on one, then ADD the second so its conditions match). A promo is a
   *  PLAIN object (no class → save/load needs no prototype rebind). Shape (template & instance share it):
   *    { id, templateId, headOffice, name, supplierId, isManual, isPartiallySupported, note,
   *      bookingWindow:{from,to}, relativeFromDays, relativeToDays, travelDates:[{from,to}],
   *      conditions:[{ conditionType, nights:{min,max}, suppliersTotal:{min,max}, nightsTotal:{min,max},
   *                    paxType, paxCount:{min,max}, age:{min,max} }],
   *      actions:[{ actionType:'DiscountPercentage'|'AddOn', addOn,
   *                 discount:{ discountPercent, targetType:'Total'|'Nights'|'Pax',
   *                            targetNightsType:'Cheapest'|'AnyFromFirst'|'AnyFromLast'|'Any',
   *                            nightsIndexFrom, nightsIndexTo, paxType, paxIndexFrom, paxIndexTo } }] }
   *  SCOPE: accommodations only. An instance's conditions are evaluated against its OWN member accom items (not all
   *  supplier accoms). A MANUAL instance (Add Discount) has no conditions and always matches. The benefit is applied
   *  to the client SELL of member lines only when the instance MATCHES (in a post-price pass, _applyPromotions).
   * ==================================================================== */
  const PromoConditionType = Object.freeze({ SUPPLIER_NIGHTS: 'SupplierNights', SUPPLIERS_TOTAL: 'SuppliersTotal', NIGHTS_TOTAL: 'NightsTotal', PAX_NUMBER: 'PaxNumber', PAX_AGE: 'PaxAge' });
  const PromoActionType = Object.freeze({ DISCOUNT_PERCENTAGE: 'DiscountPercentage', ADD_ON: 'AddOn' });
  const PROMO_PAXTYPE = { Adult: 'ADULT', Child: 'CHILD', Infant: 'INFANT', Teen: 'YOUTH' };   // promo paxType label → itinerary PaxType
  const paxTypeKey = (t) => PROMO_PAXTYPE[t] || String(t || '').toUpperCase();
  const inRange = (v, r) => { if (!r) return true; if (r.min != null && v < r.min) return false; if (r.max != null && v > r.max) return false; return true; };
  const rangeText = (r) => !r ? 'any' : (r.min != null && r.max != null ? (r.min === r.max ? String(r.min) : r.min + '–' + r.max) : r.min != null ? '≥' + r.min : r.max != null ? '≤' + r.max : 'any');
  const accomsOf = (items) => items.filter((u) => u.type === ServiceType.ACCOMMODATION);
  const accomNights = (accoms) => accoms.reduce((a, u) => a + (u.days ? u.days() : 0), 0);
  // distinct pax (by id) across a set of items, optionally of one paxType.
  const paxOfTypeItems = (itn, items, paxType) => { const ids = new Set(); items.forEach((u) => (u.paxIds || []).forEach((id) => ids.add(id))); return [...ids].map((id) => itn.pax.find((p) => p.id === id)).filter(Boolean).filter((p) => !paxType || p.type === paxTypeKey(paxType)); };
  // One condition → true/false. Conditions split into two scopes:
  //   • SuppliersTotal is MEMBER-scoped — it counts the accom lines actually ASSOCIATED with the instance (the grouping
  //     you build by adding services). This is the only condition that REQUIRES associating services (e.g. a circuit).
  //   • every other condition is an ELIGIBILITY threshold evaluated against the supplier's whole accommodation CONTEXT
  //     (ctxAccoms) + the trip's travellers (ctxPax) — so a "total nights ≥ N" deal qualifies from the trip as-is and
  //     does NOT force you to associate extra services.
  const evalConditionItems = (itn, c, memberItems, ctxAccoms, ctxPax) => {
    const memberAccoms = accomsOf(memberItems);
    const px = ctxPax || [];
    switch (c.conditionType) {
      case PromoConditionType.SUPPLIER_NIGHTS: return inRange(accomNights(ctxAccoms), c.nights);
      case PromoConditionType.NIGHTS_TOTAL:    return inRange(accomNights(ctxAccoms), c.nightsTotal || c.nights);
      case PromoConditionType.SUPPLIERS_TOTAL: return inRange(memberAccoms.length, c.suppliersTotal || c.nights);
      case PromoConditionType.PAX_NUMBER:      return inRange(px.filter((p) => !c.paxType || p.type === paxTypeKey(c.paxType)).length, c.paxCount);
      case PromoConditionType.PAX_AGE:         return inRange(px.filter((p) => (!c.paxType || p.type === paxTypeKey(c.paxType)) && inRange(p.age || 0, c.age)).length, c.paxCount || { min: 1 });
      default: return false;
    }
  };
  const promoConditionText = (c) => {
    switch (c.conditionType) {
      case PromoConditionType.SUPPLIER_NIGHTS: return 'Nights at supplier ' + rangeText(c.nights);
      case PromoConditionType.NIGHTS_TOTAL:    return 'Total nights ' + rangeText(c.nightsTotal || c.nights);
      case PromoConditionType.SUPPLIERS_TOTAL: return 'Accommodation lines ' + rangeText(c.suppliersTotal || c.nights);
      case PromoConditionType.PAX_NUMBER:      return (c.paxType || 'Any') + ' pax ' + rangeText(c.paxCount);
      case PromoConditionType.PAX_AGE:         return (c.paxType || 'Any') + ' age ' + rangeText(c.age) + ' (count ' + rangeText(c.paxCount || { min: 1 }) + ')';
      default: return c.conditionType;
    }
  };
  const nightCountOf = (d) => (d.nightsIndexFrom != null && d.nightsIndexTo != null) ? Math.max(1, d.nightsIndexTo - d.nightsIndexFrom + 1) : 1;   // Cheapest/unspecified → a single night
  // A promo REQUIRES multiple services (you must associate ≥2 lines — e.g. a circuit) iff it carries a SuppliersTotal
  // condition whose minimum is >1. Otherwise it's a SINGLE-service, item-specific promo: select it on a line and you're
  // done; there is no "add service" and it is NOT shared across the supplier's other lines (each line selects its own).
  const requiresMultiService = (promo) => ((promo && promo.conditions) || []).some((c) => c.conditionType === PromoConditionType.SUPPLIERS_TOTAL && (c.suppliersTotal ? (c.suppliersTotal.min || 0) : 0) > 1);
  const promoActionText = (a) => {
    if (!a) return '';
    if (a.actionType === PromoActionType.ADD_ON) return 'Add-on: ' + (a.addOn || 'complimentary');
    const d = a.discount || {};
    let scope = 'whole line';
    if (d.targetType === 'Nights') scope = (d.targetNightsType || 'Any') + ' ' + nightCountOf(d) + ' night' + (nightCountOf(d) === 1 ? '' : 's');
    else if (d.targetType === 'Pax') scope = (d.paxType || 'all') + ' pax';
    return (d.discountPercent || 0) + '% off ' + scope;
  };
  // Evaluate a promo (template or instance) against a given set of member items. Returns
  // { matched, inBookingWindow, inTravelDates, conditions:[{description, ok}], memberCount }.
  const evalPromotionItems = (itn, promo, items) => {
    if (!promo) return { matched: false, inBookingWindow: false, inTravelDates: false, conditions: [], memberCount: 0 };
    if (promo.isManual) return { matched: items.length > 0, inBookingWindow: true, inTravelDates: true, conditions: [], memberCount: items.length };
    const today = (itn && itn.currentDate != null) ? isoForDay(itn.currentDate) : null;
    const bw = promo.bookingWindow;
    const inBookingWindow = !bw || ((!bw.from || (today && today >= bw.from)) && (!bw.to || (today && today <= bw.to)));
    const inTravelDates = !promo.travelDates || !promo.travelDates.length || items.length === 0 || items.some((u) => { const sd = u.startDate, ed = u.endDate; return promo.travelDates.some((w) => (!w.from || (ed || sd) >= w.from) && (!w.to || (sd || ed) <= w.to)); });
    // eligibility CONTEXT for the threshold conditions: the supplier's whole accom set + the trip's travellers (SuppliersTotal stays member-scoped).
    const ctxAccoms = (promo.supplierId && itn && itn.activeUnits) ? itn.activeUnits().filter((u) => u.type === ServiceType.ACCOMMODATION && u.supplierId === promo.supplierId) : accomsOf(items);
    const ctxPax = (itn && itn.pax) ? itn.pax : [];
    const conditions = (promo.conditions || []).map((c) => ({ description: promoConditionText(c), ok: evalConditionItems(itn, c, items, ctxAccoms, ctxPax) }));
    const matched = items.length > 0 && !!inBookingWindow && !!inTravelDates && conditions.every((c) => c.ok);
    return { matched, inBookingWindow, inTravelDates, conditions, memberCount: items.length };
  };
  // The active member items of a selected instance (lines whose promotionIds reference it).
  const promoMembers = (itn, inst) => (itn && itn.activeUnits ? itn.activeUnits() : []).filter((u) => (u.promotionIds || []).includes(inst.id));
  const evalPromotion = (itn, inst) => evalPromotionItems(itn, inst, promoMembers(itn, inst));
  // $ off ONE member item from a matched instance's actions, on a given METRIC ('sell' the client price, or 'net' the
  // supplier figure — promos apply to BOTH sides). 'Total'/'Pax' apply per member line; 'Nights' (e.g. a circuit "free
  // night") allocates to the single CHEAPEST member accom — chosen by per-night SELL so the same line is discounted on both metrics.
  const promoItemBenefit = (itn, inst, item, members, metric) => {
    let total = 0;
    const sellBase = (u) => (u.itemTotalPrice ? (u.itemTotalPrice.sellBeforePromos != null ? u.itemTotalPrice.sellBeforePromos : u.itemTotalPrice.totalSell) : 0);
    const baseOf = (u) => (metric === 'net') ? (u.itemTotalPrice ? (u.itemTotalPrice.totalNet || 0) : 0) : sellBase(u);
    const accoms = accomsOf(members);
    (inst.actions || []).forEach((a) => {
      if (a.actionType !== PromoActionType.DISCOUNT_PERCENTAGE) return;
      const d = a.discount || {}, pct = +d.discountPercent || 0; if (!pct) return;
      if (d.targetType === 'Nights') {
        if (!accoms.length) return;
        const cheapest = accoms.reduce((m, u) => (sellBase(u) / Math.max(1, unitsOf(u))) < (sellBase(m) / Math.max(1, unitsOf(m))) ? u : m);
        if (item.id === cheapest.id) total += (baseOf(cheapest) / Math.max(1, unitsOf(cheapest))) * Math.min(unitsOf(cheapest), nightCountOf(d)) * pct / 100;
      } else if (d.targetType === 'Pax') {
        const all = (item.paxIds || []).length || 1;
        const sel = d.paxType ? (item.paxIds || []).filter((pid) => { const p = item._itn.pax.find((x) => x.id === pid); return p && p.type === paxTypeKey(d.paxType); }).length : all;
        total += baseOf(item) * (sel / all) * pct / 100;
      } else total += baseOf(item) * pct / 100;             // 'Total' (whole-line %) — per member line
    });
    return total;
  };
  const manualPct = (p) => (p.actions || []).reduce((a, x) => a + ((x.actionType === PromoActionType.DISCOUNT_PERCENTAGE && x.discount && x.discount.targetType === 'Total') ? (+x.discount.discountPercent || 0) : 0), 0);
  // Build a selected INSTANCE from a catalog template (deep-copied so later catalog edits don't mutate selections).
  const instanceFromTemplate = (itn, tpl) => ({ id: 'PI' + itn._nextId(), templateId: tpl.id, headOffice: tpl.headOffice || null, name: tpl.name, supplierId: tpl.supplierId, isManual: false, isPartiallySupported: !!tpl.isPartiallySupported, note: tpl.note || '', bookingWindow: tpl.bookingWindow ? deep(tpl.bookingWindow) : null, relativeFromDays: tpl.relativeFromDays != null ? tpl.relativeFromDays : null, relativeToDays: tpl.relativeToDays != null ? tpl.relativeToDays : null, travelDates: deep(tpl.travelDates || []), conditions: deep(tpl.conditions || []), actions: deep(tpl.actions || []) });
  const makeManualPromo = (itn, item, descr, amount) => ({ id: 'PI' + itn._nextId(), templateId: null, headOffice: null, name: descr || 'Discount', supplierId: item.supplierId, isManual: true, isPartiallySupported: false, note: '', bookingWindow: null, relativeFromDays: null, relativeToDays: null, travelDates: [], conditions: [], actions: [{ id: 'a1', actionType: PromoActionType.DISCOUNT_PERCENTAGE, discount: { discountPercent: amount, targetType: 'Total' } }] });

  class Item {
    constructor(itn, props) {
      this._itn = itn;                         // back-reference to the aggregate (non-enumerable)
      Object.defineProperty(this, '_itn', { enumerable: false, value: itn });
      // Legacy/test convenience props: a bare numeric systemPrice/manualPrice + hypothetical seed a FLAT itemPrice.
      const p = Object.assign({}, props);
      const seedSystem = p.systemPrice, seedManual = p.manualPrice, seedHypo = p.hypothetical;
      delete p.systemPrice; delete p.manualPrice; delete p.hypothetical;
      Object.assign(this, {
        id: null, parentId: null, type: ServiceType.ACTIVITY, name: '', supplierId: 'C',
        startDate: null, endDate: null,
        // location/routing — descriptive (NOT in SPEC_FIELDS, so it never perturbs the commercial fingerprint). A stay /
        // insurance / activity sits AT `location`; a transfer moves `fromLocation` → `toLocation`. Drives continuity().
        location: null, fromLocation: null, toLocation: null,
        rates: { ADULT: 0, CHILD: 0, INFANT: 0 },
        rateType: { ...RT_DEFAULT },           // { chargeType:'Person'|'Unit', timeUnit:'Night'|'Day'|'Stay' }
        paxIds: [],
        qty: 1,                                // commercial quantity (units of this service); scales the computed price
        qtyLocal: false,                       // extra only: true once its qty was set independently → stops following the parent service
        datesLocal: false,                     // extra only: true once its dates were set independently → stops following the parent service window
        itemSystemPrice: null,                 // DERIVED: system net/rack/sell breakdown (+ systemMargin) — built below
        itemManualPrice: null,                 // EDITABLE intent (shown in the change diff): manual total/margin/overrides/validatedNet/hypothetical
        promotionIds: null,                    // EDITABLE: ids of selected promo INSTANCES (itn.promotions) this line belongs to (change diff + docs/voucher)
        itemTotalPrice: null,                  // DERIVED: manual breakdown + totals (net/rack/sell) + sellBeforePromos/promoDiscount/effectiveSell + overpriced
        _status: ServiceStatus.NEW,            // backing field; `status` is a derived accessor (see below)
        // --- staging / change overlay ---
        origin: 'BASELINE',                    // BASELINE (committed) | PENDING (new in current change)
        pendingOp: null,                       // ADD | MODIFY | CANCEL | REMOVE | null
        prevOp: null,                          // the op REMOVE replaced (MODIFY|null) — so Restore returns to MODIFY, not all the way to baseline
        committed: null,                       // baseline SPEC snapshot (for revert)
        committedLife: null,                   // baseline lifecycle snapshot (for revert)
        cancelIntent: null,                    // { fee, refund } staged on CANCEL
        dropNoFee: false,                      // staged drop-rejected (R-CN-08): on Apply, refund any overpayment
        opsReady: false,
        cancellation: null,                    // realised { fee, refund } after apply
        requestOnApply: false,                 // queued by "Confirm" → the supplier voucher is raised at the next voucher generation (Send Vouchers, or a PostBookingModif Apply)
        confirmOnApply: false,                  // queued by revertAmend's compensating voucher → on Apply the voucher is raised (if needed) AND confirmed (R-IT-05 / R-VC-01); pre-VOUCHERED it just sets intent
        // --- supplier-side commercial triple (target is derived live) ---
        requested: null,                       // { fp, price, ver, state:'AWAITING'|'REJECTED', at, voucherId, lineId }
        confirmed: null,                       // { fp, price, ver, at, voucherId, lineId }
        paymentTerms: null,                    // service only: { depositPct, dueDays } copied from supplier on first confirm
        priorRequested: null,                  // superseded request still racing { fp, price, ver, resolved }
        supplierAside: null,                   // late/aside supplier note { state, ver, ctx, at }
        holds: [],                             // supplier holds: [{ id, fp, price, expiresAt, expired, status:'HELD'|'RELEASED', at }]
        locked: false,                         // true once a SupplierPayment is recorded for this line's supplier → closed to all item actions except Unlock (FIN only)
        documents: [],                         // per-item attached documents [{ id, title, description, at }] — distinct from generated quotes/invoices/FCAs; NOT part of pending changes
        extras: [],
      }, p);
      this.rates = normalizeRates(this.rates);                         // rate card → { type: {net,rack,sell} } triples
      this.startDate = isoDate(this.startDate); this.endDate = isoDate(this.endDate);   // any date input ('D1' / ISO) → stored ISO
      if (!this.rateType) this.rateType = { ...RT_DEFAULT };
      if (!this.itemManualPrice) initItemPrice(this, seedSystem, seedManual, seedHypo);   // not restored from a spec snapshot → build fresh
      else refreshDerived(this);                                       // restored: refresh the derived totals from the restored fields
    }

    /**
     * status — INTENT only: a line sits at NEW (arranging supplier holds) until it commits to CONFIRMED or
     * CANCELLED. Supplier holds are a separate record (see `holds` / the "Add Hold" action) — they no longer
     * derive the status. Supplier-sync (waiting / refused) is carried by `supplier status`, not status.
     */
    get status() {
      if (HOLD_PHASE.includes(this._status)) return this._preCommitStatus();
      return this._status;
    }
    set status(v) { this._status = v; }
    // Pre-commitment status — always NEW (holds are a separate record, they don't drive status).
    _preCommitStatus() { return ServiceStatus.NEW; }

    /**
     * activeStatus — the status that transition GUARDS gate against. A staged lifecycle edit
     * (markAwaiting/confirm/reset) bumps the live `status` optimistically, but the line's real,
     * supplier-visible status is the committed baseline in `committedLife` — which async supplier
     * events keep current while a change is open (e.g. _confirmVoucher advances it to CONFIRMED).
     * A pending-ADD line never snapshots `committedLife`: its queued request/confirm sets an
     * optimistic CONFIRMED with nothing out yet → fall back to the pre-commit status (NEW).
     */
    get activeStatus() {
      if (this.committedLife) return this.committedLife.status;
      if ((this.requestOnApply || this.confirmOnApply) && this._status === ServiceStatus.CONFIRMED
          && !this.requested && !this.confirmed) return this._preCommitStatus();
      return this.status;
    }

    /* ---- identity ---- */
    isService() { return !this.parentId; }
    isExtra() { return !!this.parentId; }
    parent() { return this.isExtra() ? this._itn.findItem(this.parentId) : null; }

    /* ---- projected lifecycle ---- */
    // A CANCELLED line is inactive for billing/voucher purposes — it no longer bills, holds, or rides future
    // vouchers. If its cancel-ask is still out to the supplier (requested AWAITING/REJECTED), supplier status keeps
    // running on it (see `supplier status`) so that pending/refused cancellation still surfaces.
    isActive() { return !(this.status === ServiceStatus.CANCELLED || this.pendingOp === PendingOp.REMOVE); }
    isBillable() { return this.isActive() && this.pendingOp !== PendingOp.CANCEL; }
    isAuto() { return Constants.AUTO_CONFIRM.includes(this.type); }

    /* ---- pricing ---- */
    days() {
      // an extra uses its OWN dates when it carries them (validated to sit within the parent), else the parent's.
      const useSelf = this.isService() || (this.startDate && this.endDate);
      const s = useSelf ? this : this.parent();
      if (!s) return 1;
      const a = parseInt(String(s.startDate || '').replace(/\D/g, '')) || 1;
      const b = parseInt(String(s.endDate || '').replace(/\D/g, '')) || a;
      return Math.max(1, b - a);
    }
    /* ---- price accessors (scalar names delegate to the split itemSystem/Manual/TotalPrice fields) ---- */
    // Effective (discounted) CLIENT sell — what the itinerary bills. Derived; do not assign.
    get sellPrice() { return this.itemTotalPrice ? this.itemTotalPrice.effectiveSell : 0; }
    // NET figure the SUPPLIER is asked to honour (the voucher/supplier status side).
    netFigure() { return this.itemTotalPrice ? this.itemTotalPrice.totalNet : 0; }
    // Back-compat scalar accessors so existing readers keep working.
    get systemPrice() { return this.itemSystemPrice ? this.itemSystemPrice.total.sell : 0; }
    set systemPrice(v) { if (!this.itemSystemPrice) return; const n = +v, m = this.itemSystemPrice.systemMargin, h = this.itemSystemPrice.hypothetical; this.itemSystemPrice = { total: p3(n, n, n), unitPrices: [{ idx: null, price: p3(n, n, n) }], paxPrices: [], systemMargin: m, hypothetical: h }; refreshDerived(this); }
    get manualPrice() { return (this.itemManualPrice && this.itemManualPrice.manualTotalSell != null) ? this.itemManualPrice.manualTotalSell : null; }
    set manualPrice(v) { if (!this.itemManualPrice) return; this.itemManualPrice.manualTotalSell = (v == null ? null : +v); refreshDerived(this); }
    // hypothetical lives on the SYSTEM price (an unvalidated estimate; default true, cleared by Validate price).
    get hypothetical() { return this.itemSystemPrice ? this.itemSystemPrice.hypothetical : true; }
    set hypothetical(v) { if (this.itemSystemPrice) this.itemSystemPrice.hypothetical = !!v; }
    /** The system price's effective sell figure (derived from the rate card). */
    computedPrice() { return this.itemSystemPrice ? this.itemSystemPrice.total.sell : 0; }
    /** Effective deposit %: terms captured at confirm (a service's own, an extra's inherited) win over the static supplier config. */
    depositPct() {
      const sched = this.isService() ? this : (this.parent() || this);
      return (sched && sched.paymentTerms) ? sched.paymentTerms.depositPct : Suppliers[this.supplierId].depositPct;
    }
    /** Effective balance dueDays for this line (confirmed terms win over the supplier default; an extra follows its parent). */
    dueDays() {
      const sched = this.isService() ? this : (this.parent() || this);
      const terms = sched ? sched.paymentTerms : null;
      return (terms && terms.dueDays != null) ? terms.dueDays : (Suppliers[sched ? sched.supplierId : this.supplierId] || { balanceDays: 0 }).balanceDays;
    }
    /** Supplier-payment due DAY for this line — its travel start minus the effective dueDays (an extra follows its parent
     *  service). Signed (≤ 0 when the trip is nearer than the terms window); null when undated. Drives the item list/modal. */
    supplierDueDay() {
      const sched = this.isService() ? this : (this.parent() || this);
      return (sched && sched.startDate != null) ? dayNum(sched.startDate) - this.dueDays() : null;
    }

    /* ---- SPEC snapshotting (versioned intent) ---- */
    spec() { const s = {}; SPEC_FIELDS.forEach((f) => { s[f] = deep(this[f]); }); return s; }
    applySpec(s) { SPEC_FIELDS.forEach((f) => { if (f in s) this[f] = deep(s[f]); }); }
    baseSpec() { return (this.committed && this.pendingOp !== PendingOp.ADD) ? this.committed : this.spec(); }

    /* ---- commercial fingerprint: what a supplier is asked to honour (NET side) ----
     * Carries the NET commercial spec only — net rates, the net figure, rateType and the promotions (which the
     * voucher shows the supplier: manual promos + the selected catalog promotions). It deliberately EXCLUDES the
     * client-side sell (manual total/margin/sell overrides, rack): a pure markup/margin/sell change does NOT move
     * the fingerprint, so it never re-triggers a supplier request. Only net, rateType, dates, pax, qty or promotions do. */
    fingerprint() {
      return JSON.stringify({
        supplierId: this.supplierId, startDate: this.startDate, endDate: this.endDate,
        paxIds: sortedIds(this.paxIds), qty: this.qty || 1,
        rateType: this.rateType, rates: netRatesOf(this.rates),
        totalNet: this.netFigure(),
        promos: sortedIds(this.promotionIds || []),   // the selected promo INSTANCES this line belongs to (shown to the supplier on the voucher)
      });
    }
    /** target = the NET figure+spec the seller currently asks the supplier to honour (live). */
    target() { return { fp: this.fingerprint(), price: this.netFigure() }; }

    /**
     * nextStatus — the status the NEXT Apply will move this line to, if different from now (else null).
     * Pure-derived from the queued intents (no stored state): it makes a queued transition that doesn't yet
     * show in `status` visible (e.g. confirming an AWAITING line → "→ CONFIRMED on Apply"). Returns null when
     * the landing equals the current status (e.g. markAwaiting already set AWAITING), so no redundant row shows.
     */
    nextStatus() {
      const n = this.confirmOnApply ? ServiceStatus.CONFIRMED
              // a staged cancel lands on CANCELLED on Apply; any cancel-ask still out surfaces via supplier status.
              : this.pendingOp === PendingOp.CANCEL ? ServiceStatus.CANCELLED
              : this.requestOnApply ? ServiceStatus.CONFIRMED
              : null;
      return (n && n !== this.status) ? n : null;
    }

    /**
     * supplier status — DERIVED from (target, requested, confirmed). See the
     * truth table in the design notes; evaluated top-down, first match wins.
     */
    get supplierStatus() {
      const t = this.fingerprint();
      const r = this.requested, c = this.confirmed;
      const cancelled = this.status === ServiceStatus.CANCELLED;
      // A line STAGED for cancel (pre-Apply) but still engaged with the supplier (a request/confirmation is out)
      // still owes the supplier a cancel-ask — it will be raised on Apply → NeedsRequest (so it surfaces, not Booked).
      if (this.pendingOp === PendingOp.CANCEL && !cancelled && (r != null || c != null)) return SupplierStatus.NeedsRequest;
      // cancelled/removed → nothing to track. EXCEPT a CANCELLED line whose cancel-ask is still out to the
      // supplier (requested AWAITING, or REJECTED if they refused the cancellation): keep deriving so it surfaces
      // (AwaitingSupplier until they confirm the cancellation, Rejected if they refuse it).
      const cancelAskOut = cancelled && r && (r.state === 'AWAITING' || r.state === 'REJECTED');
      if (!this.isBillable() && !cancelAskOut) return SupplierStatus.Booked;
      if (r) {
        // The figure "out to the supplier" is the live voucher line if this request points at one,
        // else the request itself (keeps the standalone truth-table semantics intact). A refusal is
        // recorded on the live voucher line (voucher-level reject).
        const line = this.liveLine();
        const fp = line ? line.fp : r.fp;
        // supplier refused → resolve (Rejected), UNLESS the target has since moved past the refused figure
        // (fp != target) → there is nothing to resolve, just (re)raise a request for the new intent → NeedsRequest.
        if (r.state === 'REJECTED' || (line && line.state === 'REJECTED')) return fp === t ? SupplierStatus.Rejected : SupplierStatus.NeedsRequest;
        if (cancelAskOut) return SupplierStatus.AwaitingSupplier;          // CANCELLED + live cancel-ask still pending
        return fp === t ? SupplierStatus.AwaitingSupplier                 // request still matches intent
                        : SupplierStatus.NeedsRequest;                     // intent moved → stale request, (re)raise
      }
      if (c && c.fp === t) return SupplierStatus.Booked;                  // agreed figure == intent
      return SupplierStatus.NeedsRequest;                                  // need to (re)raise a request
    }

    /**
     * isUpdated — a derived LABEL (not a status): a CONFIRMED line whose agreed figure no longer matches the
     * current target, i.e. it was amended after the supplier confirmed. The line stays CONFIRMED; the old UPDATED
     * status is gone. (Supplier status will read NeedsRequest/AwaitingSupplier alongside it.)
     */
    get isUpdated() {
      return this._status === ServiceStatus.CONFIRMED && this.confirmed != null && this.confirmed.fp !== this.fingerprint();
    }

    /**
     * Whether supplier status is yet relevant for this line. Hold-phase lines
     * (NEW) only become relevant once vouchers are issued for their context —
     * the itinerary reaching VOUCHERED/CONFIRMED. A hold-phase line staged in a pending change is
     * never relevant yet: its voucher is only raised at Apply (a change has no separate voucher
     * step). Lines past the hold phase are always relevant.
     */
    supplierStatusRelevant() {
      if (!HOLD_PHASE.includes(this.status)) return true;
      if (this.origin === 'PENDING' || this.pendingOp) return false;   // staged: its voucher is raised at Apply
      return ['VOUCHERED', 'CONFIRMED'].includes(this._itn.status);
    }
    /** supplier status as surfaced to the UI/read-models: the derived value, or null while not yet relevant. */
    get supplierStatusShown() { return this.supplierStatusRelevant() ? this.supplierStatus : null; }

    /** Holds are disabled once the line is agreed (has a confirmed figure) or cancelled/cancelling — they no longer matter. */
    holdsDisabled() { return this.confirmed != null || this._status === ServiceStatus.CANCELLED; }
    /** Active supplier holds — none once disabled; otherwise neither expired nor RELEASED (these cover the target / derive status). */
    activeHolds() { return this.holdsDisabled() ? [] : (this.holds || []).filter((x) => !x.expired && x.status !== HoldStatus.RELEASED); }
    /** True when a live (non-expired, non-released) hold exists but none cover the current target spec. */
    get holdMismatch() {
      const live = this.activeHolds();
      if (live.length === 0) return false;            // no live hold (all expired/released) → nothing to mismatch
      const t = this.fingerprint();
      return !live.some((x) => x.fp === t);
    }
    /**
     * activeHold — the single most-relevant hold to surface in the item list (computed from `holds` + the current
     * target). Status: HELD (a live hold; `covers` flags whether it matches the current spec), EXPIRED (its expiry
     * passed), or VOIDED (released). Null once the line is agreed/cancelled (holds no longer matter) or has none.
     */
    get activeHold() {
      if (this.holdsDisabled() || !(this.holds || []).length) return null;
      const t = this.fingerprint();
      const live = this.holds.filter((h) => !h.expired && h.status !== HoldStatus.RELEASED);
      const h = live.find((x) => x.fp === t) || live[0] || this.holds[this.holds.length - 1];
      const status = (!h.expired && h.status !== HoldStatus.RELEASED) ? 'HELD' : (h.expired ? 'EXPIRED' : 'VOIDED');
      return { id: h.id, status, price: h.price, expiresAt: h.expiresAt, covers: status === 'HELD' && h.fp === t };
    }

    /** A change-created request that is still out to the supplier (gates discard). */
    hasLiveRequest() {
      return !!(this.requested && this.requested.state === 'AWAITING' &&
        // an ADD's first voucher, OR a live amendment whose figure differs from the confirmed baseline (covers an
        // amended CONFIRMED line both before and after a revert is staged — isUpdated alone misses the post-revert
        // state where the spec is restored but the amendment voucher is still out), OR a MODIFY re-voucher race.
        (this.pendingOp === PendingOp.ADD || (this.confirmed != null && this.requested.fp !== this.confirmed.fp) ||
         (this.pendingOp === PendingOp.MODIFY && !!this.priorRequested)));
    }
    /**
     * True when this line's live request is the BASELINE one — captured in committedLife at change-open,
     * i.e. raised by a PRIOR Apply, not by the current change. Discarding the change restores it untouched
     * (no voucher is un-sent), so such a request must NOT block discard (R-CH-24). A line with committedLife
     * unset (a PENDING/ADD line — which has no live request pre-Apply anyway) returns false: never a false baseline.
     */
    liveRequestIsBaseline() {
      const cl = this.committedLife;
      return !!(this.requested && cl && cl.requested &&
        cl.requested.state === 'AWAITING' &&
        cl.requested.voucherId === this.requested.voucherId &&
        cl.requested.ver === this.requested.ver);
    }

    /** Convenience display label for the voucher line (derived from the triple). */
    lineLabel() {
      if (this.requested) return this.requested.state === 'REJECTED' ? 'REJECTED' : 'PENDING';
      if (this.confirmed) return 'CONFIRMED';
      return null;
    }
    lineVer() { return this.requested ? this.requested.ver : (this.confirmed ? this.confirmed.ver : null); }

    /** The live voucher line this item's open request points at (or null) — the supplier-facing source of truth. */
    liveLine() {
      if (!this.requested || !this.requested.voucherId) return null;
      const v = this._itn.voucherById(this.requested.voucherId);
      return v ? v.lineFor(this.id) : null;
    }
  }

  /* ======================================================================
   * 2b. Voucher entity  (a per-supplier request — the unit of supplier interaction)
   *     One voucher per supplier, snapshotting a LINE for every one of that
   *     supplier's items. Confirm/reject is ALL-OR-NOTHING across its lines.
   *     A re-issue SUPERSEDES the supplier's previous live voucher.
   * ==================================================================== */
  class Voucher {
    constructor(itn, props) {
      Object.defineProperty(this, '_itn', { enumerable: false, value: itn });
      Object.assign(this, {
        id: null, supplierId: null, ver: 0,
        status: VoucherStatus.SENT,
        at: null, sentAt: null,
        supersedes: null,            // id of the voucher this one replaced
        supersededBy: null,          // id of the voucher that replaced this one
        bookingId: null,             // supplier booking ref (copied from the supplier-level booking on confirm)
        comment: null,               // supplier comment on reject (required)
        resolvedAt: null,            // when confirmed/rejected, or a prior-race was acknowledged
        lines: [],                   // [{ itemId, parentId, action, fp, price, ver, holdId, terms, state }]
      }, props);
    }
    isLive() { return this.status === VoucherStatus.SENT; }          // P2 may widen (e.g. DRAFT not-yet-sent)
    isSuperseded() { return this.status === VoucherStatus.SUPERSEDED; }
    /** A superseded voucher the supplier may still answer (the R-IF-06 race), until acknowledged. */
    isPriorRace() { return this.isSuperseded() && !this.resolvedAt; }
    serviceLines() { return this.lines.filter((l) => !l.parentId); }
    lineFor(itemId) { return this.lines.find((l) => l.itemId === itemId) || null; }
  }

  /* ======================================================================
   * 3. Aggregate root: Itinerary
   * ==================================================================== */

  class Itinerary {
    constructor() {
      this.title = 'Maasai Mara Safari';
      this.itineraryType = ItineraryType.BOOKING;   // BOOKING (full spine) | BROCHURE (DRAFT↔PREPARED planning shell)
      this.agencyAgent = 'Agent A';   // who the booking is for — a BOOKING field only (a brochure carries none → null)
      this.inquiryId = null;          // optional source-inquiry reference (set when a brochure is converted)
      this.status = ItineraryStatus.DRAFT;
      this.paymentStatus = PaymentStatus.NEW;
      this.pendingStatus = 'NONE';
      this.pax = [];
      this.items = [];
      this.promotionCatalog = [];        // promotion TEMPLATES (the available menu) — seeded; selecting one creates an instance below
      this.promotions = [];              // selected promo INSTANCES (dups allowed) — plain objects; lines associate via item.promotionIds
      this.changeSet = null;             // { status, trigger, type, t } — type ∈ ModificationType (Pre/PostBookingModif)
      this.payments = [];
      // First-class client deposit — system figure (Σ sellPrice × depositPct, recomputed while unpaid & not manually
      // overridden) vs an optional manual override; `skip` drops it from the schedule; frozen once `paid` (R-MN-05).
      this.deposit = { systemAmt: 0, systemDue: null, paid: false, manualAmt: null, manualDue: null, skip: false };
      this.firstInvoiceDate = null;      // day-number `currentDate` stamped when the first invoice doc is generated; frozen thereafter (drives the deposit due)
      // Custom (user-added) payment milestones — each carves a dated slice out of the outstanding balance. The deposit
      // and the live "outstanding" residual are DERIVED (milestoneSchedule()), not stored here. custom:true always.
      this.paymentMilestones = [];       // [{ id, type, amt, prcOfTotal, due, custom:true, paid, comment }]
      // Frozen settled-outstanding records (R-MN-09): the moment the dynamic OUTSTANDING residual is fully covered it is
      // snapshotted here as a paid RECEIVE milestone, so a later balance change (e.g. a cancellation's retained fee)
      // emits a FRESH outstanding/refund line instead of flipping the already-settled one negative.
      this.recordedOutstanding = [];     // [{ id, type, amt, due, paid:true, comment }]
      // Pax tag high-water mark per type code (ADT/CHD/INF) — a traveller tag (ADT1, ADT2, …) never reuses a number
      // across the itinerary's history: remove ADT2 then add a new adult → ADT3 (see addPax / item 10).
      this.paxSeq = {};
      this.quotes = [];                  // generated client quotes — immutable snapshots of the itinerary at issue (newest last)
      this.invoices = [];                // generated client invoices — immutable snapshots of the itinerary at issue (newest last)
      this.fcas = [];                    // generated Final Confirmation Advices — immutable snapshots (post-CONFIRMED, all lines OPS_READY; newest last)
      this.versions = [];                // itinerary version snapshots — one immutable dbDocument() per applied pending change (newest last)
      this.history = [];
      this.selectedId = null;            // focused item for item-actions (set by the UI)
      this.vouchers = [];                // first-class per-supplier Vouchers (newest last)
      this.supplierBookings = {};        // supplierId → booking ref (one per supplier, set on first confirm)
      this.supplierPayments = [];        // [{ supplierId, amount, comment, at }] — money paid OUT to a supplier (locks that supplier's lines)
      this.supplierLocks = {};           // supplierId → bool — a locked supplier cascades Item.locked onto every one of its lines (Unlock is FIN-only)
      // Operating user — drives role-gated actions (FIN may Unlock). availableUsers is one per role; currentUser defaults to the first (SP).
      this.availableUsers = AvailableUsers.map((u) => ({ ...u }));
      this.currentUser = this.availableUsers[0];
      this.vver = 0;                     // voucher version counter
      this.clock = 0;
      // Travel span (recomputed from the items on every recompute) and the demo "today".
      this.travelStart = null;           // day number — min active item start (null if no dated lines)
      this.travelEnd = null;             // day number — max active item end
      this.currentDate = dayNum('D1') + DEFAULT_CURRENT_OFFSET;  // demo clock — default 100 days before D1 (day −99); override via changeCurrentDate()
      this._idc = 1;
      this.creditTerms = false;
      // PRICE-ENGINE config (simulates the future search-service / price-engine). The per-line sell build-up is
      //   net → (promo discount) → purchase → CPS margin + TC commission → last-contracted sell → compound uplift → sell.
      // The CPS margin + TC commission come from the selected AGENCY (this.agencyAgent → Agencies preset; set in the
      // header). The compound (future) uplift is an "extra margin" applied only to HYPOTHETICAL lines whose travel year
      // is past baseYear (future dates without confirmed rates), compounded per year out.
      this.futureUplift = { rate: 15, baseYear: anchorYear() };  // { rate(%), baseYear } — uplift measured from baseYear
      this.financeLocked = false;
      this.fcaGenerated = false;         // Final Confirmation Advice issued (post-CONFIRMED, all lines OPS_READY)
      this.lostReason = null;
    }

    /** Factory: a fresh, seeded demo itinerary (2 adults, 1 child, 3 services + extra). */
    static create() { const itn = new Itinerary(); itn._seed(); return itn; }

    /**
     * Swap this aggregate's entire state for a freshly-built one (clear → copy → re-bind). Object.assign copies
     * the entities but their non-enumerable `_itn` still points at the throwaway `fresh` aggregate — re-bind, or
     * every derived read (status, pax, items) silently goes stale. Shared by reset()/the scenario presets.
     */
    _swapWith(fresh) {
      Object.keys(this).forEach((k) => { delete this[k]; });
      Object.assign(this, fresh);
      const rebind = (e) => Object.defineProperty(e, '_itn', { enumerable: false, value: this });
      this.units().forEach(rebind);
      this.vouchers.forEach(rebind);
      return this;
    }

    /** Reset back to the seeded starting point (special method known by the UI). */
    reset() { return this._swapWith(Itinerary.create()); }

    /**
     * Full-state export — serialize the ENTIRE aggregate to a JSON string (special method known by the UI: the
     * header Save button). Captures everything needed to restore the exact state: every item (+ its extras),
     * voucher, payment, milestone, the open pending change, documents, generated quotes/invoices/FCAs, versions,
     * the demo clock and the current user. The `_itn` back-references are non-enumerable and the derived
     * `status`/`activeStatus`/`reconciliation` accessors live on the prototype, so JSON.stringify naturally emits
     * only the own data — no cycles, no read-models. Round-trips through loadFromJSON(). A `__metadata` envelope
     * (simulator version) is prepended; loadFromJSON strips it back off so it never pollutes the aggregate.
     */
    serialize(pretty) {
      const snapshot = Object.assign({ __metadata: { simVersion: SIM_VERSION } }, this);   // __metadata first; own enumerable props follow
      return JSON.stringify(snapshot, null, pretty ? 2 : 0);
    }

    /** The simulator version a serialized snapshot was saved with (or null if unstamped) — lets the view confirm a cross-version load. */
    static snapshotVersion(text) { try { const d = JSON.parse(text); return (d && d.__metadata && d.__metadata.simVersion) || null; } catch (e) { return null; } }
    /** The current simulator version (so the view can compare without reaching into CONFIG). */
    static get version() { return SIM_VERSION; }

    /**
     * Load a full-state snapshot produced by serialize() (special method known by the UI: the header Load button).
     * Parses `text`, validates it is an itinerary snapshot, then swaps THIS aggregate's entire state for it — the
     * same clear → copy → re-bind dance as reset(). Returns this. THROWS on malformed JSON or a payload that is not
     * an itinerary snapshot — the view catches it, shows the "could not parse" modal and resets to the default itny.
     */
    loadFromJSON(text) {
      const data = JSON.parse(text);                               // throws SyntaxError on malformed JSON
      if (!data || typeof data !== 'object' || !Array.isArray(data.items) || !Array.isArray(data.pax) || typeof data.status !== 'string')
        throw new Error('not an itinerary snapshot');
      delete data.__metadata;                                      // strip the save envelope — it is not aggregate state
      const fresh = new Itinerary();
      Object.keys(fresh).forEach((k) => { delete fresh[k]; });
      Object.assign(fresh, data);
      // The parsed items/vouchers are plain objects — re-attach their entity prototypes so the derived accessors
      // and methods work again. _swapWith re-binds each `_itn` back-reference to the live aggregate.
      (fresh.items || []).forEach((s) => { Object.setPrototypeOf(s, Item.prototype); (s.extras || []).forEach((e) => Object.setPrototypeOf(e, Item.prototype)); });
      (fresh.vouchers || []).forEach((v) => Object.setPrototypeOf(v, Voucher.prototype));
      if (!Array.isArray(fresh.promotions)) fresh.promotions = [];          // selected promo instances (plain objects, no rebind)
      if (!Array.isArray(fresh.promotionCatalog)) fresh.promotionCatalog = [];   // promotion templates; default for pre-2.3 saves
      // currentUser was serialized as a standalone copy — re-point it to the matching availableUsers entry (identity).
      if (fresh.currentUser && Array.isArray(fresh.availableUsers)) { const m = fresh.availableUsers.find((u) => u.name === fresh.currentUser.name); if (m) fresh.currentUser = m; }
      return this._swapWith(fresh);
    }

    /**
     * Demo control — load one of the Reset-dropdown starting scenarios (special method known by the UI). Async
     * because the driven presets walk the happy path. `empty` (bare DRAFT), `default` (the seeded start), `huge`
     * (two pax groups on intersecting routes) and `extreme` (two gateways joining at one lodge, then one trip ends &
     * one continues) are pure seeds; `quoted`/`invoiced`/`invoicedPaid`/`vouchered`/`completed` drive the seeded
     * itinerary through happyPath() and stop at that milestone.
     */
    async loadScenario(name) {
      switch (name) {
        case 'empty': return this._resetEmpty();
        case 'huge': return this._resetHuge();
        case 'extreme': return this._resetExtreme();
        case 'default': return this.reset();
        case 'quoted': case 'invoiced': case 'invoicedPaid': case 'vouchered':
          return this.happyPath(name);
        case 'completed': default:
          return this.happyPath();
      }
    }

    /** Empty starting point: a bare DRAFT itinerary with no travellers or services (demo control). */
    _resetEmpty() {
      const fresh = new Itinerary();
      fresh.history = []; fresh.clock = 0; fresh.recompute();
      this._swapWith(fresh);
      this._log('demo', 'empty itinerary (DRAFT) — no travellers or services');
      return this;
    }

    /** "Huge" starting point: two pax groups on intersecting routes (built fresh, then swapped in like reset()). */
    _resetHuge() {
      const fresh = new Itinerary();
      fresh._seedHuge();
      this._swapWith(fresh);
      return this;
    }

    /** "Extreme" starting point: two groups, different entry points/days, joining at one accommodation then forking — one ends, one continues (built fresh, swapped in like reset()). */
    _resetExtreme() {
      const fresh = new Itinerary();
      fresh._seedExtreme();
      this._swapWith(fresh);
      return this;
    }

    /** Reset to a fresh, seeded BROCHURE (demo control — like reset(), but the type is BROCHURE not BOOKING; no Agency/Agent). */
    resetAsBrochure() { this.reset(); this.itineraryType = ItineraryType.BROCHURE; this.agencyAgent = null; this._log('demo', 'new brochure (DRAFT) — DRAFT ↔ PREPARED only until converted'); return this; }

    /**
     * Copy as Brochure — replace the current state with a fresh BROCHURE (DRAFT) holding a cleaned copy of this
     * itinerary: only NEW & CONFIRMED items, and only their commercial data + system price (promotions dropped). Manual
     * pricing, supplier locks, the supplier lifecycle (holds/requests/confirmations/payment terms), payments,
     * vouchers, documents and any open change are all dropped. Like reset(), it swaps `this` for a freshly built
     * aggregate and re-binds the entities' back-reference.
     */
    _copyAsBrochure() {
      // NEW/CONFIRMED and still billable — excludes CANCELLED and any line being cancelled/removed (pendingOp CANCEL/REMOVE).
      const copyable = (u) => u.isBillable() && (u.status === ServiceStatus.NEW || u.status === ServiceStatus.CONFIRMED);
      const fresh = new Itinerary();
      fresh.itineraryType = ItineraryType.BROCHURE; fresh.agencyAgent = null; fresh.inquiryId = null;
      fresh.status = ItineraryStatus.DRAFT; fresh.title = this.title; fresh._idc = this._idc;
      // travellers are commercial data — copy the committed pax set (drop pending adds/removes)
      fresh.pax = this.pax.filter((p) => p.origin !== 'PENDING' && !p.pendingRemove).map((p) => ({ id: p.id, type: p.type, name: p.name, origin: 'BASELINE', pendingRemove: false }));
      // copy NEW/CONFIRMED services and their NEW/CONFIRMED extras — commercial spec + system price only (promotions dropped)
      this.items.filter(copyable).forEach((s) => {
        const svc = fresh._brochureCopyItem(s, null); fresh.items.push(svc);
        (s.extras || []).filter(copyable).forEach((e) => { const ex = fresh._brochureCopyItem(e, svc.id); delete ex.extras; svc.extras.push(ex); });
      });
      fresh.recompute();
      // swap fresh → this (same dance as reset(): clear, copy, re-bind every entity's back-reference)
      Object.keys(this).forEach((k) => { delete this[k]; });
      Object.assign(this, fresh);
      this.units().forEach((e) => Object.defineProperty(e, '_itn', { enumerable: false, value: this }));
      this._log('seller', 'copied as Brochure — NEW & CONFIRMED items only · commercial data + system price (no promotions, manual pricing, locks, supplier lifecycle, payments, vouchers or documents)');
      return this;
    }
    /** One clean brochure-copy item: commercial spec + system price (rebuilt from the rate card at the copied margin); no promotions, manual pricing, locks or supplier lifecycle. */
    _brochureCopyItem(src, parentId) {
      const it = this._newItem({ id: src.id, parentId: parentId || null, type: src.type, name: src.name, supplierId: src.supplierId, startDate: src.startDate, endDate: src.endDate, rates: deep(src.rates), rateType: deep(src.rateType), paxIds: [...(src.paxIds || [])], qty: src.qty || 1 });
      if (src.itemSystemPrice) it.itemSystemPrice.systemMargin = src.itemSystemPrice.systemMargin;   // preserve the configured margin
      // promotions are aggregate-level selected instances tied to specific lines — a brochure copy drops them (no supplier lifecycle).
      it.promotionIds = [];
      recomputeItemPrice(it, true);                                                                  // rebuild the system price from the copied rate card; manual pricing stays empty
      return it;
    }
    /** Demo control: flip the itinerary type (BOOKING ↔ BROCHURE). Convert-to-Itinerary is the in-flow promotion. */
    setItineraryType(type) { this.itineraryType = (type === ItineraryType.BROCHURE) ? ItineraryType.BROCHURE : ItineraryType.BOOKING; if (this.isBrochure()) this.agencyAgent = null; else if (!this.agencyAgent) this.agencyAgent = 'Agent A'; this._log('demo', 'itinerary type → ' + this.itineraryType); return this; }
    /**
     * Select the booking's agency/agent — applies its commercial preset (CPS margin + TC commission) to the price
     * engine: the margin becomes every line's system margin and the TC rate flows into the sell calc (tcCfg). An
     * unknown agent name (e.g. set via Convert) keeps the name but falls back to the default preset's margin/TC.
     */
    setAgency(name) {
      if (this.isBrochure()) return this;                         // a brochure carries no agency/agent
      const ag = Agencies.find((a) => a.id === name);
      this.agencyAgent = ag ? ag.id : (name || 'Agent A');
      const margin = ag ? ag.margin : DEFAULT_MARGIN;
      this.units().forEach((u) => { if (u.itemSystemPrice) u.itemSystemPrice.systemMargin = margin; recomputeItemPrice(u, true); });   // rebuild each line's scaffold at the agency margin
      this.recompute();
      this._log('seller', 'agency/agent → ' + this.agencyAgent + ' (margin ' + margin + '% · TC ' + (ag ? ag.tc : 0) + '%) (R-PR-03)');
      return this;
    }
    isBrochure() { return this.itineraryType === ItineraryType.BROCHURE; }
    /** The active status ladder the simulator stepper renders — the cut-down brochure ladder, or the full booking one. */
    flow() { return this.isBrochure() ? BrochureFlow : ItineraryFlow; }

    /* ---------- internal helpers (the former engine library) ---------- */
    _clk() { this.clock++; return String(this.clock).padStart(3, '0'); }
    _log(actor, msg) { this.history.unshift({ t: this._clk(), a: actor, m: msg }); }
    _nextId() { return this._idc++; }
    allPaxIds() { return this.pax.map((p) => p.id); }

    units() { const a = []; this.items.forEach((s) => { a.push(s); (s.extras || []).forEach((e) => a.push(e)); }); return a; }
    findItem(id) { return this.units().find((u) => u.id === id) || null; }
    parentOf(extra) { return this.items.find((s) => s.id === extra.parentId) || null; }
    selected() { return this.selectedId ? this.findItem(this.selectedId) : null; }
    select(id) { this.selectedId = id; return this; }
    // focused traveller (for Edit Pax form defaults) — parallels select()/selected() for items
    selectedPax() { return this.selectedPaxId ? this.pax.find((p) => p.id === this.selectedPaxId) : null; }
    selectPax(id) { this.selectedPaxId = id; return this; }
    /** Switch the operating user (by name) — gates role-restricted actions like Unlock. Defaults to the first user if unknown. */
    setCurrentUser(name) {
      const u = this.availableUsers.find((x) => x.name === name) || this.availableUsers[0];
      this.currentUser = u; this._log('user', 'active user → ' + u.name + ' (' + u.role + ')'); return this;
    }

    activeUnits() { return this.units().filter((u) => u.isActive()); }
    billableUnits() { return this.units().filter((u) => u.isBillable()); }
    // Units a Quote/Invoice lists: the live billable lines PLUS any line being cancelled — staged in an open change
    // (→ TO_CANCEL) or already committed (→ CANCELLED) — so the document records the retained cancellation fee.
    docUnits() { return this.units().filter((u) => u.isBillable() || u.pendingOp === PendingOp.CANCEL || u.status === ServiceStatus.CANCELLED); }
    // Tracked in the pending change: staged spec edits (pendingOp) AND lifecycle-only changes
    // (a committedLife snapshot with no pendingOp — e.g. Request Supplier Confirmation) — both revert on Cancel.
    staged() { return this.units().filter((u) => u.pendingOp || u.committedLife); }
    lifecycleOnly(u) { return !u.pendingOp && !!u.committedLife; }
    // A deposit/milestone edit staged in the open change (its baseline differs from the live deposit/milestones).
    // Money-only changes stage no UNIT, so the spine gates / auto-close must consult this too, not just staged().
    hasStagedMoneyEdit() {
      if (!this.inChange()) return false;
      const cs = this.changeSet, d = this.deposit;
      const depChanged = cs.depositBaseline && (cs.depositBaseline.manualAmt !== d.manualAmt || cs.depositBaseline.manualDue !== d.manualDue || cs.depositBaseline.skip !== d.skip);
      const msChanged = cs.milestonesBaseline && JSON.stringify(cs.milestonesBaseline) !== JSON.stringify(this.paymentMilestones);
      return !!(depChanged || msChanged);
    }
    // A staged Edit Pax (R-PX-04): a baseline traveller whose editable attributes (group/age/fullName/type) differ from
    // the snapshot captured in changeSet.paxEdits at the first edit. Lets the change carry a pure pax edit (no unit/money).
    hasStagedPaxEdit() {
      if (!this.inChange() || !this.changeSet.paxEdits) return false;
      return Object.keys(this.changeSet.paxEdits).some((id) => {
        const p = this.pax.find((x) => x.id === id), b = this.changeSet.paxEdits[id];
        return p && b && (p.group !== b.group || p.age !== b.age || p.fullName !== b.fullName || p.type !== b.type || p.comment !== b.comment);
      });
    }
    // Whether the open change carries ANYTHING — a staged unit, a pending/edited traveller, or a deposit/milestone edit.
    hasStagedEdits() {
      return this.staged().length > 0 || this.pax.some((p) => p.origin === 'PENDING' || p.pendingRemove) || this.hasStagedMoneyEdit() || this.hasStagedPaxEdit();
    }
    // Stage an Edit Pax: auto-open a change, snapshot the baseline traveller's editable attributes once (so Cancel
    // reverts), run the mutation, then recompute + touch the change.
    _stagePaxEdit(p, applyFn) {
      this._ensureChange();
      if (this.inChange() && p.origin === 'BASELINE') {
        const cs = this.changeSet; cs.paxEdits = cs.paxEdits || {};
        if (!(p.id in cs.paxEdits)) cs.paxEdits[p.id] = { group: p.group, age: p.age, fullName: p.fullName, comment: p.comment, type: p.type, tag: p.tag, name: p.name };
      }
      applyFn();
      this.recompute(); this._touchChange();
    }

    /* vouchers */
    voucherById(id) { return this.vouchers.find((v) => v.id === id) || null; }
    liveVouchers() { return this.vouchers.filter((v) => v.isLive()); }
    liveVoucherFor(sup) { return this.vouchers.filter((v) => v.supplierId === sup && v.isLive()).slice(-1)[0] || null; }
    latestVoucherFor(sup) { return this.vouchers.filter((v) => v.supplierId === sup).slice(-1)[0] || null; }
    voucherLineOf(item) { return item.liveLine(); }
    suppliersWithVouchers() { return Array.from(new Set(this.vouchers.map((v) => v.supplierId))); }

    /* supplier payments (money paid OUT to a supplier) */
    supplierPaymentsFor(sup) { return this.supplierPayments.filter((p) => p.supplierId === sup); }
    supplierPaid(sup) { return this.supplierPaymentsFor(sup).reduce((a, p) => a + p.amount, 0); }
    // A supplier with at least one CONFIRMED voucher — the precondition for recording a payment to it.
    hasConfirmedVoucher(sup) { return this.vouchers.some((v) => v.supplierId === sup && v.status === VoucherStatus.CONFIRMED); }
    // Latest CONFIRMED voucher for a supplier → its merged payment-terms timeline (total owed + earliest due), or null.
    supplierTerms(sup) {
      const v = this.vouchers.filter((x) => x.supplierId === sup && x.status === VoucherStatus.CONFIRMED).slice(-1)[0];
      return v ? this._voucherTerms(v) : null;
    }
    /* supplier lock — the lock lives on the supplier; it cascades Item.locked onto every one of that supplier's lines. */
    supplierLocked(sup) { return !!this.supplierLocks[sup]; }
    lockSupplier(sup) { this.supplierLocks[sup] = true; this.units().filter((x) => x.supplierId === sup).forEach((x) => { x.locked = true; }); }
    unlockSupplier(sup) { this.supplierLocks[sup] = false; this.units().filter((x) => x.supplierId === sup).forEach((x) => { x.locked = false; }); }

    /* money */
    total() { return this.billableUnits().reduce((a, u) => a + u.sellPrice, 0); }
    paid() { return this.payments.reduce((a, p) => a + p.amount, 0); }
    due() { return this.total() - this.paid(); }
    // FINAL PROFIT — what the seller keeps: Σ (client sell − supplier cost) over billable lines. Client money uses the
    // effective (post-promotion) sell; supplier cost uses the effective (post-promotion) net. Negative ⇒ selling at a loss.
    profit() { return round(this.billableUnits().reduce((a, u) => { const t = u.itemTotalPrice; const cost = t ? (t.effectiveNet != null ? t.effectiveNet : t.totalNet) : 0; return a + (u.sellPrice - cost); }, 0)); }

    /* ---- deposit (first-class object: system figure vs manual override, skip, frozen-once-paid) ---- */
    // System deposit figure from the rate card — Σ billable sellPrice × depositPct (the old deposit() body).
    _systemDeposit() { return round(this.billableUnits().reduce((a, u) => a + u.sellPrice * u.depositPct(), 0)); }
    // Earliest client balance-due day (signed day number) derived directly FROM THE ITEMS — independent of vouchers,
    // so the deposit / outstanding due shows from the start (not only once a supplier voucher is confirmed). For each
    // billable line the balance is due `dueDays` before its travel start (an extra follows its parent service), using
    // the line's confirmed paymentTerms when set, else the supplier's default balanceDays. Min across lines; null only
    // when there is nothing billable.
    minItemDue() {
      const days = this.billableUnits().map((u) => {
        const sched = u.isService() ? u : (u.parent() || u);
        const terms = sched.paymentTerms;
        const dueDays = (terms && terms.dueDays != null) ? terms.dueDays : (Suppliers[sched.supplierId] ? Suppliers[sched.supplierId].balanceDays : 0);
        return dayNum(sched.startDate) - dueDays;
      });
      return days.length ? Math.min(...days) : null;
    }
    // Earliest active-hold expiry (signed day number) across billable units, or null when none are held. An item's
    // activeHolds() already drops expired / RELEASED holds and empties once the line is confirmed (holdsDisabled).
    _earliestActiveHoldDay() {
      const days = this.billableUnits().flatMap((u) => u.activeHolds().map((h) => dayNum(h.expiresAt)));
      return days.length ? Math.min(...days) : null;
    }
    // The earliest-expiring supplier hold that still COVERS its item's current spec (hold fp === target) across the
    // billable lines — the hold that "closes" first. Returns { itemId, itemName, holdId, expiresAt, day } or null.
    closesHold() {
      let best = null;
      this.billableUnits().forEach((u) => {
        const t = u.fingerprint();
        u.activeHolds().filter((h) => h.fp === t).forEach((h) => {
          const day = dayNum(h.expiresAt);
          if (best == null || day < best.day) best = { itemId: u.id, itemName: u.name, holdId: h.id, expiresAt: h.expiresAt, day };
        });
      });
      return best;
    }
    // The first billable line that HAS a matching supplier hold (hold fp === target, not released) but whose matching
    // holds are ALL expired — a relied-on hold lapsed, so the itinerary cannot be vouchered / the change applied until
    // it is re-held or re-priced. A line with no matching hold at all is unaffected (holds are optional). Null when none.
    expiredHoldItem() {
      return this.billableUnits().find((u) => {
        if (u.holdsDisabled()) return false;                        // confirmed/cancelled lines no longer rely on holds
        const t = u.fingerprint();
        const matching = (u.holds || []).filter((h) => h.fp === t && h.status !== HoldStatus.RELEASED);
        return matching.length > 0 && matching.every((h) => h.expired);
      }) || null;
    }
    // Client DEPOSIT due day: the EARLIER of (a) firstInvoiceDate + 7 once the itinerary is first invoiced (frozen),
    // and (b) the earliest active-hold expiry. With neither — pre-invoice and no held line — the deposit due is null
    // ("TBD"). Distinct from the BALANCE-due date (minItemDue) the outstanding milestone uses — a deposit is owed up
    // front, not `balanceDays` before travel.
    _depositDueDate() {
      const base = (this.firstInvoiceDate != null) ? this.firstInvoiceDate + 7 : null;
      const hold = this._earliestActiveHoldDay();
      const cands = [base, hold].filter((d) => d != null);
      return cands.length ? Math.min(...cands) : null;
    }
    // Effective deposit figure/due the client owes — manual override wins; `skip` drops it entirely.
    depositAmt() { return this.deposit.skip ? 0 : (this.deposit.manualAmt != null ? this.deposit.manualAmt : this.deposit.systemAmt); }
    depositDue() { return this.deposit.manualDue != null ? this.deposit.manualDue : this.deposit.systemDue; }
    // Display label for the deposit due — 'TBD' when there is no due (pre-invoice, no hold), else the day label.
    depositDueLabel() { return this.depositDue() == null ? 'TBD' : dayLabel(this.depositDue()); }
    // "custom" = the seller manually overrode the amount or due — derived, not a stored flag (the deposit object has none).
    depositCustom() { return this.deposit.manualAmt != null || this.deposit.manualDue != null; }
    // Refresh the system figure/due while the deposit is neither paid (frozen) nor manually overridden (custom).
    _recalcDeposit() {
      if (this.deposit.paid || this.depositCustom()) return;       // frozen once paid / left alone once customised
      this.deposit.systemAmt = this._systemDeposit();
      this.deposit.systemDue = this._depositDueDate();
    }

    /* ---- payment milestones (deposit → custom slices → dynamic outstanding) ---- */
    // Custom milestones ordered by due (nulls last) — the persisted slices the seller carved out of the outstanding.
    _orderedCustom() { return this.paymentMilestones.slice().sort((a, b) => (a.due == null ? Infinity : a.due) - (b.due == null ? Infinity : b.due)); }
    // Cancellation fees retained on cancelled lines (the client paid them; they are NOT refunded). Billable revenue.
    _retainedFees() { return this.units().filter((u) => u.status === ServiceStatus.CANCELLED && u.cancellation).reduce((a, u) => a + (u.cancellation.fee || 0), 0); }
    // The effective billable base the milestone schedule reconciles against: the live total PLUS retained cancellation
    // fees. Without the fees a cancelled itinerary's total drops to 0 while the retained money stays in paid(), so the
    // residual would derive a phantom negative "refund" (the item-12 bug). due()/total() are unchanged — this is schedule-only.
    _scheduleTotal() { return this.total() + this._retainedFees(); }
    // Total already frozen as settled outstanding (high-water mark across the itinerary's history).
    _recordedOutstandingTotal() { return (this.recordedOutstanding || []).reduce((a, m) => a + (m.amt || 0), 0); }
    // The signed outstanding still unscheduled by the deposit + custom milestones + already-recorded settlements.
    // Reconciles against the live total() (NOT _scheduleTotal): so when a cancellation leaves the client over-collected
    // the residual goes genuinely NEGATIVE and surfaces as a REFUND row tracking the headline due() (total − paid),
    // rather than being masked to 0 by the retained cancellation fee. (retainedFees are 0 in every non-cancel state, so
    // this is identical to the old behaviour everywhere except after a cancel.) _scheduleTotal still feeds the % base
    // and the recorded-outstanding freeze below.
    _outstandingResidual() {
      const unpaidDep = (!this.deposit.skip && !this.deposit.paid) ? this.depositAmt() : 0;
      const unpaidCustom = this.paymentMilestones.reduce((a, m) => a + (m.paid ? 0 : (m.type === MilestoneType.REFUND_TO_CLIENT ? -m.amt : m.amt)), 0);
      return round((this.total() - this.paid()) - unpaidDep - unpaidCustom);
    }
    // The full outstanding amount (paid or not) the residual line represents = billable base minus what the deposit +
    // RECEIVE customs schedule. When this is fully covered (residual ≤ 0) it is recorded/frozen (see _recalcMilestones).
    _coveredOutstanding() {
      const dep = this.deposit.skip ? 0 : this.depositAmt();
      const receiveCustom = this.paymentMilestones.reduce((a, m) => a + (m.type === MilestoneType.REFUND_TO_CLIENT ? 0 : (m.amt || 0)), 0);
      return round(this._scheduleTotal() - dep - receiveCustom);
    }
    // Mark milestones paid by a waterfall over paid() (deposit first, then customs by due). Freeze-once-true: a flag
    // never flips back to false (mirrors deposit.paid / the legacy refund-terminal freeze). Refund milestones carry
    // their own `paid` set at creation (the negative payment is posted with them), so the waterfall covers RECEIVE only.
    _recalcMilestones() {
      const paid = this.paid();
      if (!this.deposit.skip && this.depositAmt() > 0 && paid >= this.depositAmt()) this.deposit.paid = true;
      let cum = this.deposit.skip ? 0 : this.depositAmt();
      this._orderedCustom().forEach((m) => {
        if (m.type !== MilestoneType.RECEIVE_FROM_CLIENT) return;  // refunds carry their own paid flag
        cum += m.amt;
        if (paid >= cum) m.paid = true;
      });
      // Freeze a fully-settled OUTSTANDING into a recorded milestone (R-MN-09): once the live residual is covered and
      // the covered outstanding exceeds what's already recorded, snapshot the newly-settled slice. High-water mark, so
      // a later shrink (a cancellation's retained fee) never un-records — the schedule keeps the history and the live
      // residual derives fresh from any later delta instead of flipping the settled outstanding negative.
      if (this._outstandingResidual() <= 0) {
        const fresh = round(this._coveredOutstanding() - this._recordedOutstandingTotal());
        if (fresh > 0) this.recordedOutstanding.push({ id: 'O' + this._nextId(), type: MilestoneType.RECEIVE_FROM_CLIENT, amt: fresh, due: this.minItemDue(), paid: true, comment: 'outstanding settled' });
      }
    }
    // Red/yellow/green accent for a countdown: > 3 days → green, 0 or fewer → red, 1–3 → yellow, no due → green.
    _milestoneAccent(daysLeft) { return daysLeft == null ? 'green' : (daysLeft > 3 ? 'green' : (daysLeft <= 0 ? 'red' : 'yellow')); }
    // The full display schedule: deposit (when not skipped, always first) → custom slices → the dynamic outstanding
    // residual (last — a receivable, a refund when over-collected, or OMITTED when the balance is square). In the
    // normal (pre-cancel) lifecycle Σ(signed unpaid amts) === total − paid by construction (the residual balances it).
    milestoneSchedule() {
      const total = this._scheduleTotal();   // base for the % column — includes retained cancellation fees so it reconciles
      const pct = (amt) => (total ? round(Math.abs(amt) / total * 100) : 0);
      const out = [];
      const depEff = this.depositAmt();
      if (!this.deposit.skip && depEff > 0) out.push({ kind: 'DEPOSIT', id: 'DEPOSIT', type: MilestoneType.RECEIVE_FROM_CLIENT, amt: depEff, prcOfTotal: pct(depEff), due: this.depositDue(), custom: false, paid: this.deposit.paid, comment: '', removable: false, editable: !this.deposit.paid });
      // Custom slices + recorded (frozen) settled-outstanding, ordered so that PAID rows keep their settlement order and
      // UNPAID rows follow by due. The ordering key for the paid block is the row's CREATION sequence — every row carries a
      // monotonic _nextId() suffix (M*/O*), so the numeric id is that sequence — NOT its due date. This way a newly-added
      // milestone (a manual refund stamped with today's due, or a fresh custom slice) appends AFTER the already-paid block
      // instead of slotting between earlier-paid items by an early due date ("once paid, the order stays"). (_orderedCustom
      // stays due-ordered for the paid-waterfall in _recalcMilestones — this re-order is display-only.)
      const seq = (id) => Number(String(id).replace(/^\D+/, '')) || 0;
      const mid = [];
      this.paymentMilestones.forEach((m) => mid.push({ kind: m.custom === false ? 'REFUND' : 'CUSTOM', id: m.id, type: m.type, amt: m.amt, prcOfTotal: m.prcOfTotal != null ? m.prcOfTotal : pct(m.amt), due: m.due, custom: m.custom !== false, paid: !!m.paid, comment: m.comment || '', removable: m.custom !== false && !m.paid, editable: m.custom !== false && !m.paid }));
      (this.recordedOutstanding || []).forEach((m) => mid.push({ kind: 'OUTSTANDING_RECORDED', id: m.id, type: m.type, amt: m.amt, prcOfTotal: pct(m.amt), due: m.due, custom: false, paid: true, comment: m.comment || 'outstanding settled', removable: false, editable: false }));
      mid.sort((a, b) => (a.paid !== b.paid)
        ? (a.paid ? -1 : 1)                                              // paid block first
        : (a.paid ? seq(a.id) - seq(b.id)                               // paid: stable settlement (creation) order
                  : (a.due == null ? Infinity : a.due) - (b.due == null ? Infinity : b.due)));  // unpaid: by due
      mid.forEach((m) => out.push(m));
      // The live residual row: a receivable while the client still owes (residual > 0), a REFUND when over-collected
      // (residual < 0 — e.g. a cancellation that left money to return), and OMITTED ENTIRELY when the schedule is square
      // (residual === 0: nothing outstanding, nothing to refund — no $0 placeholder row).
      // The live residual is the still-UNSETTLED remainder by construction (when it reaches 0 it is omitted above), so it
      // is never `paid`: a positive residual is a balance the client still owes, a negative one a REFUND still owed back.
      // This keeps it counted in Σ unpaid (= total − paid = the header's OUTSTANDING figure), refund included.
      const residual = this._outstandingResidual();
      if (residual !== 0) out.push({ kind: 'OUTSTANDING', id: 'OUTSTANDING', type: residual < 0 ? MilestoneType.REFUND_TO_CLIENT : MilestoneType.RECEIVE_FROM_CLIENT, amt: Math.abs(residual), prcOfTotal: pct(residual), due: this.minItemDue(), custom: false, paid: false, comment: '', removable: false, editable: false });
      // DEPOSIT shows 'TBD' (not '—') when its due is null — the amount is known but the date isn't yet (pre-invoice,
      // no hold). Every other milestone keeps the generic dayLabel (— for a null OUTSTANDING/custom due).
      out.forEach((m) => { m.dueLabel = (m.kind === 'DEPOSIT' && m.due == null) ? 'TBD' : dayLabel(m.due); m.daysLeft = m.due == null ? null : (m.due - this.currentDate); m.accent = this._milestoneAccent(m.daysLeft); });
      // Per-milestone settlement — how much of each RECEIVE milestone the money collected covers, as a paid amount /
      // percentage / remaining (e.g. deposit 100%, an outstanding slice 30%, the live outstanding 0%). A REFUND row
      // reads from its own paid flag. Drives the % shown against each row in the Payments card (item 6).
      let pool = this.paid();
      out.forEach((m) => {
        if (m.type === MilestoneType.REFUND_TO_CLIENT) { m.paidAmt = m.paid ? m.amt : 0; m.paidPct = m.paid ? 100 : 0; m.remainingAmt = round(m.amt - m.paidAmt); return; }
        const cover = Math.max(0, Math.min(pool, m.amt));
        pool = round(pool - cover);
        m.paidAmt = round(cover);
        m.paidPct = m.amt ? round(cover / m.amt * 100) : (m.paid ? 100 : 0);
        m.remainingAmt = round(m.amt - cover);
      });
      return out;
    }
    // The earliest-due unpaid milestone (with its countdown/accent) for the itinerary-view headline, or null.
    nextMilestone() {
      const unpaid = this.milestoneSchedule().filter((m) => !m.paid && m.amt > 0);
      if (!unpaid.length) return null;
      // The DEPOSIT is the first payment owed, so it leads even when its due is still TBD (null) — without this a
      // dated OUTSTANDING balance would jump ahead of an unpaid deposit. Everything else still orders by due date.
      const rank = (m) => m.kind === 'DEPOSIT' ? -Infinity : (m.due == null ? Infinity : m.due);
      unpaid.sort((a, b) => rank(a) - rank(b));
      return unpaid[0];
    }
    // Record a system-issued refund as a settled REFUND_TO_CLIENT milestone (custom:false, paid:true) — the negative
    // payment row is pushed separately by the caller. Surfaces the refund in the schedule for an audit trail.
    _scheduleRefund(amt, comment) {
      this.paymentMilestones.push({ id: 'M' + this._nextId(), type: MilestoneType.REFUND_TO_CLIENT, amt: round(amt), prcOfTotal: null, due: this.currentDate, custom: false, paid: true, comment: comment || 'refund' });
    }
    _milestoneById(id) { return this.paymentMilestones.find((m) => m.id === id) || null; }
    // The latest due across already-PAID schedule entries — a new custom milestone must fall strictly after it.
    _lastPaidDue() { const paid = this.milestoneSchedule().filter((m) => m.paid && m.due != null); return paid.length ? Math.max(...paid.map((m) => m.due)) : null; }
    committedTotal() {
      return this.units()
        .filter((u) => !(u.origin === 'PENDING' && u.pendingOp === PendingOp.ADD))
        .filter((u) => u.status !== ServiceStatus.CANCELLED)
        .reduce((a, u) => a + effPrice(u.baseSpec()), 0);
    }

    /* gating predicates */
    inChange() { return this.changeSet !== null; }
    hasPaid() { return this.paid() > 0; }
    isCancelling() { return this.inChange() && this.changeSet.trigger === ChangeTrigger.CANCELLATION; }
    // EVERY edit now goes through a pending change (P2). A change opened while the itinerary is in DRAFT is a
    // "draft change" — Apply/Cancel only, no quote/invoice/voucher cycle.
    // A PreBookingModif change (opened before the itinerary is VOUCHERED) — Apply/Cancel only, no quote/invoice cycle.
    isDraftChange() { return this.inChange() && this.changeSet.type === ModificationType.PRE_BOOKING && this.changeSet.trigger !== ChangeTrigger.CANCELLATION; }
    // A PostBookingModif change (opened once VOUCHERED+) — its Apply actually raises supplier vouchers (R-CH-26).
    // Only here does a queued "Confirm" truly become "request on apply"; a PreBookingModif's request waits for Send Vouchers.
    isPostBookingChange() { return this.inChange() && this.changeSet.type === ModificationType.POST_BOOKING; }
    // States where an edit (or a change-gated action) may LAZILY auto-open a pending change: DRAFT, or
    // VOUCHERED/CONFIRMED when not finance-locked. PREPARED/QUOTED/APPROVED/INVOICED are excluded (revert to DRAFT to edit).
    canAutoOpenChange() {
      return !this.inChange() &&
        (this.status === ItineraryStatus.DRAFT ||
         (['VOUCHERED', 'CONFIRMED'].includes(this.status) && !this.financeLocked));
    }
    // An edit can be staged if we're already in a change, or we're in a state where one auto-opens.
    canStage() { return this.inChange() || this.canAutoOpenChange(); }
    // Open a change lazily on the first edit (so edits are staged, never inline). Type (Pre/PostBookingModif) is
    // stamped by _openChange from the current itinerary status.
    _ensureChange() { if (this.canAutoOpenChange()) this._openChange(ChangeTrigger.SELLER); }
    offDraftHint() { return this.status === ItineraryStatus.VOUCHERED || this.status === ItineraryStatus.CONFIRMED ? 'open a change' : 'revert to DRAFT'; }
    // A supplier rejection that has not been resolved (reinstate/replace/drop/revert) — blocks Apply.
    unresolvedRejection() { return this.activeUnits().some((u) => u.supplierStatus === SupplierStatus.Rejected); }
    // A supplier rejection mid-change FREEZES the open change back to DRAFT — the seller must resolve every rejected
    // line (or Cancel the change) before re-quoting. (A cancellation change has no draft step, so it's left alone.)
    _freezeChangeOnRejection() {
      if (this.inChange() && !this.isCancelling() && this.changeSet.status !== 'DRAFT') {
        this.changeSet.status = 'DRAFT'; this.pendingStatus = 'DRAFT';
        this._log('seller', 'supplier rejection during the change → reverted to DRAFT (resolve it or Cancel before re-quoting)');
      }
    }
    // The net price delta a pending change would commit (projected − committed).
    changeTotal() { return this.total() - this.committedTotal(); }
    // Active lines still on an unvalidated estimate (hypothetical system price, no manual override).
    provCount() { return this.activeUnits().filter((u) => u.manualPrice == null && u.hypothetical).length; }
    unconfCount() { return this.billableUnits().filter((u) => u.supplierStatus !== SupplierStatus.Booked).length; }
    allConfirmed() { return this.billableUnits().length > 0 && this.unconfCount() === 0; }
    fcaReady() { const b = this.billableUnits(); return b.length > 0 && b.every((u) => u.opsReady); }
    changeHasLiveVoucher() {
      // Only a voucher THIS change put out blocks discard — a baseline (prior-Apply) live request is restored
      // untouched on discard and never un-sent, so it must not trap the change (R-CH-24). Pre-Apply nothing is
      // sent, so this is effectively never true; it stays as a defensive guard.
      return this.inChange() && this.changeSet.trigger !== ChangeTrigger.CANCELLATION &&
        this.staged().some((u) => u.hasLiveRequest() && !u.liveRequestIsBaseline());
    }
    changeNeedsVoucher() {
      if (!this.inChange()) return false;
      // PreBookingModif (a pre-VOUCHERED draft change) NEVER raises supplier vouchers on Apply — its queued
      // requests/confirms simply commit as intent and the next itinerary "Send Vouchers" raises them. Only a
      // PostBookingModif (a VOUCHERED+ amendment) generates vouchers at Apply (R-CH-26).
      if (this.changeSet.type !== ModificationType.POST_BOOKING) return false;
      // (PostBookingModif only — pre-booking changes returned false above.)
      // an explicit "Confirm" raises a voucher on Apply.
      if (this.staged().some((u) => u.requestOnApply)) return true;
      // item.Confirm raises (if needed) AND confirms a voucher on Apply (R-IT-05).
      if (this.staged().some((u) => u.confirmOnApply)) return true;
      // cancelling a line that already has a supplier voucher out (requested) or agreed (confirmed) must tell the
      // supplier to cancel. Without this the supplier is left holding a stale live voucher for a cancelled line.
      if (this.staged().some((u) => u.pendingOp === PendingOp.CANCEL && (!!u.confirmed || !!u.requested))) return true;
      if (!['VOUCHERED', 'CONFIRMED'].includes(this.status)) return false;
      return this.staged().some((u) =>
        u.pendingOp === PendingOp.MODIFY ? (!!u.requested || !!u.confirmed || !!u.priorRequested)
        : u.pendingOp === PendingOp.ADD ? true
        : u.pendingOp === PendingOp.CANCEL ? (!!u.confirmed || !!u.requested)   // handled above; kept for the VOUCHERED/CONFIRMED contract
        : false);
    }

    /* pricing recompute */
    // Refresh the system price from the rate card on any line that is still a hypothetical estimate.
    // A validated line (hypothetical=false) holds its system price until re-validated; the manual
    // override (if any) is independent and decides the effective sellPrice via the getter.
    recompute() {
      this.units().forEach((u) => recomputeItemPrice(u));
      this._pruneOrphanPromos();            // drop selected instances no line references (e.g. after a deselect/revert)
      this._applyPromotions();              // apply each MATCHED instance's benefit to its member lines' effectiveSell
      this._recalcTravelDates();
      // Client-money side falls out of the new totals: refresh the deposit figure (while unpaid & not customised),
      // re-run the milestone waterfall, then re-derive the payment status.
      this._recalcDeposit(); this._recalcMilestones(); this._recalcPayment();
      this._reorderPaxByGroup();
    }
    // Cluster travellers by GROUP so same-family travellers sit together — groups appear in FIRST-SEEN order, members
    // keep their relative (insertion) order, and ungrouped travellers ('') sink to the end. Stable + idempotent; run
    // from recompute() so the order tracks every traveller add / remove / group edit. Reorders the ARRAY only — never
    // the ids — so staged pax edits and line allocations (all keyed by id) are unaffected.
    _reorderPaxByGroup() {
      const seen = [];
      this.pax.forEach((p) => { const g = p.group || ''; if (g && !seen.includes(g)) seen.push(g); });
      const rank = (p) => { const g = p.group || ''; return g === '' ? seen.length : seen.indexOf(g); };
      this.pax = this.pax
        .map((p, i) => ({ p, i }))
        .sort((a, b) => (rank(a.p) - rank(b.p)) || (a.i - b.i))
        .map((x) => x.p);
    }
    // Travel span = min start / max end across the active, dated lines (services always carry dates; extras only
    // when they hold their own). Recomputed on every recompute() so it tracks any item add/edit/remove/cancel.
    _recalcTravelDates() {
      const dated = this.activeUnits().filter((u) => u.startDate || u.endDate);
      if (!dated.length) { this.travelStart = null; this.travelEnd = null; return; }
      this.travelStart = Math.min(...dated.map((u) => dayNum(u.startDate || u.endDate)));
      this.travelEnd = Math.max(...dated.map((u) => dayNum(u.endDate || u.startDate)));
    }
    /** Where the trip sits vs the demo clock — NOT_STARTED until travelStart, COMPLETED once past travelEnd. */
    travelStatus() {
      if (this.travelStart == null) return TravelStatus.NOT_STARTED;
      if (this.currentDate < this.travelStart) return TravelStatus.NOT_STARTED;
      if (this.currentDate > this.travelEnd) return TravelStatus.COMPLETED;
      return TravelStatus.IN_PROGRESS;
    }
    /** Days from the demo clock to travel start (negative once travel has started). Null if no dated lines. */
    daysToTravelStart() { return this.travelStart == null ? null : this.travelStart - this.currentDate; }
    /**
     * continuity() — itinerary "where are you each day/night" + structural gaps, for the allocation grid's Place / Gaps
     * rows. A STAY (accommodation) fixes where you sleep; a TRANSPORT moves fromLocation → toLocation. Moving between
     * places needs a transfer.
     *   accomGapNight[d]  : the night starting day d is covered by NO accommodation (nowhere to sleep).
     *   transportGapDay[d]: you sleep at a different place either side of day d, but no transfer that day connects them.
     * Keyed by ISO date so the thin view can index it against its own (identically-derived) column dates.
     */
    continuity() {
      const CHART = ['ACCOMMODATION', 'FLIGHT', 'ACTIVITY', 'TRANSPORT'];   // same set the grid charts (no others/fee extras)
      const live = (u) => u.status !== ServiceStatus.CANCELLED && u.pendingOp !== PendingOp.REMOVE;
      const charted = this.items.filter((s) => live(s) && CHART.includes(s.type) && s.startDate && s.endDate);
      const out = { dates: [], dayPlace: {}, nightPlace: {}, accomGapNight: {}, transportGapDay: {}, transferRoute: {} };
      let minD = null, maxD = null;
      charted.forEach((u) => { if (!minD || u.startDate < minD) minD = u.startDate; if (!maxD || u.endDate > maxD) maxD = u.endDate; });
      if (!minD || !maxD) return out;
      const dates = []; for (let d = dayNum(minD); d <= dayNum(maxD); d++) dates.push(isoForDay(d));
      out.dates = dates;
      const accoms = charted.filter((u) => u.type === ServiceType.ACCOMMODATION);
      const transfers = charted.filter((u) => u.type === ServiceType.TRANSPORT);
      const accomOnDay = (d) => accoms.find((a) => a.startDate <= d && d <= a.endDate);
      const accomOnNight = (d, d2) => accoms.find((a) => a.startDate <= d && a.endDate >= d2);   // a stay spanning both ends covers the night
      const transferOnDay = (d) => transfers.find((t) => t.startDate <= d && d <= t.endDate);
      dates.forEach((d, i) => {
        const tf = transferOnDay(d), ad = accomOnDay(d);
        out.dayPlace[d] = tf ? (tf.toLocation || null) : (ad ? (ad.location || null) : null);   // a transfer day → where you arrive; else the stay's place
        if (tf) out.transferRoute[d] = { from: tf.fromLocation || null, to: tf.toLocation || null };
        if (i < dates.length - 1) {
          const an = accomOnNight(d, dates[i + 1]);
          out.nightPlace[d] = an ? (an.location || null) : null;
          out.accomGapNight[d] = !an;                                   // no stay covers this night
        }
      });
      // a location change between consecutive stay-nights (P → Q on the changeover day) must be bridged by a transfer that day.
      for (let i = 1; i < dates.length - 1; i++) {
        const P = out.nightPlace[dates[i - 1]], Q = out.nightPlace[dates[i]], day = dates[i];
        if (P && Q && P !== Q && !transfers.some((t) => t.startDate <= day && day <= t.endDate && t.fromLocation === P && t.toLocation === Q)) out.transportGapDay[day] = true;
      }
      return out;
    }
    /**
     * paxRoute(paxId) — ONE traveller's journey as an ordered ribbon of tokens for the allocation grid:
     *   { kind:'transfer', from, to, id, name } a movement leg · { kind:'stay', loc, id, name } an overnight stay ·
     *   { kind:'gap' } a location change with no connecting transfer THIS traveller is on (i.e. needs transport).
     * Movements (TRANSPORT/FLIGHT) and stays (ACCOMMODATION) only, in date order; a gap is inserted whenever the
     * traveller's next place isn't where the running position left them and no leg bridged it. [] = no charted route.
     */
    paxRoute(paxId) {
      const live = (u) => u.status !== ServiceStatus.CANCELLED && u.pendingOp !== PendingOp.REMOVE;
      const MOVE = ['TRANSPORT', 'FLIGHT'], STAY = ['ACCOMMODATION'];
      const mine = this.items
        .filter((u) => live(u) && u.startDate && u.endDate && (u.paxIds || []).includes(paxId) && (MOVE.includes(u.type) || STAY.includes(u.type)))
        .slice()
        .sort((a, b) => a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : (a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : (String(a.id) < String(b.id) ? -1 : 1)));
      const tokens = [];
      let cur = null;   // running position (last known location)
      mine.forEach((u) => {
        if (MOVE.includes(u.type)) {
          if (cur != null && u.fromLocation && cur !== u.fromLocation) tokens.push({ kind: 'gap', at: u.startDate });   // can't reach this leg's origin
          tokens.push({ kind: 'transfer', from: u.fromLocation || '?', to: u.toLocation || '?', id: u.id, name: u.name, date: u.startDate, end: u.endDate });
          cur = u.toLocation || cur;
        } else {
          const loc = u.location || '?';
          if (cur != null && u.location && cur !== loc) tokens.push({ kind: 'gap', at: u.startDate });                  // moved with no transport
          tokens.push({ kind: 'stay', loc, id: u.id, name: u.name, start: u.startDate, end: u.endDate });
          cur = u.location || cur;
        }
      });
      return tokens;
    }
    _defaultCurrentDate() { return dayNum('D1') + DEFAULT_CURRENT_OFFSET; }
    /**
     * changeCurrentDate — DEMO control (like reset()/happyPath()): override the simulator's "today" to exercise
     * the travel-status read-model. Accepts an ISO date ('2028-03-23'), a day number, a 'D<n>' token (signed:
     * 'D-99' → −99), or null/'' to restore the default (100 days before D1). Returns `this`.
     */
    changeCurrentDate(day) {
      if (day == null || day === '') this.currentDate = this._defaultCurrentDate();
      else if (typeof day === 'number') this.currentDate = Math.round(day);
      else if (isISO(day)) this.currentDate = dayForISO(day);
      else { const m = String(day).match(/-?\d+/); this.currentDate = m ? parseInt(m[0], 10) : this._defaultCurrentDate(); }
      this._recalcDeposit();   // a pre-invoice deposit due is currentDate + 7 — refresh it when the demo clock moves (frozen once invoiced/paid/custom)
      this._log('demo', 'current date → ' + dayLabel(this.currentDate) + ' · ' + this.travelStatus()
        + (this.daysToTravelStart() != null ? ' (' + this.daysToTravelStart() + 'd to start)' : ''));
      return this;
    }
    // Re-price ONE line from the rate card after a direct spec edit to it (dates / pax / qty), regardless of
    // the `hypothetical` flag. recompute() deliberately skips validated lines so an *unrelated* edit never
    // clobbers a validated price; but when the seller edits THIS line's priced inputs, its system price must
    // follow (otherwise quotes/invoices and the re-voucher figure go stale against the new spec). A manual
    // override still wins via the sellPrice getter — this only moves the underlying systemPrice.
    _reprice(u) { if (u) recomputeItemPrice(u, true); }
    // Fully DERIVED client-money status — no per-state pinning, no freeze list. A dead itinerary is CANCELLED; an
    // itinerary with no client money AND no supplier vouchers AND still pre-approval (status before APPROVED) is NEW
    // (nothing collectable yet); otherwise it falls straight out of paid-vs-total: under → NEEDS_PAYMENT, exact →
    // FULLY_PAID, over → OVERPAID. Once the client APPROVES, an unpaid itinerary reads NEEDS_PAYMENT.
    _recalcPayment() {
      if ([ItineraryStatus.CANCELLED, ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED].includes(this.status)) { this.paymentStatus = PaymentStatus.CANCELLED; return; }
      const fi = (s) => ItineraryFlow.findIndex((x) => x.key === s);
      const preApproval = fi(this.status) >= 0 && fi(this.status) < fi(ItineraryStatus.APPROVED);
      if (this.payments.length === 0 && this.vouchers.length === 0 && preApproval) { this.paymentStatus = PaymentStatus.NEW; return; }
      const p = this.paid(), t = this.total();
      this.paymentStatus = p > t ? PaymentStatus.OVERPAID
                         : (p === t && t > 0) ? PaymentStatus.FULLY_PAID
                         : PaymentStatus.NEEDS_PAYMENT;
    }

    /* staging primitives */
    _beginEdit(u, op) {
      if (u.origin === 'BASELINE' && !u.committed) u.committed = u.spec();
      this._beginLife(u);
      u.pendingOp = op;
    }
    // Snapshot a baseline line's lifecycle (status + commercial figures) so any change to it reverts on Cancel.
    _beginLife(u) {
      if (u.origin === 'BASELINE' && !u.committedLife) u.committedLife = { status: u.status, requested: deep(u.requested), confirmed: deep(u.confirmed), supplierAside: deep(u.supplierAside), qtyLocal: u.qtyLocal, datesLocal: u.datesLocal, paymentTerms: deep(u.paymentTerms), holds: deep(u.holds) };
    }
    // Shared staging dance for a spec edit (dates/pax/qty/price): auto-open a change, stage a baseline line as MODIFY
    // (a pending-ADD edits in place), run the mutation, then recompute + touch the change. Returns true when it staged
    // a baseline MODIFY (vs editing a pending-ADD). The per-action log/_reprice/_recalcPayment stay in the action.
    _stageEdit(u, applyFn) {
      this._ensureChange();
      const staged = u.origin === 'BASELINE';
      if (staged) this._beginEdit(u, PendingOp.MODIFY);
      applyFn();
      this.recompute(); this._touchChange();
      return staged;
    }
    _touchChange() {
      this.units().forEach((u) => this._unstageIfClean(u));   // hand-undone MODIFYs drop out of the change
      // An emptied DRAFT change closes itself: it only auto-opened to carry edits, and nothing is left
      // (no staged line, no pending traveller). Post-booking changes (VOUCHERED+) stay open — they were
      // opened deliberately (initiator chosen) and are closed via Apply/Cancel.
      if (this.inChange() && this.status === ItineraryStatus.DRAFT && this.staged().length === 0
          && !this.pax.some((p) => p.origin === 'PENDING' || p.pendingRemove) && !this.hasStagedMoneyEdit() && !this.hasStagedPaxEdit()) {
        this.changeSet = null; this.pendingStatus = 'NONE';
        this._log('seller', 'draft change emptied — auto-closed (nothing staged)');
        return;
      }
      if (this.inChange() && this.changeSet.status !== 'DRAFT') {
        this.changeSet.status = 'DRAFT'; this.pendingStatus = 'DRAFT';
        this._log('seller', 'change re-opened to DRAFT — needs re-quote/invoice/voucher (R-CH-23)');
      }
    }
    // Undo detection: a staged line hand-edited back to its committed baseline — the spec (MODIFY) AND the
    // lifecycle snapshot (status-picker edits: confirm/request/reset) matching again, with no supplier action
    // queued — is dropped from the change. Editing a value and then editing it back, OR cycling a status and
    // landing back on the original, leaves NO empty row in the pending-changes panel (R-CH-04).
    _unstageIfClean(u) {
      if (u.origin !== 'BASELINE') return;
      if (u.pendingOp && u.pendingOp !== PendingOp.MODIFY) return;             // ADD/CANCEL/REMOVE are deliberate, never auto-undone
      if (!u.committed && !u.committedLife) return;                           // nothing staged on this line
      if (u.confirmOnApply || u.requestOnApply) return;                       // supplier action queued — keep staged
      if (u.committed && this._specDiff(u.committed, u.spec()).length) return; // spec still differs from baseline
      // Validate price flips the `hypothetical` estimate flag, which lives on the DERIVED itemSystemPrice — excluded
      // from DIFF_FIELDS, so an unchanged-net validation leaves no spec diff. Track it explicitly: clearing (or setting)
      // the flag is a real staged change, so a Validate that doesn't move the net still applies (R-IT-03).
      const baseHypo = (u.committed && u.committed.itemSystemPrice) ? u.committed.itemSystemPrice.hypothetical : true;
      const liveHypo = u.itemSystemPrice ? u.itemSystemPrice.hypothetical : true;
      if (u.committed && baseHypo !== liveHypo) return;
      const life = u.committedLife;
      if (life && (life.status !== u.status
        || JSON.stringify(life.requested || null) !== JSON.stringify(u.requested || null)
        || JSON.stringify(life.confirmed || null) !== JSON.stringify(u.confirmed || null)
        || JSON.stringify(life.supplierAside || null) !== JSON.stringify(u.supplierAside || null)
        || JSON.stringify(life.holds || null) !== JSON.stringify(u.holds || null))) return;
      const wasModify = u.pendingOp === PendingOp.MODIFY;
      if (life) { u.qtyLocal = life.qtyLocal; u.datesLocal = life.datesLocal; }   // undone edit also restores qty/dates cascade-following
      u.pendingOp = null; u.committed = null; u.committedLife = null;
      this._log('seller', 'staged ' + (wasModify ? 'MODIFY' : 'status change') + ' ' + u.id + ' undone by hand — matches baseline again, un-staged');
    }
    _promote(u) {
      if (u.origin === 'PENDING' && u.pendingOp === PendingOp.ADD) { u.origin = 'BASELINE'; u.pendingOp = null; }
      else if (u.pendingOp === PendingOp.MODIFY) { u.committed = null; u.committedLife = null; u.pendingOp = null; }
    }
    // Compares DIFF_FIELDS (not all of SPEC_FIELDS): the DERIVED price fields (itemSystemPrice/itemTotalPrice) are
    // excluded, so a staged change surfaces only itemManualPrice — the seller's actual edit — never the recomputed
    // system breakdown or totals. Drives both the change-panel display (stagedDiff) and undo detection.
    _specDiff(b, a) {
      const d = [];
      DIFF_FIELDS.forEach((f) => {
        if (JSON.stringify(b ? b[f] : undefined) !== JSON.stringify(a ? a[f] : undefined)) d.push({ f, before: b ? b[f] : undefined, after: a ? a[f] : undefined });
      });
      return d;
    }

    /* factories */
    _newItem(props) { return new Item(this, props); }
    addService(type, sup, name, rates, sd, ed, qty) {
      const u = this._newItem({ id: 'S' + this._nextId(), type, supplierId: sup, name, rates, startDate: sd, endDate: ed, qty: qty || 1, paxIds: this.allPaxIds() });
      recomputeItemPrice(u, true);                        // build the system breakdown from the rate card (forced)
      this.items.push(u); return u;
    }
    addExtraTo(svc, sup, name, rates) {
      // an extra never exceeds its parent — start it on the parent's traveller set AND its date window (it follows the
      // service window until its own dates are set, datesLocal=false).
      const e = this._newItem({ id: 'E' + this._nextId(), parentId: svc.id, type: 'EXTRA', supplierId: sup, name, rates, qty: svc.qty || 1, paxIds: (svc.paxIds || this.allPaxIds()).slice(), startDate: svc.startDate, endDate: svc.endDate });
      delete e.extras; recomputeItemPrice(e, true); svc.extras.push(e); return e;
    }
    // A per-type traveller tag (ADT1, ADT2, CHD1, …) drawn from a high-water counter that NEVER reuses a number across
    // the itinerary's history: remove ADT2 then add a new adult → ADT3. The counter lives on paxSeq, keyed by PAX_CODE.
    _nextPaxTag(type) {
      const code = PAX_CODE[type] || 'PAX';
      const n = (this.paxSeq[code] || 0) + 1;
      this.paxSeq[code] = n;
      return code + n;
    }
    addPax(type, baseline) {
      // baseline=true → seed/committed pax; otherwise a new pax stages as PENDING inside the (auto-)open change.
      const staged = !baseline && this.inChange();
      const tag = this._nextPaxTag(type);
      // group + fullName start EMPTY (set later via Edit Pax); `name` mirrors the tag for back-compat view code.
      const p = { id: 'P' + this._nextId(), type, tag, name: tag, group: '', age: null, fullName: '', comment: '', origin: staged ? 'PENDING' : 'BASELINE', pendingRemove: false };
      this.pax.push(p); return p;
    }
    delPax(id) {
      const p = this.pax.find((x) => x.id === id); if (!p) return;
      this._ensureChange();
      if (!this.inChange()) return;
      if (p.origin === 'PENDING') {
        this.pax = this.pax.filter((x) => x.id !== id);
        this.units().forEach((u) => { if (u.paxIds.includes(id)) { if (u.origin === 'BASELINE' && !u.pendingOp) this._beginEdit(u, PendingOp.MODIFY); u.paxIds = u.paxIds.filter((x) => x !== id); this._reprice(u); } });
        this.recompute(); this._touchChange(); this._log('seller', 'dropped pending traveller ' + p.name); return;
      }
      p.pendingRemove = true;
      this.units().forEach((u) => { if (u.paxIds.includes(id)) { if (u.origin === 'BASELINE' && !u.pendingOp) this._beginEdit(u, PendingOp.MODIFY); u.paxIds = u.paxIds.filter((x) => x !== id); this._reprice(u); } });
      this._touchChange(); this.recompute();
      this._log('seller', 'staged remove traveller ' + p.name + ' (deferred to apply, R-PX-03)');
    }

    /* change set lifecycle */
    _openChange(trigger) {
      // Stamp the modif type from the CURRENT itinerary status: VOUCHERED+ → PostBookingModif (full flow),
      // anything earlier → PreBookingModif (Apply/Cancel only). Captured once, at open.
      const type = ['VOUCHERED', 'CONFIRMED'].includes(this.status) ? ModificationType.POST_BOOKING : ModificationType.PRE_BOOKING;
      this.changeSet = { status: 'DRAFT', trigger, type, t: this._clk() };
      // Baseline the milestone schedule + deposit override so a Cancel restores them (like a unit's committedLife).
      this.changeSet.milestonesBaseline = deep(this.paymentMilestones);
      this.changeSet.depositBaseline = { manualAmt: this.deposit.manualAmt, manualDue: this.deposit.manualDue, skip: this.deposit.skip };
      this.pendingStatus = 'DRAFT';
      this._log(trigger === ChangeTrigger.CLIENT_REQUEST ? 'client' : 'seller', 'opened change (' + trigger + ' · ' + type + ')');
    }
    _revertChange(actor, msg) {
      this.items = this.items.filter((s) => !(s.origin === 'PENDING' && s.pendingOp === PendingOp.ADD));
      this.items.forEach((s) => { s.extras = s.extras.filter((e) => !(e.origin === 'PENDING' && e.pendingOp === PendingOp.ADD)); });
      this.pax = this.pax.filter((p) => p.origin !== 'PENDING');
      this.pax.forEach((p) => { p.pendingRemove = false; });
      this.units().forEach((u) => {
        if (u.committed) u.applySpec(u.committed);
        if (u.committedLife) { u.status = u.committedLife.status; u.requested = deep(u.committedLife.requested); u.confirmed = deep(u.committedLife.confirmed); u.supplierAside = deep(u.committedLife.supplierAside) || null; u.qtyLocal = u.committedLife.qtyLocal; u.datesLocal = u.committedLife.datesLocal; u.paymentTerms = deep(u.committedLife.paymentTerms) || null; u.holds = deep(u.committedLife.holds) || []; }
        u.pendingOp = null; u.prevOp = null; u.committed = null; u.committedLife = null;
        u.cancelIntent = null; u.priorRequested = null; u.requestOnApply = false; u.confirmOnApply = false; u.dropNoFee = false;
      });
      // Restore staged Edit Pax (R-PX-04): revert each edited baseline traveller's attributes to the snapshot.
      if (this.changeSet && this.changeSet.paxEdits) {
        Object.keys(this.changeSet.paxEdits).forEach((id) => { const p = this.pax.find((x) => x.id === id), b = this.changeSet.paxEdits[id]; if (p && b) { p.group = b.group; p.age = b.age; p.fullName = b.fullName; p.comment = b.comment; p.type = b.type; p.tag = b.tag; p.name = b.name; } });
      }
      // Restore staged milestone/deposit edits to the change's opening baseline (unpaid flags re-derive in recompute).
      if (this.changeSet && this.changeSet.milestonesBaseline) this.paymentMilestones = deep(this.changeSet.milestonesBaseline);
      if (this.changeSet && this.changeSet.depositBaseline) { const b = this.changeSet.depositBaseline; this.deposit.manualAmt = b.manualAmt; this.deposit.manualDue = b.manualDue; this.deposit.skip = b.skip; }
      this.recompute(); this.changeSet = null; this.pendingStatus = 'NONE';
      this._log(actor, msg);
    }

    /**
     * (Re)send vouchers to suppliers. Auto types (insurance) confirm themselves. Every other supplier
     * that has a unit needing a (re)request gets ONE voucher snapshotting a line for EVERY one of its
     * current items (services + extras + staged-cancels). A re-issue SUPERSEDES the supplier's previous
     * live voucher (the superseded-but-unanswered voucher carries the R-IF-06 race). Confirm/reject of a
     * voucher is all-or-nothing (see voucherConfirm/voucherReject).
     */
    _sendVouchers(resend) {
      this.vver++;
      // 1) auto-confirm items (insurance): a voucher IS created for them and CONFIRMED immediately (R-IT-05).
      // This covers an item not yet confirmed (initial send) AND one whose agreed figure has gone stale after an
      // amendment (isUpdated — e.g. a qty change on a booked line): it is re-confirmed on a fresh voucher so the
      // change actually reaches the supplier, instead of leaving the line stuck NeedsRequest with no voucher.
      const autoSuppliers = Array.from(new Set(this.activeUnits().filter((u) => u.isAuto() && (!u.confirmed || u.isUpdated)).map((u) => u.supplierId)));
      autoSuppliers.forEach((sup) => this._makeAutoVoucher(sup));
      // 2) one voucher per supplier that has a non-auto unit needing a (re)request.
      const targets = Array.from(new Set(this.units().filter((u) => this._needsRequest(u, resend)).map((u) => u.supplierId)));
      targets.forEach((sup) => this._makeSupplierVoucher(sup, resend));
      if (this.status === ItineraryStatus.INVOICED) this.status = ItineraryStatus.VOUCHERED;
      this._log('seller', (resend ? 'resent' : 'sent') + ' vouchers v' + this.vver + ' → ' + (targets.length || 'no') + ' supplier(s)' + (autoSuppliers.length ? ' (+' + autoSuppliers.length + ' auto-confirmed)' : ''));
    }
    /** A dedicated, immediately-CONFIRMED voucher for a supplier's auto-confirm items (insurance) — R-IT-05. */
    _makeAutoVoucher(sup) {
      const v = new Voucher(this, { id: 'V' + this._nextId(), supplierId: sup, ver: this.vver, status: VoucherStatus.CONFIRMED, at: this._clk(), sentAt: this._clk(), resolvedAt: this._clk() });
      const booking = this.supplierBookings[sup] || ('BK-' + sup + '-' + this._clk()); this.supplierBookings[sup] = booking; v.bookingId = booking;
      this.units().filter((u) => u.supplierId === sup && u.isActive() && u.isAuto() && (!u.confirmed || u.isUpdated)).forEach((u) => {
        const t = u.target();
        u.status = ServiceStatus.CONFIRMED;
        u.confirmed = { fp: t.fp, price: t.price, ver: this.vver, at: this._clk(), voucherId: v.id, lineId: u.id };
        u.requested = null; u.requestOnApply = false; u.confirmOnApply = false; this._promote(u);
        const line = this._buildLine(u, this.vver); line.state = 'CONFIRMED'; v.lines.push(line);
      });
      if (v.lines.length) this.vouchers.push(v);
      return v;
    }
    /** Whether a unit still owes the supplier a (re)request this round. */
    _needsRequest(u, resend) {
      if (u.isAuto() || !u.isActive()) return false;
      if (u.pendingOp === PendingOp.REMOVE) return false;        // dropped entirely — no ask
      if (u.requestOnApply) return true;                         // queued "Request Supplier Confirmation"
      if (u.pendingOp === PendingOp.CANCEL) return true;         // a staged cancel is a distinct "please cancel" ask
      // the supplier already has the current intent out (target == requested) → no new request.
      // This stops Apply from re-issuing duplicate vouchers for unchanged lines. (For item.Confirm case 2 —
      // request already matches target — we deliberately fall through here so the EXISTING live voucher is
      // confirmed rather than re-issued.)
      if (u.requested && u.requested.state === 'AWAITING' && u.requested.fp === u.fingerprint()) return false;
      if (u.confirmOnApply) return true;                         // queued item.Confirm with nothing/stale out → raise a fresh voucher
      // A change Apply re-vouchers only staged edits that are already supplier-facing. A line with no supplier
      // engagement yet (a hold-phase NEW line edited in a pre-voucher itinerary) is NOT vouchered here — it waits
      // for the normal INVOICED→VOUCHERED send. So editing line A while only line B is "Request Supplier
      // Confirmation"-ed must not drag A onto a voucher. Once VOUCHERED/CONFIRMED every active line is
      // supplier-facing, so any staged edit (incl. a new ADD) qualifies. (requestOnApply/CANCEL handled above.)
      if (resend) return !!u.pendingOp && (!!u.requested || !!u.confirmed || [ItineraryStatus.VOUCHERED, ItineraryStatus.CONFIRMED].includes(this.status));
      return !u.confirmed;                                       // initial send (itnySendVouchers): every unconfirmed line
    }
    /** Snapshot a fresh per-supplier voucher (lines for every current item of the supplier) and supersede the prior live one. */
    _makeSupplierVoucher(sup, resend) {
      const prev = this.liveVoucherFor(sup);
      const v = new Voucher(this, { id: 'V' + this._nextId(), supplierId: sup, ver: this.vver, status: VoucherStatus.SENT, at: this._clk(), sentAt: this._clk() });
      if (prev) { prev.status = VoucherStatus.SUPERSEDED; prev.supersededBy = v.id; v.supersedes = prev.id; }
      this.units().filter((u) => u.supplierId === sup && u.isActive() && !u.isAuto()).forEach((u) => {
        // never-engaged, non-requesting line (a hold-phase NEW line the seller didn't request) → not part of
        // this supplier interaction; don't snapshot it onto a voucher another line triggered.
        if (!u.confirmed && !u.requested && !this._needsRequest(u, resend)) return;
        const line = this._buildLine(u, this.vver);
        // a CONFIRM line for an already-agreed, unchanged item is carried as context (state CONFIRMED, no fresh ask).
        const outstanding = line.action === LineAction.CANCEL || !u.confirmed || this._needsRequest(u, resend);
        line.state = outstanding ? 'AWAITING' : 'CONFIRMED';
        v.lines.push(line);
        if (outstanding) this._attachLine(u, v, line, resend);
      });
      this.vouchers.push(v);
      return v;
    }
    /** Build one immutable voucher line snapshot for a unit (carrying the covering hold id + any prior payment terms). */
    _buildLine(u, ver) {
      const t = u.target();
      const action = (u.pendingOp === PendingOp.CANCEL || u.status === ServiceStatus.CANCELLED) ? LineAction.CANCEL : LineAction.CONFIRM;
      const live = u.activeHolds ? u.activeHolds() : [];
      const hold = live.find((h) => h.fp === t.fp) || live[0] || null;   // hold "sent with the voucher" (read-only capture)
      return {
        itemId: u.id, parentId: u.parentId || null, action,
        fp: t.fp, price: t.price, ver,                                  // price = the NET figure the supplier is asked to honour
        promos: this._appliedPromos(u),           // promotions (manual + selected/matched) shown to the supplier on the voucher
        holdId: hold ? hold.id : null,
        terms: u.isService() ? (u.paymentTerms ? deep(u.paymentTerms) : null) : null,
        state: 'AWAITING',
      };
    }
    /**
     * Confirm a live voucher — ALL lines, all-or-nothing (R-VC-01). Shared by the voucherConfirm action
     * AND the item.Confirm-on-Apply path (a per-item confirm confirms its whole supplier voucher). Copies
     * the supplier booking ref (creating one on the first confirm), points each item's `confirmed` at the
     * voucher, and books/cancels its lines. Returns the voucher (or null if not live).
     */
    _confirmVoucher(v, bookingId) {
      if (!v) return null;
      let booking = this.supplierBookings[v.supplierId];
      if (!booking) { booking = bookingId || ('BK-' + v.supplierId + '-' + this._clk()); this.supplierBookings[v.supplierId] = booking; }
      v.bookingId = booking; v.status = VoucherStatus.CONFIRMED; v.resolvedAt = this._clk();
      v.lines.forEach((line) => {
        const it = this.findItem(line.itemId); if (!it) return;
        if (line.action === LineAction.CANCEL) {
          line.state = 'CANCELLED';
          // The line is already CANCELLED (set on Apply). The supplier acknowledging the cancel-ask clears the
          // outstanding request, so supplier status falls from AwaitingSupplier → Booked. The supplier has now
          // CONFIRMED the cancellation, so record it as the confirmed (agreed) figure when the line had none — a
          // booked cancelled line is thus ENGAGED (confirmed != null) and TERMINAL: a confirmed cancellation is
          // final, never silently revived. (A line cancelled after a prior booking already carries its confirmed.)
          if (it.requested && it.requested.voucherId === v.id) it.requested = null;
          if (!it.confirmed) it.confirmed = { fp: line.fp, price: line.price, ver: line.ver, at: this._clk(), voucherId: v.id, lineId: it.id };
          it.confirmOnApply = false;
          return;
        }
        if (it.isService()) {                                          // copy payment terms from supplier on first confirm
          if (!it.paymentTerms) { const s = Suppliers[it.supplierId]; it.paymentTerms = { depositPct: s.depositPct, dueDays: s.balanceDays }; }
          line.terms = deep(it.paymentTerms);
        }
        it.confirmed = { fp: line.fp, price: line.price, ver: line.ver, at: this._clk(), voucherId: v.id, lineId: it.id };
        it.requested = null;
        if (it.status !== ServiceStatus.CANCELLED) it.status = ServiceStatus.CONFIRMED;
        it.confirmOnApply = false;
        // If a change is staged on this line (e.g. dates were amended after the voucher went out), the supplier
        // confirmation is permanent but must NOT commit that pending edit — only advance the baseline it reverts to.
        if (it.committedLife) { it.committedLife.status = ServiceStatus.CONFIRMED; it.committedLife.requested = null; it.committedLife.confirmed = deep(it.confirmed); it.committedLife.paymentTerms = deep(it.paymentTerms); }
        else this._promote(it);
        line.state = 'CONFIRMED';
      });
      this._log('supplier', 'confirmed voucher ' + v.id + ' (' + Suppliers[v.supplierId].name + ') booking ' + booking + ' → all lines booked (R-VC-01)');
      return v;
    }

    /** Point a unit's open request at its new voucher line, moving status/priorRequested as the legacy flow did. */
    _attachLine(u, v, line, resend) {
      if (resend && line.action === LineAction.CONFIRM && u.pendingOp === PendingOp.MODIFY && u.requested && u.requested.state === 'AWAITING') {
        u.priorRequested = { fp: u.requested.fp, price: u.requested.price, ver: u.requested.ver, wasPending: true, resolved: false };   // P2: drop once supersession is the only race carrier
      }
      if (line.action === LineAction.CONFIRM && u.status === ServiceStatus.NEW) {
        u.status = ServiceStatus.CONFIRMED;   // intent → CONFIRMED; supplier status (AwaitingSupplier) tracks the supplier ack.
        // (A CONFIRMED line re-vouchered after an amend stays CONFIRMED — the drift surfaces via the derived isUpdated label.)
      }
      u.requested = { fp: line.fp, price: line.price, ver: line.ver, state: 'AWAITING', at: this._clk(), voucherId: v.id, lineId: u.id };
      u.requestOnApply = false;                                   // the queued request has now been raised as a voucher
    }

    /* ---------- seed (was itny.json: seed[]) ---------- */
    _seed() {
      // Travellers — the Smith family (one adult + one child) and Tom Brooks (one adult).
      this.addPax(PaxType.ADULT, true); this.addPax(PaxType.ADULT, true); this.addPax(PaxType.CHILD, true);
      // A realistic, SEQUENTIAL safari leg with locations: NBO (airport) → MARA (Maasai Mara lodge) → NBO. Moving between
      // places needs a transfer — continuity() flags a location change with no connecting transfer (and a night with no stay).
      const arrival = this.addService(ServiceType.TRANSPORT, 'B', 'Airport → Lodge transfer', { ADULT: 80, CHILD: 40, INFANT: 0 }, 'D1', 'D1');
      arrival.fromLocation = 'NBO'; arrival.toLocation = 'MARA';
      const lodge = this.addService(ServiceType.ACCOMMODATION, 'A', 'Safari Lodge — 3 nights', { ADULT: 300, CHILD: 150, INFANT: 0 }, 'D1', 'D4');
      lodge.location = 'MARA';
      this.addExtraTo(lodge, 'A', 'Game Package', { ADULT: 100, CHILD: 50, INFANT: 0 });
      this.addExtraTo(lodge, 'A', 'Park Fee', { ADULT: 60, CHILD: 30, INFANT: 0 });
      // A SECOND supplier-A accommodation (same area, no transfer needed) — so supplier A has TWO accom lines totalling
      // FIVE nights (3 + 2): this is the set the "Same-Camp Circuit" promotion's conditions match against.
      // a transfer linking the two accommodations (MARA → TALEK) on D4 — so the route between the lodges is bridged and
      // continuity() flags no gap; the second lodge sits at a distinct location (TALEK, a Mara-area camp).
      const hop = this.addService(ServiceType.TRANSPORT, 'C', 'Mara → Talek transfer', { ADULT: 70, CHILD: 35, INFANT: 0 }, 'D4', 'D4');
      hop.fromLocation = 'MARA'; hop.toLocation = 'TALEK';
      // Riverside Camp's rate card already carries a SELL (seller margin baked in by the supplier/system) — so the
      // price engine does NOT add a CPS margin on top; it takes the provided sell as the margin-inclusive base.
      const lodge2 = this.addService(ServiceType.ACCOMMODATION, 'A', 'Riverside Camp — 2 nights', { ADULT: { net: 280, rack: 450, sell: 380 }, CHILD: { net: 140, rack: 225, sell: 190 }, INFANT: 0 }, 'D4', 'D6');
      lodge2.location = 'TALEK';
      // departure transfer on supplier C — keeps A = lodges + extras and B = arrival transfer + insurance only.
      const depart = this.addService(ServiceType.TRANSPORT, 'C', 'Lodge → Airport transfer', { ADULT: 90, CHILD: 45, INFANT: 0 }, 'D6', 'D6');
      depart.fromLocation = 'TALEK'; depart.toLocation = 'NBO';
      // travel insurance — a single day-1 purchase (so the timeline reads as a sequence, not a trip-long parallel line);
      // the cover itself runs 15 days, noted in the title. Priced as a flat per-pax one-off (timeUnit 'Stay') so the
      // one-day window doesn't zero it out — (90+90+45) = 225, the same figure as the old 3-night line. AUTO-CONFIRM on B.
      const ins = this.addService(ServiceType.OTHERS, 'B', 'Travel insurance — 15-day cover', { ADULT: 90, CHILD: 45, INFANT: 0 }, 'D1', 'D1');
      ins.location = 'MARA'; ins.rateType = { chargeType: 'Person', timeUnit: 'Stay' }; recomputeItemPrice(ins, true);
      this.promotionCatalog = this._seedPromotionCatalog();   // available promotion templates; nothing selected until the user picks
      this.history = []; this.clock = 0; this.recompute();
      this._log('system', 'itinerary created (DRAFT) · Smith family + Tom Brooks');
    }

    /**
     * Seed the promotion CATALOG (templates — the available menu, accommodation promos for supplier A). Windows are
     * anchored to D1 so they stay open at the demo clock. Selecting a template creates an instance in itn.promotions.
     * The circuit needs 2 accom lines / 5 nights (select it on one lodge, then ADD the second so it matches); the
     * green-season % matches a single ≥3-night lodge; long-stay needs 7 nights (won't match); transfer is an ADD-ON.
     */
    _seedPromotionCatalog() {
      const D1 = dayNum('D1');
      const bw = { from: isoForDay(D1 - 200), to: isoForDay(D1 + 5) };          // booking window — open at the demo clock
      const tv = [{ from: isoForDay(D1), to: isoForDay(D1 + 30) }];            // eligible travel dates
      return [
        { id: 'PROMO-CIRCUIT', headOffice: 'Elewana', name: 'Stay 5 Pay 4 — Same-Camp Circuit', supplierId: 'A',
          isManual: false, itemRef: null, isPartiallySupported: false, note: '',
          bookingWindow: bw, relativeFromDays: null, relativeToDays: null, travelDates: tv,
          conditions: [
            { id: 'c1', conditionType: PromoConditionType.SUPPLIERS_TOTAL, suppliersTotal: { min: 2, max: 2 } },   // two accom lines, one supplier
            { id: 'c2', conditionType: PromoConditionType.NIGHTS_TOTAL, nightsTotal: { min: 5, max: 5 } },         // five nights total
          ],
          actions: [ { id: 'a1', actionType: PromoActionType.DISCOUNT_PERCENTAGE, discount: { discountPercent: 100, targetType: 'Nights', targetNightsType: 'Cheapest', nightsIndexFrom: null, nightsIndexTo: null } } ] },
        { id: 'PROMO-GREEN', headOffice: 'Elewana', name: 'Green Season — 10% off', supplierId: 'A',
          isManual: false, itemRef: null, isPartiallySupported: true, note: 'Discounted nights must be consecutive.',
          bookingWindow: bw, relativeFromDays: null, relativeToDays: null, travelDates: tv,
          conditions: [ { id: 'c1', conditionType: PromoConditionType.SUPPLIER_NIGHTS, nights: { min: 3, max: null } } ],
          actions: [ { id: 'a1', actionType: PromoActionType.DISCOUNT_PERCENTAGE, discount: { discountPercent: 10, targetType: 'Total' } } ] },
        { id: 'PROMO-LONGSTAY', headOffice: 'Elewana', name: 'Long Stay 7+ — 15% off', supplierId: 'A',
          isManual: false, itemRef: null, isPartiallySupported: false, note: '',
          bookingWindow: bw, relativeFromDays: null, relativeToDays: null, travelDates: tv,
          conditions: [ { id: 'c1', conditionType: PromoConditionType.SUPPLIER_NIGHTS, nights: { min: 7, max: null } } ],   // demo has 5 nights → does NOT match
          actions: [ { id: 'a1', actionType: PromoActionType.DISCOUNT_PERCENTAGE, discount: { discountPercent: 15, targetType: 'Total' } } ] },
        { id: 'PROMO-TRANSFER', headOffice: 'Elewana', name: 'Complimentary Airport Transfer', supplierId: 'A',
          isManual: false, itemRef: null, isPartiallySupported: false, note: '',
          bookingWindow: bw, relativeFromDays: null, relativeToDays: null, travelDates: tv,
          conditions: [ { id: 'c1', conditionType: PromoConditionType.NIGHTS_TOTAL, nightsTotal: { min: 4, max: null } } ],
          actions: [ { id: 'a1', actionType: PromoActionType.ADD_ON, addOn: 'Complimentary airport transfer' } ] },
      ];
    }

    /**
     * "Huge" demo seed: TWO traveller groups (the Smiths — 2 adults + a child — and the Brooks — 2 adults) on
     * partly-shared, partly-divergent routes, exercising both kinds of group/route intersection:
     *   • SAME service, SAME item — D1→D3 everyone shares one accommodation line ("Mara Safari Lodge").
     *   • SAME service type, DIFFERENT items — D3→D6 the groups split across two accommodation lines
     *     ("Serengeti Tented Camp" for the Smiths, "Ngorongoro Lodge" for the Brooks) over the same window.
     * They arrive together (one shared transfer) then run separate transfers/accommodation and depart separately.
     */
    _seedHuge() {
      // Travellers — Smiths (John, Jane, Lucy) and Brooks (Tom, Anna). Groups/names set directly (DRAFT baseline).
      const profiles = [
        { type: PaxType.ADULT, group: 'Smiths', fullName: 'John Smith', age: 35 },
        { type: PaxType.ADULT, group: 'Smiths', fullName: 'Jane Smith', age: 33 },
        { type: PaxType.CHILD, group: 'Smiths', fullName: 'Lucy Smith', age: 9 },
        { type: PaxType.ADULT, group: 'Brooks', fullName: 'Tom Brooks', age: 40 },
        { type: PaxType.ADULT, group: 'Brooks', fullName: 'Anna Brooks', age: 38 },
      ];
      const px = profiles.map((f) => { const p = this.addPax(f.type, true); p.group = f.group; p.fullName = f.fullName; p.age = f.age; return p; });
      const smiths = px.slice(0, 3).map((p) => p.id);
      const brooks = px.slice(3).map((p) => p.id);
      // Re-allocate a line (and its extras) to a subset of travellers and re-price from the rate card.
      const alloc = (u, ids) => { u.paxIds = ids.slice(); recomputeItemPrice(u, true); (u.extras || []).forEach((e) => { e.paxIds = ids.slice(); recomputeItemPrice(e, true); }); };

      // D1 — everyone arrives together: NBO → MARA.
      const arrival = this.addService(ServiceType.TRANSPORT, 'B', 'Airport → Mara transfer (group)', { ADULT: 80, CHILD: 40, INFANT: 0 }, 'D1', 'D1');
      arrival.fromLocation = 'NBO'; arrival.toLocation = 'MARA';
      // INTERSECTION ① — SAME accommodation, SAME item: both groups share one lodge, D1 → D3.
      const shared = this.addService(ServiceType.ACCOMMODATION, 'A', 'Mara Safari Lodge — shared (2 nights)', { ADULT: 300, CHILD: 150, INFANT: 0 }, 'D1', 'D3');
      shared.location = 'MARA';
      this.addExtraTo(shared, 'A', 'Game Package', { ADULT: 100, CHILD: 50, INFANT: 0 });

      // D3 — the routes split. Smiths → Serengeti, Brooks → Ngorongoro.
      const sTransfer = this.addService(ServiceType.TRANSPORT, 'C', 'Mara → Serengeti transfer (Smiths)', { ADULT: 120, CHILD: 60, INFANT: 0 }, 'D3', 'D3');
      sTransfer.fromLocation = 'MARA'; sTransfer.toLocation = 'SER'; alloc(sTransfer, smiths);
      const bTransfer = this.addService(ServiceType.TRANSPORT, 'C', 'Mara → Ngorongoro transfer (Brooks)', { ADULT: 110, CHILD: 55, INFANT: 0 }, 'D3', 'D3');
      bTransfer.fromLocation = 'MARA'; bTransfer.toLocation = 'NGR'; alloc(bTransfer, brooks);
      // INTERSECTION ② — SAME service type (accommodation), DIFFERENT items: the groups stay in separate lodges, D3 → D6.
      // Distinct suppliers (D / E) so the route graph charts them as a genuine fork out of the shared Mara lodge.
      const sLodge = this.addService(ServiceType.ACCOMMODATION, 'D', 'Serengeti Tented Camp — Smiths (3 nights)', { ADULT: 320, CHILD: 160, INFANT: 0 }, 'D3', 'D6');
      sLodge.location = 'SER'; alloc(sLodge, smiths);
      this.addExtraTo(sLodge, 'D', 'Balloon Safari', { ADULT: 200, CHILD: 100, INFANT: 0 });
      const bLodge = this.addService(ServiceType.ACCOMMODATION, 'E', 'Ngorongoro Lodge — Brooks (3 nights)', { ADULT: 340, CHILD: 170, INFANT: 0 }, 'D3', 'D6');
      bLodge.location = 'NGR'; alloc(bLodge, brooks);

      // D6 — each group departs separately back to NBO.
      const sDepart = this.addService(ServiceType.TRANSPORT, 'C', 'Serengeti → Airport transfer (Smiths)', { ADULT: 130, CHILD: 65, INFANT: 0 }, 'D6', 'D6');
      sDepart.fromLocation = 'SER'; sDepart.toLocation = 'NBO'; alloc(sDepart, smiths);
      const bDepart = this.addService(ServiceType.TRANSPORT, 'C', 'Ngorongoro → Airport transfer (Brooks)', { ADULT: 115, CHILD: 58, INFANT: 0 }, 'D6', 'D6');
      bDepart.fromLocation = 'NGR'; bDepart.toLocation = 'NBO'; alloc(bDepart, brooks);
      // Travel insurance — one day-1 flat per-pax cover for everyone (AUTO-CONFIRM on B), mirrors the default seed.
      const ins = this.addService(ServiceType.OTHERS, 'B', 'Travel insurance — 15-day cover', { ADULT: 90, CHILD: 45, INFANT: 0 }, 'D1', 'D1');
      ins.location = 'MARA'; ins.rateType = { chargeType: 'Person', timeUnit: 'Stay' }; recomputeItemPrice(ins, true);

      this.history = []; this.clock = 0; this.recompute();
      this._log('system', 'itinerary created (DRAFT) · HUGE — Smiths + Brooks on intersecting routes');
    }

    /**
     * "Extreme" demo seed: TWO traveller groups entering via DIFFERENT gateways, joining at ONE accommodation supplier
     * on the SAME day but CHECKING OUT on DIFFERENT days — the Smiths transfer to the airport and END their trip, while
     * the Brooks CONTINUE on to a second camp before flying out later. Exercises a route graph that MERGES (two distinct
     * entry points → the shared Mara lodge) then FORKS (one journey terminates, one carries on), AND the same-supplier/
     * same-start/different-end case the two graph variants render differently (Graph 1 folds it into one table node;
     * Graph 2 splits it by end date):
     *   • Smiths (3 pax) — D1 enter via Nairobi (NBO ✈ → MARA); Mara lodge (supplier A) D1 → D5.
     *   • Brooks (2 pax) — D1 enter via Kilimanjaro (KIL ✈ → MARA); Mara lodge (supplier A) D1 → D6 (a night longer).
     *   • JOIN — both Mara lodge lines are supplier A starting D1 (one shared place); they differ only in checkout.
     *   • FORK — Smiths depart D5 (MARA → NBO) and STOP; Brooks continue D6 (MARA → SER), stay Serengeti (supplier D)
     *     D6 → D8, then depart D8 (SER → KIL). The two journeys therefore END on different days.
     */
    _seedExtreme() {
      // Travellers — Smiths (John, Jane, Lucy) and Brooks (Tom, Anna). Groups/names set directly (DRAFT baseline).
      const profiles = [
        { type: PaxType.ADULT, group: 'Smiths', fullName: 'John Smith', age: 35 },
        { type: PaxType.ADULT, group: 'Smiths', fullName: 'Jane Smith', age: 33 },
        { type: PaxType.CHILD, group: 'Smiths', fullName: 'Lucy Smith', age: 9 },
        { type: PaxType.ADULT, group: 'Brooks', fullName: 'Tom Brooks', age: 40 },
        { type: PaxType.ADULT, group: 'Brooks', fullName: 'Anna Brooks', age: 38 },
      ];
      const px = profiles.map((f) => { const p = this.addPax(f.type, true); p.group = f.group; p.fullName = f.fullName; p.age = f.age; return p; });
      const smiths = px.slice(0, 3).map((p) => p.id);
      const brooks = px.slice(3).map((p) => p.id);
      // Re-allocate a line (and its extras) to a subset of travellers and re-price from the rate card.
      const alloc = (u, ids) => { u.paxIds = ids.slice(); recomputeItemPrice(u, true); (u.extras || []).forEach((e) => { e.paxIds = ids.slice(); recomputeItemPrice(e, true); }); };

      // Different entry points (same day) — the Smiths via Nairobi, the Brooks via Kilimanjaro, both into the Mara on D1.
      const sArrive = this.addService(ServiceType.TRANSPORT, 'B', 'Nairobi → Mara transfer (Smiths)', { ADULT: 80, CHILD: 40, INFANT: 0 }, 'D1', 'D1');
      sArrive.fromLocation = 'NBO'; sArrive.toLocation = 'MARA'; alloc(sArrive, smiths);
      const bArrive = this.addService(ServiceType.TRANSPORT, 'B', 'Kilimanjaro → Mara transfer (Brooks)', { ADULT: 130, CHILD: 65, INFANT: 0 }, 'D1', 'D1');
      bArrive.fromLocation = 'KIL'; bArrive.toLocation = 'MARA'; alloc(bArrive, brooks);

      // JOIN — both groups stay at the SAME lodge supplier (A) from the SAME day (D1) but check out on DIFFERENT days
      // (Smiths D5, Brooks D6). Two lines, one supplier+start: Graph 1 folds them into one day-coverage table node,
      // Graph 2 splits them by end date. Each gets its own Game Package extra.
      const sLodge = this.addService(ServiceType.ACCOMMODATION, 'A', 'Mara Safari Lodge — Smiths (4 nights)', { ADULT: 300, CHILD: 150, INFANT: 0 }, 'D1', 'D5');
      sLodge.location = 'MARA';
      this.addExtraTo(sLodge, 'A', 'Game Package', { ADULT: 100, CHILD: 50, INFANT: 0 });
      alloc(sLodge, smiths);
      const bMara = this.addService(ServiceType.ACCOMMODATION, 'A', 'Mara Safari Lodge — Brooks (5 nights)', { ADULT: 300, CHILD: 150, INFANT: 0 }, 'D1', 'D6');
      bMara.location = 'MARA';
      this.addExtraTo(bMara, 'A', 'Game Package', { ADULT: 100, CHILD: 50, INFANT: 0 });
      alloc(bMara, brooks);

      // FORK — the Smiths transfer back to the airport on D5 and STOP; the Brooks CONTINUE on to the Serengeti on D6.
      const sDepart = this.addService(ServiceType.TRANSPORT, 'C', 'Mara → Nairobi transfer (Smiths)', { ADULT: 90, CHILD: 45, INFANT: 0 }, 'D5', 'D5');
      sDepart.fromLocation = 'MARA'; sDepart.toLocation = 'NBO'; alloc(sDepart, smiths);   // journey ends at the airport
      const bTransfer = this.addService(ServiceType.TRANSPORT, 'C', 'Mara → Serengeti transfer (Brooks)', { ADULT: 120, CHILD: 60, INFANT: 0 }, 'D6', 'D6');
      bTransfer.fromLocation = 'MARA'; bTransfer.toLocation = 'SER'; alloc(bTransfer, brooks);
      const bLodge = this.addService(ServiceType.ACCOMMODATION, 'D', 'Serengeti Plains Camp — Brooks (2 nights)', { ADULT: 320, CHILD: 160, INFANT: 0 }, 'D6', 'D8');
      bLodge.location = 'SER';
      this.addExtraTo(bLodge, 'D', 'Balloon Safari', { ADULT: 200, CHILD: 100, INFANT: 0 });
      alloc(bLodge, brooks);   // allocate the second-leg lodge AND its extra to the Brooks
      const bDepart = this.addService(ServiceType.TRANSPORT, 'C', 'Serengeti → Kilimanjaro transfer (Brooks)', { ADULT: 140, CHILD: 70, INFANT: 0 }, 'D8', 'D8');
      bDepart.fromLocation = 'SER'; bDepart.toLocation = 'KIL'; alloc(bDepart, brooks);

      // Travel insurance — one day-1 flat per-pax cover for everyone (AUTO-CONFIRM on B), mirrors the other seeds.
      const ins = this.addService(ServiceType.OTHERS, 'B', 'Travel insurance — 15-day cover', { ADULT: 90, CHILD: 45, INFANT: 0 }, 'D1', 'D1');
      ins.location = 'MARA'; ins.rateType = { chargeType: 'Person', timeUnit: 'Stay' }; recomputeItemPrice(ins, true);

      this.history = []; this.clock = 0; this.recompute();
      this._log('system', 'itinerary created (DRAFT) · EXTREME — two gateways join at the Mara, then one trip ends & one continues');
    }

    /* ======================================================================
     * 4. Read models  (what the UI renders — no business logic in the view)
     * ==================================================================== */
    // Append an immutable itinerary version — a full dbDocument() snapshot stamped with a sequence number, the demo
    // clock and a short label. Called once per APPLIED pending change (see cApply) so the Versions panel shows the
    // committed history of the booking.
    _snapshotVersion(label) {
      this.versions.push({ ver: this.versions.length + 1, at: this._clk(), label: label || 'change applied', doc: this.dbDocument() });
    }
    summary() {
      const flags = [];
      if (this.isCancelling()) flags.push('cancellation-pending');
      else if (this.status === ItineraryStatus.CONFIRMED && this.inChange()) flags.push('CONFIRMED+pending');
      if (this.units().some((u) => u.isUpdated)) flags.push('updated-await-reconfirm');
      if (this.units().some((u) => u.supplierStatus === SupplierStatus.Rejected)) flags.push('rejected-resolve');
      if (this.units().some((u) => u.supplierAside)) flags.push('supplier-reconcile');
      if (this.units().some((u) => u.priorRequested && u.priorRequested.wasPending && !u.priorRequested.resolved)) flags.push('prior-voucher-race');
      if (this.pax.some((p) => p.origin === 'PENDING' || p.pendingRemove)) flags.push('pax-change-staged');
      if (this.fcaGenerated) flags.push('fca-generated');
      else if (this.fcaReady()) flags.push('fca-ready');
      // OPS_CHECKED — every billable line is OPS_READY (the same condition that makes the FCA ready); surfaced as its
      // own summary badge (mirrors FCA Ready).
      const opsChecked = this.fcaReady();
      if (opsChecked) flags.push('ops-checked');
      if (this.vouchers.some((v) => v.isLive())) flags.push('voucher-pending');
      if (this.vouchers.some((v) => v.status === VoucherStatus.REJECTED)) flags.push('voucher-rejected');
      if (this.vouchers.some((v) => v.isPriorRace())) flags.push('voucher-superseded-race');
      // supplier status rollup across billable lines (only those where it is yet relevant)
      const recon = {};
      this.billableUnits().forEach((u) => { const r = u.supplierStatusShown; if (r) recon[r] = (recon[r] || 0) + 1; });
      // voucher rollup by state
      const vrollup = { live: 0, confirmed: 0, rejected: 0, superseded: 0 };
      this.vouchers.forEach((v) => {
        if (v.isLive()) vrollup.live++;
        else if (v.status === VoucherStatus.CONFIRMED) vrollup.confirmed++;
        else if (v.status === VoucherStatus.REJECTED) vrollup.rejected++;
        else if (v.status === VoucherStatus.SUPERSEDED) vrollup.superseded++;
      });
      return {
        id: 'itn_0001', title: this.title, status: this.status, paymentStatus: this.paymentStatus,
        itineraryType: this.itineraryType, isBrochure: this.isBrochure(),
        agencyAgent: this.agencyAgent, inquiryId: this.inquiryId,   // BOOKING-only Agency/Agent (null for a brochure) + optional inquiry ref
        // active status ladder + terminal trio for the stepper (a brochure walks DRAFT↔PREPARED with no terminals).
        flow: this.flow().map((s) => [s.key, s.sub]),
        terminals: this.isBrochure() ? [] : (LIFECYCLES.itinerary.terminal || []).map((t) => [t.key, t.sub]),
        committedTotal: this.committedTotal(), projectedTotal: this.total(), changeTotal: this.changeTotal(),
        pendingChangesStatus: this.pendingStatus, pendingCount: this.staged().length,
        // Closest unpaid payment milestone (deposit/custom/outstanding) + its countdown/accent for the itinerary view.
        nextMilestone: this.nextMilestone(),
        // Every billable line OPS_READY → OPS_CHECKED (same condition as FCA-ready; surfaced as its own badge).
        opsChecked,
        // The matching supplier hold that expires soonest across billable lines + its countdown (days from today).
        closesHold: (() => { const ch = this.closesHold(); return ch ? { itemId: ch.itemId, itemName: ch.itemName, holdId: ch.holdId, expiresAt: ch.expiresAt, expiresIn: ch.day - this.currentDate } : null; })(),
        // Travel span vs the demo clock: stored start/end (recomputed from items), today, status, and the countdown.
        travel: {
          start: this.travelStart, end: this.travelEnd,
          startLabel: dayLabel(this.travelStart), endLabel: dayLabel(this.travelEnd),
          currentDate: this.currentDate, currentLabel: dayLabel(this.currentDate),
          status: this.travelStatus(), daysToStart: this.daysToTravelStart(),
        },
        supplierStatus: recon, vouchers: vrollup, flags,
      };
    }

    /**
     * A commercial fingerprint of the whole itinerary — what a quote/invoice "covers". It changes when any
     * billable line's spec/price or the pax set changes, so a generated document can be flagged stale vs the live state.
     */
    _snapshotFp() {
      return JSON.stringify({
        pax: this.pax.map((p) => p.type).sort(),
        lines: this.billableUnits().map((u) => u.fingerprint()).sort(),
        total: this.total(),
        milestones: this._milestoneFp(),
      });
    }
    // Stable signature of the SCHEDULE the seller defined — the deposit (effective amt/due, or null when skipped) and
    // the custom milestone slices (type/amt/due). Excludes the paid-derived "outstanding" residual and paid flags, so
    // a document goes stale on a deposit/milestone EDIT but NOT merely because the client recorded a payment.
    _milestoneFp() {
      return {
        // The deposit signature carries the amount and only a SELLER-DEFINED (manual) due — the derived systemDue
        // (firstInvoiceDate + 7 / earliest hold) is NOT a schedule edit, so a pre-invoice quote (due TBD) does not go
        // stale merely because invoicing later crystallises the due. A manualDue override DOES change the signature.
        deposit: this.deposit.skip ? null : { amt: this.depositAmt(), due: this.deposit.manualDue },
        custom: this._orderedCustom().map((m) => ({ type: m.type, amt: m.amt, due: m.due })),
      };
    }
    /** Build an immutable quote/invoice document — a snapshot of the itinerary at issue time (+ the fingerprint above). */
    _snapshotDoc(kind, id) {
      return {
        id, kind, at: this._clk(), sent: false, status: this.status, paymentStatus: this.paymentStatus,
        total: this.total(), deposit: this.depositAmt(), due: this.due(), paid: this.paid(),
        depositDetail: { amt: this.depositAmt(), due: this.depositDue(), dueLabel: this.depositDueLabel(), skip: this.deposit.skip, paid: this.deposit.paid },
        milestones: deep(this.milestoneSchedule()),                          // the payment schedule frozen at issue
        // Traveller snapshot carries the full identity (tag/full name/age/comment/group) so the Quote/Invoice/FCA
        // viewers can render the line-item tables (A/C/I counts, per-pax name (age) + comment) from the snapshot alone.
        pax: this.pax.map((p) => ({ id: p.id, name: p.name, tag: p.tag, fullName: p.fullName, type: p.type, age: p.age, comment: p.comment || '', group: p.group })),
        // Quotes & invoices list cancelled lines too (staged → TO_CANCEL, committed → CANCELLED) with the retained
        // cancellation fee; the FCA stays to the live billable set.
        lines: ((kind === 'QUOTE' || kind === 'INVOICE') ? this.docUnits() : this.billableUnits()).map((u) => {
          // Pending-change indicator for the line: a committed CANCELLED always shows; staged ops show only inside a
          // PostBookingModif amendment (TO_ADD new line · TO_CHANGE amended line · TO_CANCEL line being cancelled) so the
          // amendment quote/invoice flags exactly what is being added, changed or cancelled.
          const post = this.isPostBookingChange();
          const changeStatus = (u.status === ServiceStatus.CANCELLED) ? 'CANCELLED'
            : (post && u.pendingOp === PendingOp.CANCEL) ? 'TO_CANCEL'
            : (post && u.pendingOp === PendingOp.ADD) ? 'TO_ADD'
            : (post && u.pendingOp === PendingOp.MODIFY) ? 'TO_CHANGE' : null;
          const cancelFee = (changeStatus === 'CANCELLED' || changeStatus === 'TO_CANCEL')
            ? round((((changeStatus === 'CANCELLED') ? (u.cancellation && u.cancellation.fee) : (u.cancelIntent && u.cancelIntent.fee)) || 0))
            : null;
          // For a TO_CHANGE line the committed SPEC snapshot (incl. its frozen itemTotalPrice) gives the baseline
          // commercial figures, so the quote can render old → new. null when nothing to diff against.
          const cp = (changeStatus === 'TO_CHANGE' && u.committed && u.committed.itemTotalPrice) ? u.committed.itemTotalPrice : null;
          const prior = cp ? { price: round(cp.totalSell), total: round(cp.effectiveSell) } : null;
          return {
            id: u.id, parentId: u.parentId || null, name: u.name, type: u.type, supplierId: u.supplierId,
            supplierName: (Suppliers[u.supplierId] && Suppliers[u.supplierId].name) || u.supplierId,
            startDate: u.startDate, endDate: u.endDate, duration: u.days(), paxIds: [...(u.paxIds || [])], qty: u.qty || 1,
            // Pricing frozen at issue: price = resolved sell BEFORE promotions; discountAmt = the promotion value;
            // total/sellPrice = the post-promotion client figure. promos = the per-line applied promotions (name/amount/benefits).
            promos: this._appliedPromos(u), price: u.itemTotalPrice.sellBeforePromos != null ? u.itemTotalPrice.sellBeforePromos : u.itemTotalPrice.totalSell,
            discountAmt: round((u.itemTotalPrice.sellBeforePromos != null ? u.itemTotalPrice.sellBeforePromos : u.itemTotalPrice.totalSell) - u.sellPrice), total: u.sellPrice, sellPrice: u.sellPrice,
            status: u.status, opsReady: !!u.opsReady, supplierStatus: u.supplierStatus,
            // changeStatus = TO_ADD | TO_CHANGE | TO_CANCEL (staged in a PostBookingModif) | CANCELLED (committed) | null;
            // cancelFee = the retained fee, only on the TO_CANCEL/CANCELLED lines. prior = baseline {price,total} for a TO_CHANGE.
            changeStatus, cancelFee, prior,
            documents: (u.documents || []).map((d) => ({ id: d.id, title: d.title })),
          };
        }),
        fp: this._snapshotFp(),
      };
    }
    /* ---------- promotions read-model ---------- */
    // Catalog promos available to a line (its supplier's accom promos) + its own manual promos, each evaluated, plus the
    // item-modal toggle state. promotions are accommodation-only, so a non-accom line gets an empty/default set.
    // Drop selected instances that no line references any more (e.g. after a deselect or a change Cancel).
    _pruneOrphanPromos() { this.promotions = (this.promotions || []).filter((inst) => this.units().some((u) => (u.promotionIds || []).includes(inst.id))); }
    // Apply each MATCHED instance's benefit to its member lines' effectiveSell (a post-price pass: an instance can span
    // sibling lines, so the benefit can't be resolved per-line in refreshDerived). Resets then re-accumulates promoDiscount.
    _applyPromotions() {
      this.units().forEach((u) => { if (u.itemTotalPrice) { u.itemTotalPrice.promoDiscount = 0; u.itemTotalPrice.netDiscount = 0; } });
      (this.promotions || []).forEach((inst) => {
        const members = promoMembers(this, inst); if (!members.length) return;
        if (!evalPromotionItems(this, inst, members).matched) return;
        members.forEach((u) => { if (u.itemTotalPrice) { u.itemTotalPrice.promoDiscount += promoItemBenefit(this, inst, u, members, 'sell'); u.itemTotalPrice.netDiscount += promoItemBenefit(this, inst, u, members, 'net'); } });
      });
      this.units().forEach((u) => { const t = u.itemTotalPrice; if (!t) return; t.promoDiscount = round(t.promoDiscount); t.netDiscount = round(t.netDiscount); t.effectiveSell = round((t.sellBeforePromos != null ? t.sellBeforePromos : t.totalSell) - t.promoDiscount); t.effectiveNet = round((t.totalNet || 0) - t.netDiscount); });
    }
    // Does a line already hold an instance of this catalog template? (used to block selecting the SAME promo twice on one line)
    _itemHasTemplate(item, templateId) { return !!templateId && (this.promotions || []).some((inst) => inst.templateId === templateId && (item.promotionIds || []).includes(inst.id)); }
    // Other ACCOMMODATION lines of the instance's supplier not yet members AND not already holding the same template
    // (so the same promo is never added twice to one line) — the candidates to ADD so a circuit can match.
    _promoCandidates(inst) { return this.activeUnits().filter((x) => x.type === ServiceType.ACCOMMODATION && x.supplierId === inst.supplierId && !(x.promotionIds || []).includes(inst.id) && !this._itemHasTemplate(x, inst.templateId)).map((x) => ({ id: x.id, name: x.name })); }
    // All active ACCOMMODATION lines of a supplier — the candidate set a catalog template is PROJECTED against.
    _supplierAccoms(supplierId) { return this.activeUnits().filter((u) => u.type === ServiceType.ACCOMMODATION && u.supplierId === supplierId); }
    // PROJECTED match of a catalog template: "does the itinerary already hold accom lines that satisfy all conditions?"
    // (evaluated against ALL the supplier's accoms — the most-favourable selection). Distinct from the REAL match of a
    // selected instance, which only counts the lines actually associated with it.
    _promoProjected(t) { return evalPromotionItems(this, t, this._supplierAccoms(t.supplierId)); }
    // Per-line read-model: the instances this line is a member of (SELECTED, REAL match) + the catalog templates
    // available to its supplier (ALL, PROJECTED match — could it match given the itinerary's items) + the toggle state.
    promotionsForItem(u) {
      // multi-service instances expose their member services + the candidate lines to add; single-service ones don't.
      const mkRow = (inst) => { const members = promoMembers(this, inst), multi = requiresMultiService(inst); return { promo: inst, eval: evalPromotionItems(this, inst, members), members: members.map((m) => ({ id: m.id, name: m.name })), candidates: multi ? this._promoCandidates(inst) : [], multi, manual: !!inst.isManual }; };
      const myIds = u.promotionIds || [];
      const memberOf = (this.promotions || []).filter((inst) => myIds.includes(inst.id)).map(mkRow);
      if (!u || u.type !== ServiceType.ACCOMMODATION) return { selected: memberOf, supplierOther: [], catalog: [], toggleState: 'default' };
      // other SELECTED instances of this line's supplier it is NOT yet a member of — ONLY the multi-service (circuit) ones,
      // which are shared across the supplier's lines; single-service promos are item-specific (select your own from the
      // catalog). Exclude any whose TEMPLATE this line already holds (no adding the same promo twice to one line).
      const supplierOther = (this.promotions || []).filter((inst) => inst.supplierId === u.supplierId && !inst.isManual && !myIds.includes(inst.id) && requiresMultiService(inst) && !this._itemHasTemplate(u, inst.templateId)).map(mkRow);
      const catalog = (this.promotionCatalog || []).filter((t) => t.supplierId === u.supplierId)
        .map((t) => ({ promo: t, eval: this._promoProjected(t), projected: true, template: true, alreadySelected: this._itemHasTemplate(u, t.id) }));
      return { selected: memberOf, supplierOther, catalog, toggleState: this._promoToggleState(memberOf, catalog) };
    }
    // item-modal Promotions toggle colour: warn(yellow) a member instance no longer matches · good(green) member & all match
    // · default(grey) no members & no catalog · acc-dashed(blue-dashed) catalog exists but none can match · acc(blue) a catalog promo CAN match (projected)
    _promoToggleState(memberOf, catalog) {
      if (memberOf.some((r) => !r.eval.matched)) return 'warn';
      if (memberOf.length) return 'good';
      if (!catalog.length) return 'default';
      return catalog.some((r) => r.eval.matched) ? 'acc' : 'acc-dashed';
    }
    // Top-level Promotions & Discounts panel: every selected INSTANCE (dups allowed, REAL match) + the full CATALOG
    // (each with its PROJECTED match — can it match given the itinerary's items).
    promotionsView() {
      const selected = (this.promotions || []).map((inst) => { const members = promoMembers(this, inst), multi = requiresMultiService(inst); return { promo: inst, eval: evalPromotionItems(this, inst, members), members: members.map((m) => ({ id: m.id, name: m.name })), candidates: multi ? this._promoCandidates(inst) : [], multi }; });
      const catalog = (this.promotionCatalog || []).map((t) => ({ promo: t, eval: this._promoProjected(t), projected: true, template: true }));
      return { selected, catalog };
    }
    // Promotions APPLIED to a line, for documents & vouchers: each instance the line belongs to (amount only when matched).
    _appliedPromos(u) {
      return (this.promotions || []).filter((inst) => (u.promotionIds || []).includes(inst.id)).map((inst) => {
        const members = promoMembers(this, inst), ev = evalPromotionItems(this, inst, members);
        return { id: inst.id, templateId: inst.templateId || null, name: inst.name, isManual: !!inst.isManual, matched: ev.matched, isPartiallySupported: !!inst.isPartiallySupported, amount: ev.matched ? round(promoItemBenefit(this, inst, u, members)) : 0, benefits: (inst.actions || []).map(promoActionText), memberCount: members.length };
      });
    }
    // Selected instances on a line that no longer match — surfaced (informational, non-blocking) in the line's pending changes.
    _unmatchedSelectedPromos(u) {
      return (this.promotions || []).filter((inst) => (u.promotionIds || []).includes(inst.id) && !evalPromotion(this, inst).matched).map((inst) => ({ id: inst.id, name: inst.name }));
    }
    // Itinerary-wide: selected instances (with ≥1 member) that don't match — shown in the pending-changes panel so the user
    // notices before Apply. Informational only; never blocks Apply.
    unmatchedPromotions() {
      return (this.promotions || []).filter((inst) => promoMembers(this, inst).length && !evalPromotion(this, inst).matched)
        .map((inst) => { const members = promoMembers(this, inst); return { id: inst.id, name: inst.name, members: members.map((m) => ({ id: m.id, name: m.name })) }; });
    }
    projection() {
      // An unresolved supplier rejection makes any generated document stale — the itinerary isn't currently bookable
      // as quoted/invoiced until every rejected line is resolved, even if the spec/total fingerprint still matches.
      const fp = this.unresolvedRejection() ? null : this._snapshotFp();
      return {
        title: this.title, status: this.status, paymentStatus: this.paymentStatus, pendingChangesStatus: this.pendingStatus,
        itineraryType: this.itineraryType, isBrochure: this.isBrochure(), agencyAgent: this.agencyAgent, inquiryId: this.inquiryId,
        creditTerms: this.creditTerms, financeLocked: this.financeLocked, fcaGenerated: this.fcaGenerated, lostReason: this.lostReason,
        currentUser: deep(this.currentUser), availableUsers: deep(this.availableUsers),
        totals: { total: this.total(), committedTotal: this.committedTotal(), paid: this.paid(), due: this.due(), deposit: this.depositAmt(), profit: this.profit() },
        deposit: Object.assign(deep(this.deposit), { amt: this.depositAmt(), due: this.depositDue(), dueLabel: this.depositDueLabel(), custom: this.depositCustom() }),
        milestones: this.milestoneSchedule(),
        nextMilestone: this.nextMilestone(),
        pax: deep(this.pax),
        payments: deep(this.payments),
        quotes: this.quotes.map((q) => Object.assign(deep(q), { matchesCurrent: q.fp === fp })),
        invoices: this.invoices.map((iv) => Object.assign(deep(iv), { matchesCurrent: iv.fp === fp })),
        fcas: this.fcas.map((f) => Object.assign(deep(f), { matchesCurrent: f.fp === fp })),
        // services listed by start date (ISO, so lexical order is chronological); a dateless item sorts last, and the
        // sort is stable so same-day services keep their creation order. Extras stay nested under their parent service.
        items: this.items.slice().sort((a, b) => (a.startDate === b.startDate) ? 0 : (!a.startDate ? 1 : (!b.startDate ? -1 : (a.startDate < b.startDate ? -1 : 1)))).map((s) => this._itemView(s)),
        vouchers: this.voucherView(),
        suppliers: this.supplierView(),
        promotions: this.promotionsView(),
        promotionsUnmatched: this.unmatchedPromotions(),   // itinerary-wide unmatched selected promos (pending-changes advisory)
        continuity: this.continuity(),
      };
    }
    _itemView(u) {
      const ll = u.liveLine();
      const v = deep({
        id: u.id, parentId: u.parentId || null, name: u.name, type: u.type, supplierId: u.supplierId,
        startDate: u.startDate, endDate: u.endDate, rates: u.rates, paxIds: u.paxIds, qty: u.qty,
        location: u.location || null, fromLocation: u.fromLocation || null, toLocation: u.toLocation || null,
        sellPrice: u.sellPrice, systemPrice: u.systemPrice, manualPrice: u.manualPrice, hypothetical: u.hypothetical,
        // priced manually = any seller sell-side lever is set (total / margin / per-line override); over/underpriced flags
        manuallyPriced: (u.itemManualPrice.manualTotalSell != null || u.itemManualPrice.manualMargin != null || (u.itemManualPrice.unitOverrides || []).length > 0 || (u.itemManualPrice.paxOverrides || []).length > 0),
        overpriced: u.itemTotalPrice.overpriced, underpriced: u.itemTotalPrice.underpriced,
        // the split price fields surfaced for the view (system = read-only, manual = editable, promos = selected instances, total = calc)
        itemSystemPrice: u.itemSystemPrice, itemManualPrice: u.itemManualPrice, promotionIds: u.promotionIds || [], itemTotalPrice: u.itemTotalPrice, rateType: u.rateType,
        // promotions read-model for this line: catalog promos (with match/eval + selected), this line's manual promos, and the modal toggle state
        promotions: this.promotionsForItem(u),
        price: {
          systemPrice: u.itemSystemPrice, systemMargin: u.itemSystemPrice.systemMargin,
          manualMargin: u.itemManualPrice.manualMargin, manualTotalSell: u.itemManualPrice.manualTotalSell,
          manualPrice: u.itemTotalPrice.manualPrice, promoDiscount: u.itemTotalPrice.promoDiscount, sellBeforePromos: u.itemTotalPrice.sellBeforePromos, netDiscount: u.itemTotalPrice.netDiscount, effectiveNet: u.itemTotalPrice.effectiveNet, appliedPromos: this._appliedPromos(u),
          totalNet: u.itemTotalPrice.totalNet, totalRack: u.itemTotalPrice.totalRack, totalSell: u.itemTotalPrice.totalSell,
          rateTitle: rateTypeTitle(u.rateType), overpriced: u.itemTotalPrice.overpriced, underpriced: u.itemTotalPrice.underpriced, effectiveSell: u.sellPrice, netFigure: u.netFigure(),
          // price-engine breakdown (display): net → purchase → CPS margin + TC commission → last-contracted sell → uplift → sell
          purchaseNet: u.itemTotalPrice.purchaseNet, cpsMargin: u.itemTotalPrice.cpsMargin, cpsAmount: u.itemTotalPrice.cpsAmount,
          tcEnabled: u.itemTotalPrice.tcEnabled, tcRate: u.itemTotalPrice.tcRate, tcAmount: u.itemTotalPrice.tcAmount,
          upliftRate: u.itemTotalPrice.upliftRate, upliftYears: u.itemTotalPrice.upliftYears, upliftFactor: u.itemTotalPrice.upliftFactor, upliftApplied: u.itemTotalPrice.upliftApplied, upliftPct: u.itemTotalPrice.upliftPct, upliftAmount: u.itemTotalPrice.upliftAmount,
          lastContractedSell: u.itemTotalPrice.lastContractedSell, derivedSell: u.itemTotalPrice.derivedSell, rackCeiling: u.itemTotalPrice.rackCeiling,
          systemSell: u.itemTotalPrice.systemSell, manual: u.itemTotalPrice.manual,   // systemSell = pure engine output; manual = null|{kind:'flat'|'breakdown',…} (IGNORES uplift, wins over system)
          sellProvided: !!(u.itemSystemPrice && u.itemSystemPrice.sellProvided),   // system price already carries a sell (seller margin baked in)
          // for the modal breakdown: number of time units, and the count of each pax code (ADT/CHD/INF) on the line
          units: unitsOf(u),
          paxCounts: (u.paxIds || []).reduce((m, pid) => { const p = this.pax.find((x) => x.id === pid); if (p) { const c = PAX_CODE[p.type] || 'ANY'; m[c] = (m[c] || 0) + 1; } return m; }, {}),
        },
        status: u.status, activeStatus: u.activeStatus, isUpdated: u.isUpdated, isAuto: u.isAuto(), origin: u.origin, pendingOp: u.pendingOp,
        // Supplier-payment due — when this line's supplier balance is due (travel start − the effective balance dueDays).
        // dueDate is the ISO date; daysBeforeStart is the terms window; fromTerms flags confirmed terms vs the supplier default.
        supplierPayment: (() => { const day = u.supplierDueDay(); const sched = u.isService() ? u : (u.parent() || u); return {
          dueDate: day != null ? isoForDay(day) : null, dueDay: day, daysBeforeStart: u.dueDays(), depositPct: u.depositPct(),
          startDate: sched ? sched.startDate : u.startDate, fromTerms: !!(sched && sched.paymentTerms),
        }; })(),
        opsReady: u.opsReady, cancellation: u.cancellation, paymentTerms: u.paymentTerms, locked: u.locked, documents: u.documents || [], datesLocal: u.datesLocal, requestOnApply: u.requestOnApply && this.isPostBookingChange(), confirmOnApply: u.confirmOnApply,
        holds: (u.holds || []).map((h) => Object.assign({}, h, { disabled: u.holdsDisabled() })), holdMismatch: u.holdMismatch, activeHold: u.activeHold,
        commercial: {
          target: u.target(), requested: u.requested, confirmed: u.confirmed, priorRequested: u.priorRequested, supplierAside: u.supplierAside,
          voucher: (u.requested && u.requested.voucherId) ? { id: u.requested.voucherId, lineId: u.id, state: ll ? ll.state : u.requested.state, action: ll ? ll.action : null, holdId: ll ? ll.holdId : null } : null,
          confirmedVoucherId: u.confirmed ? (u.confirmed.voucherId || null) : null,
        },
        // staged change on this line (OLD → NEW), or null
        changes: (u.pendingOp || u.committedLife) ? {
          op: u.pendingOp || null,
          fields: this.stagedDiff(u),                                                        // [{ f, before, after }]
          status: (u.committedLife && u.committedLife.status !== u.status) ? { before: u.committedLife.status, after: u.status } : null,
          holds: (u.committedLife && JSON.stringify(u.committedLife.holds || []) !== JSON.stringify(u.holds || [])) ? { before: u.committedLife.holds || [], after: u.holds || [] } : null,
          nextStatus: u.nextStatus(),                                                        // derived "on Apply" landing, or null
          // a Validate price that cleared the hypothetical estimate flag (the net may be unchanged) — shown as its own row
          priceValidated: !!(u.committed && u.committed.itemSystemPrice && u.committed.itemSystemPrice.hypothetical && u.itemSystemPrice && !u.itemSystemPrice.hypothetical),
          requestOnApply: !!u.requestOnApply && this.isPostBookingChange(), confirmOnApply: !!u.confirmOnApply, cancelIntent: u.cancelIntent || null,
          // informational only (never blocks Apply): selected promotions that no longer match — so the user notices before applying
          promosUnmatched: (() => { const un = this._unmatchedSelectedPromos(u); return un.length ? un : null; })(),
        } : null,
        supplierStatus: u.supplierStatusShown, line: { state: u.lineLabel(), ver: u.lineVer() },
      });
      if (u.isService()) v.extras = (u.extras || []).map((e) => this._itemView(e));
      return v;
    }

    /** The persisted truth: pristine baseline + active change-set edit-list + summary. */
    dbDocument() {
      const baselineItems = this.items
        .filter((s) => !(s.origin === 'PENDING' && s.pendingOp === PendingOp.ADD))
        .map((s) => {
          const spec = s.baseSpec();
          const extras = (s.extras || [])
            .filter((e) => !(e.origin === 'PENDING' && e.pendingOp === PendingOp.ADD))
            .map((e) => { const es = e.baseSpec(), esys = es.itemSystemPrice, eman = es.itemManualPrice, etot = es.itemTotalPrice; return { id: e.id, name: es.name, type: es.type, supplierId: es.supplierId, sellPrice: effPrice(es), netPrice: etot ? etot.totalNet : 0, systemPrice: esys ? esys.total.sell : 0, manualPrice: eman ? eman.manualTotalSell : null, itemManualPrice: eman, promotionIds: es.promotionIds || [], itemTotalPrice: etot, hypothetical: esys ? esys.hypothetical : true, status: e.status, requested: e.requested, confirmed: e.confirmed }; });
          const ssys = spec.itemSystemPrice, sman = spec.itemManualPrice, stot = spec.itemTotalPrice;
          return {
            id: s.id, name: spec.name, type: spec.type, supplierId: spec.supplierId, startDate: spec.startDate, endDate: spec.endDate,
            rates: spec.rates, rateType: spec.rateType, paxIds: spec.paxIds, sellPrice: effPrice(spec), netPrice: stot ? stot.totalNet : 0, systemPrice: ssys ? ssys.total.sell : 0, manualPrice: sman ? sman.manualTotalSell : null, itemManualPrice: sman, promotionIds: spec.promotionIds || [], itemTotalPrice: stot, hypothetical: ssys ? ssys.hypothetical : true,
            status: s.status, requested: s.requested, confirmed: s.confirmed, holds: s.holds || [], opsReady: s.opsReady,
            supplierAside: s.supplierAside || null, priorRequested: s.priorRequested || null, cancellation: s.cancellation || null, extras,
          };
        });
      return deep({
        id: 'itn_0001', title: this.title, itineraryType: this.itineraryType, agencyAgent: this.agencyAgent, inquiryId: this.inquiryId,
        status: this.status, paymentStatus: this.paymentStatus, pendingChangesStatus: this.pendingStatus,
        creditTerms: this.creditTerms, financeLocked: this.financeLocked, fcaGenerated: this.fcaGenerated, lostReason: this.lostReason,
        paxList: this.pax.filter((p) => p.origin !== 'PENDING'),
        baseline: { items: baselineItems },
        vouchers: this.voucherView(),
        supplierBookings: this.supplierBookings,
        payments: this.payments,
        deposit: this.deposit,
        paymentMilestones: this.paymentMilestones,
        activeChangeSet: this.changeSet ? { trigger: this.changeSet.trigger, type: this.changeSet.type, status: this.changeSet.status, edits: this.changeEdits(), pendingPax: this.pax.filter((p) => p.origin === 'PENDING' || p.pendingRemove).map((p) => ({ id: p.id, type: p.type, origin: p.origin, pendingRemove: p.pendingRemove })) } : null,
        summary: this.summary(),
      });
    }
    changeEdits() {
      return this.staged().map((u) => ({
        unitId: u.id, parentId: u.parentId || null, op: u.pendingOp,
        before: u.committed || null, after: u.spec(), cancelIntent: u.cancelIntent || null,
        lifecycle: { status: u.status, requested: u.requested || null, confirmed: u.confirmed || null, priorRequested: u.priorRequested || null, supplierAside: u.supplierAside || null },
      }));
    }
    stagedDiff(u) { return u.committed ? this._specDiff(u.committed, u.spec()) : []; }

    /* ---- voucher / supplier read models ---- */
    /**
     * Merged payment-terms timeline for a voucher's confirmed services: each service contributes a due
     * date (travel start − dueDays) and an outstanding figure (service + inherited extras). Rolls up to
     * the earliest due date and the total outstanding the supplier panel shows.
     */
    _voucherTerms(v) {
      const entries = [];
      v.lines.filter((l) => l.action === LineAction.CONFIRM).forEach((l) => {
        const it = this.findItem(l.itemId); if (!it) return;
        const sched = it.isService() ? it : (it.parent() || it);       // an extra's due date follows its parent service
        const terms = sched ? sched.paymentTerms : null;
        if (!terms) return;                                             // not yet confirmed / no terms → not on the timeline
        const dueDay = dayNum(sched.startDate) - terms.dueDays;
        entries.push({
          itemId: l.itemId, parentId: l.parentId, name: it.name, startDate: sched.startDate,
          inherited: it.isExtra(), depositPct: terms.depositPct, dueDays: terms.dueDays,
          dueDay, dueToken: dueToken(dueDay), outstanding: l.price, deposit: round(l.price * terms.depositPct),
        });
      });
      entries.sort((a, b) => a.dueDay - b.dueDay);
      const minDueDay = entries.length ? entries[0].dueDay : null;
      return {
        entries, minDueDay, minDueToken: minDueDay == null ? null : dueToken(minDueDay),
        totalOutstanding: entries.reduce((a, e) => a + e.outstanding, 0),
        depositTotal: entries.reduce((a, e) => a + e.deposit, 0),
      };
    }
    voucherView() {
      return this.vouchers.map((v) => ({
        id: v.id, supplierId: v.supplierId, supplierName: Suppliers[v.supplierId] ? Suppliers[v.supplierId].name : v.supplierId,
        ver: v.ver, status: v.status, bookingId: v.bookingId, comment: v.comment,
        supersedes: v.supersedes, supersededBy: v.supersededBy, isLive: v.isLive(), isPriorRace: v.isPriorRace(),
        lines: v.lines.map((l) => { const it = this.findItem(l.itemId); return { itemId: l.itemId, parentId: l.parentId, name: it ? it.name : l.itemId, action: l.action, price: l.price, promos: l.promos ? deep(l.promos) : [], state: l.state, holdId: l.holdId, terms: l.terms ? deep(l.terms) : null }; }),
        terms: this._voucherTerms(v),
      }));
    }
    supplierView() {
      return this.suppliersWithVouchers().map((sup) => {
        const all = this.vouchers.filter((v) => v.supplierId === sup);
        const latest = this.latestVoucherFor(sup);
        // Payment view: total owed comes from the latest CONFIRMED voucher's terms; paid is the sum of recorded
        // supplier payments; due = total − paid; dueDate is the earliest due token on that confirmed timeline.
        const pterms = this.supplierTerms(sup);
        const total = pterms ? pterms.totalOutstanding : 0;
        const paid = this.supplierPaid(sup);
        return {
          id: sup, name: Suppliers[sup] ? Suppliers[sup].name : sup, booking: this.supplierBookings[sup] || null,
          voucherCount: all.length,
          vouchers: all.map((v) => ({ id: v.id, ver: v.ver, status: v.status, isLive: v.isLive() })),
          latestVoucherId: latest ? latest.id : null, latestStatus: latest ? latest.status : null,
          terms: latest ? this._voucherTerms(latest) : null,
          hasConfirmedVoucher: this.hasConfirmedVoucher(sup),
          locked: this.supplierLocked(sup),
          payment: { total, paid, due: total - paid, dueDate: pterms ? pterms.minDueToken : null, payments: deep(this.supplierPaymentsFor(sup)) },
        };
      });
    }

    /* ======================================================================
     * 5. Action catalogue — getActions()
     *    A single registry; getActions() materialises bound descriptors.
     * ==================================================================== */
    getActions() {
      const sel = this.selected();
      return ACTION_REGISTRY.map((a) => {
        const isItem = a.category === 'item';
        const target = isItem ? sel : undefined;
        // isAllowed() → { ok, why, gated? } (gated:true = right step, satisfiable runtime condition); .code = the readable JS that decides it
        // (the described checks collection when the action authors one, else the hand-written isAllowed source).
        const isAllowed = Object.assign((input) => gateAllowed(this, a, target, input), { code: a.checks ? checksCode(a) : a.isAllowed.toString() });
        // execute(input) → Promise (refuses with {ok:false, why} when isAllowed refuses); .code = the readable JS that runs.
        const execute = Object.assign((input) => gateExec(this, a, target, input), { code: a.execute.toString() });
        return {
          id: a.id, ruleId: a.ruleId, category: a.category,
          group: UI_GROUPS[a.id] || a.category,   // presentation hint only (view grouping)
          statusTx: ITEM_STATUS_TX[a.id] || null, // view hint: item status-transition → the status it moves the line TO
          hidden: isHidden(this, a),              // view hint: off the UI surfaces (static a.hidden, or brochure-gated / convert-on-booking)
          requiresSelection: !!isItem,
          description: a.description,              // human-readable label
          preconditions: a.preconditions,         // human-readable "when"
          outcome: a.outcome,                     // human-readable "then"
          params: (typeof a.params === 'function' ? a.params(this) : a.params) || NO_INPUT,   // schema (or a state-dependent fn) → build the modal dynamically
          checks: (a.checks || []).map((c) => ({ description: c.description })),   // the action's DECLARED checks (static, state-independent) — names only; live ✓/✗ come from isAllowed().checks
          isAllowed,                              // () => {ok, why, checks[]};  + .code (JS string)
          execute,                                // (input) => Promise; + .code (JS string)
        };
      });
    }

    /* The query side of getActions(): materialise the VIEW_REGISTRY with the SAME descriptor shape.
     * `run(input)` is the query analogue of action `execute` — it invokes the delegating read-model
     * (named `run` so it never collides with execute/isAllowed) and carries .code like actions do.
     * No isAllowed: a query is always allowed. Item-scope views target the selected line. */
    getViews() {
      const sel = this.selected();
      return VIEW_REGISTRY.map((v) => {
        const target = v.scope === 'item' ? sel : undefined;
        const run = Object.assign((input) => v.query(this, target, input || {}), { code: v.query.toString() });
        return {
          id: v.id, ruleId: v.ruleId || null, scope: v.scope,
          group: VIEW_GROUPS[v.id] || v.scope,    // presentation hint only (view grouping)
          requiresSelection: v.scope === 'item',  // item views read the selected line
          requiresPax: v.scope === 'pax',         // pax views need a paxId filter
          description: v.description,              // human-readable label
          reads: v.reads || '',                   // human-readable "what it returns"
          params: (typeof v.params === 'function' ? v.params(this) : v.params) || NO_INPUT,   // FILTER schema (or state-dependent fn)
          returns: v.returns || 'object',         // descriptive result-shape hint
          run,                                     // (input) => read-model value; + .code (JS string)
        };
      });
    }

    /* ======================================================================
     * 6. Happy path — special, known by the UI.
     *    Drives the REAL Enabled/Exec methods with default inputs, no prompts.
     * ==================================================================== */
    async happyPath(stopAfter) {
      this.reset();
      const tryItem = async (u, fn, input) => { if (!u) return; this.select(u.id); if (this['item' + fn + 'Enabled'](u).ok) await this['item' + fn + 'Exec'](u, input || {}); };
      const tryItny = async (fn, input) => { if (this['itny' + fn + 'Enabled']().ok) await this['itny' + fn + 'Exec'](undefined, input || {}); };
      // Stop the drive at a milestone (the Reset-dropdown presets) — back to the sales operator, deselect, return.
      const stop = (here) => { if (stopAfter !== here) return false; this.setCurrentUser('Sam (Sales)'); this.select(null); return true; };

      // Two families on the booking: the Smith family (an adult + the child) and Tom Brooks (the other adult). The seeded
      // travellers are already on every service, so naming them (staged via Edit Pax — the comment surfaces on the FCA) is
      // enough; both groups then show on every item card.
      const seeded = this.pax.slice();   // snapshot — naming sets groups, which reorders this.pax by group mid-loop
      for (let i = 0; i < seeded.length; i++) {
        const p = seeded[i], f = PAX_SAMPLES[p.tag] || {};   // same seeded profiles the Edit Pax form pre-fills
        await tryItny('EditPax', { paxId: p.id, group: f.group || SAMPLE_GROUP, paxType: p.type, fullName: f.fullName || SAMPLE_FULLNAMES[i % SAMPLE_FULLNAMES.length], comment: f.comment || '', age: f.age != null ? f.age : (p.type === PaxType.CHILD ? 9 : 35) });
      }
      if (this.inChange()) await this.pendingChangesApplyExec(undefined, {});                // commit the family edits
      // Attach documents — the lodge gets two (voucher + park permit), an arrival transfer gets one. Saved immediately.
      const lodge = this.activeUnits().find((u) => u.type === ServiceType.ACCOMMODATION);
      const transfer = this.activeUnits().find((u) => u.type === ServiceType.TRANSPORT);
      if (lodge) { await tryItem(lodge, 'AddDocument', { title: 'Lodge Voucher', description: DEFAULT_DOC_URL }); await tryItem(lodge, 'AddDocument', { title: 'Park Permit', description: DEFAULT_DOC_URL }); }
      if (transfer) await tryItem(transfer, 'AddDocument', { title: 'Transfer Voucher', description: DEFAULT_DOC_URL });

      for (const u of this.activeUnits().slice()) await tryItem(u, 'ValidatePrice', {});   // validate prices (stages a draft change)
      if (this.inChange()) await this.pendingChangesApplyExec(undefined, {});              // save the validation draft change
      const holdTarget = this.activeUnits().find((u) => u.status === ServiceStatus.NEW);
      await tryItem(holdTarget, 'RequestHold', {});                                        // grab a supplier hold (Add Hold — holds are free, staged in a change)
      if (this.inChange()) await this.pendingChangesApplyExec(undefined, {});              // save the hold draft change
      await tryItny('Prepare');                                                            // DRAFT → PREPARED
      await tryItny('Quote');                                                              // generate the quote document (status unchanged)
      await tryItny('ToQuoted');                                                           // → QUOTED (matching quote exists)
      if (stop('quoted')) return this.status;                                              // preset: QUOTED
      await tryItny('Accept');                                                             // → APPROVED
      await tryItny('Invoice');                                                            // generate the invoice document (status unchanged)
      await tryItny('ToInvoiced');                                                         // → INVOICED, deposit requested
      if (stop('invoiced')) return this.status;                                            // preset: INVOICED (deposit requested, unpaid)
      this.setCurrentUser('Fiona (Finance)');                                              // recording client money is a FIN action (R-MN-05)
      await tryItny('Pay', { amount: this.depositAmt() });                                 // client pays the deposit
      this.setCurrentUser('Sam (Sales)');                                                  // back to the sales operator
      if (stop('invoicedPaid')) return this.status;                                        // preset: INVOICED + deposit paid
      await tryItny('SendVouchers');                                                       // → VOUCHERED (insurance auto-confirms)
      if (stop('vouchered')) return this.status;                                           // preset: VOUCHERED (vouchers live, awaiting supplier confirm)
      for (const v of this.liveVouchers().slice()) {                                       // suppliers confirm each voucher (all-or-nothing)
        if (this.voucherConfirmEnabled(undefined, { voucherId: v.id }).ok) await this.voucherConfirmExec(undefined, { voucherId: v.id, bookingId: 'BK-' + v.supplierId });
      }
      await tryItny('Confirm');                                                            // → CONFIRMED
      this.setCurrentUser('Olivia (Ops)');                                                 // OPS_READY toggles + Generate FCA are OPS-only (R-OPS-01/02)
      for (const u of this.billableUnits().slice()) await tryItem(u, 'ToggleOpsReady', {});// Ops-confirm every billable line (OPS_READY, R-OPS-01)
      await tryItny('GenerateFCA');                                                        // all lines OPS_READY → issue the Final Confirmation Advice (R-OPS-02)
      this.setCurrentUser('Sam (Sales)');                                                  // back to the default sales operator
      this.select(null);
      return this.status;
    }

  }

  /* ======================================================================
   * 8. Action registry — the catalogue getActions() materialises.
   *    `fn` is the method base name: {fn}Enabled / {fn}Exec must exist.
   *    Stays in declaration order → drives the UI grouping.
   * ==================================================================== */
  // Presentation grouping hint (id → UI group). View-only; no behaviour attached.
  const UI_GROUPS = {
    addService: 'build', addTraveller: 'build', removeTraveller: 'build', editPax: 'build',
    openChange: 'change',      // the Pending Changes entry point
    // TRANSITION TO: every status move is a manual "→ STATUS" action (order + terminal separator imposed by the view).
    convertToItinerary: 'transition',   // brochure → booking promotion (only shown for a brochure)
    revert: 'transition', prepare: 'transition', toQuoted: 'transition', accept: 'transition', toInvoiced: 'transition',
    voucher: 'transition', confirm: 'transition', lost: 'transition', superseded: 'transition', cancelItn: 'transition',
    // Documents — generate the snapshots that the → QUOTED / → INVOICED transitions gate on, plus the FCA.
    quote: 'documents', invoice: 'documents', generateFCA: 'documents',
    // Payments — record client money + manage the deposit / milestone schedule (rendered in the Payments card).
    pay: 'payments', refund: 'payments',
    depositEdit: 'milestones', milestoneAdd: 'milestones', milestoneEdit: 'milestones', milestoneRemove: 'milestones',
    // Secondary / exception actions.
    reopen: 'flags', toggleCredit: 'flags', toggleLock: 'flags', copyAsBrochure: 'flags',   // copyAsBrochure last in ● Other (also last among flags in the registry)
    creditNoteAdd: 'creditNotes', creditNoteTransfer: 'creditNotes',   // rendered in the Payments & allocations card, not the itinerary-actions list
    cPrepare: 'changeCycle', cQuote: 'changeCycle', cApprove: 'changeCycle', cInvoice: 'changeCycle',
    cRevertDraft: 'changeCycle', cApply: 'changeCycle', cCancel: 'changeCycle',
    expire: 'hold', holdStatus: 'hold',   // rendered per-hold in the item modal, not in the generic item-action list
    voucherConfirm: 'voucher', voucherReject: 'voucher', voucherConfirmPrior: 'voucher', voucherRejectPrior: 'voucher',
  };
  // View-only: item status-transition actions → the status they move the selected line TO. The item modal renders
  // these as a status picker next to the line's status (each option runs the typed, gated registry action; blocked
  // ones show their reason). removeItem / revertAmend are deliberately NOT here — they stay as separate buttons.
  // Guard convention: each transition gates against the line's ACTIVE status (Item#activeStatus — the committed
  // baseline while a change is open, advanced async by supplier events), never the optimistic staged status, so a
  // staged transition can't unlock further ones (e.g. NEW staged→AWAITING must not offer CANCEL).
  const ITEM_STATUS_TX = {
    newItem: 'NEW', markAwaiting: 'CONFIRMED', cancel: 'CANCELLED',
  };

  // Presentation grouping hint for the VIEW catalogue (id → UI group). The query-side mirror of
  // UI_GROUPS — view-only, no behaviour attached. See VIEW_REGISTRY / getViews().
  const VIEW_GROUPS = {
    summary: 'overview', projection: 'overview',
    dbDocument: 'persistence',
    items: 'build', itemView: 'build', paxes: 'build', paxRoute: 'build',
    suppliers: 'commercial', vouchers: 'commercial',
    milestones: 'payments',
    continuity: 'continuity',
    promotions: 'promotions', unmatchedPromotions: 'promotions', itemPromotions: 'promotions', appliedPromos: 'promotions',
    changeEdits: 'change', stagedDiff: 'change',
  };

  const ACTION_REGISTRY = [
    /* ---- itinerary: build ---- */
    { id: 'addService', fn: 'itnyAddService', category: 'itny', ruleId: 'R-CH-20', description: 'Add service',
      preconditions: 'An open or auto-opening change (staged ADD).', outcome: 'Adds a new service line as a staged ADD (auto-opens a draft change in DRAFT).',
      params: schema({ type: fEnum(Object.values(ServiceType), 'Service type', ServiceType.ACTIVITY), supplierId: fEnum(Object.keys(Suppliers), 'Supplier', 'C'), name: fStr('Name', 'Game drive'), adultRate: fNum('Adult rate / day', 250), childRate: fNum('Child rate / day', 150), startDate: fStr('Start (D1..)', 'D1'), endDate: fStr('End (D1..)', 'D1'), qty: fNum('Quantity (commercial)', 1) }, ['type', 'supplierId', 'name']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Add a service — staged in the change (auto-opens in DRAFT, R-CH-20).') : no('Add a service via a change; ' + itn.offDraftHint() + '.') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        const type = String(i.type || ServiceType.ACTIVITY).toUpperCase();
        if (!Object.values(ServiceType).includes(type)) return no('Unknown service type "' + type + '".');
        const sup = i.supplierId || 'C'; if (!Suppliers[sup]) return no('Unknown supplier "' + sup + '".');
        const name = i.name || 'Game drive'; if (!name) return no('A service name is required.');
        const rates = { ADULT: Number(i.adultRate) || 0, CHILD: Number(i.childRate) || 0, INFANT: 0 };
        const sd = i.startDate || 'D1', ed = i.endDate || sd;
        const qty = Math.max(1, Number(i.qty) || 1);
        itn._ensureChange();
        const it = itn.addService(type, sup, name, rates, sd, ed, qty);
        it.origin = 'PENDING'; it.pendingOp = PendingOp.ADD; it.hypothetical = false;
        itn._touchChange(); itn._log('seller', 'staged ADD ' + it.id + ' ' + name);
        itn.recompute();
      } },
    { id: 'addTraveller', fn: 'itnyAddTraveller', category: 'itny', ruleId: 'R-PX-03', description: 'Add traveller',
      preconditions: 'An open or auto-opening change (staged PENDING).', outcome: 'Adds a traveller; PENDING & priceless until allocated to a service, committed on Apply.',
      params: schema({ paxType: fEnum(Object.values(PaxType), 'Traveller type', PaxType.ADULT) }, ['paxType']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Add a traveller — staged PENDING in the change (auto-opens in DRAFT).') : no('Pax change goes via a change; ' + itn.offDraftHint() + '.') },
      ],
      async execute(itn, u, input) {
        const type = String((input && input.paxType) || PaxType.ADULT).toUpperCase();
        if (!Object.values(PaxType).includes(type)) return no('Unknown traveller type "' + type + '".');
        itn._ensureChange();
        const px = itn.addPax(type); itn.recompute();
        itn._log('seller', 'added ' + type + ' ' + px.name + (px.origin === 'PENDING' ? ' (PENDING — allocate to a service, R-PX-03)' : ''));
      } },
    { id: 'removeTraveller', fn: 'itnyRemoveTraveller', category: 'itny', ruleId: 'R-PX-03', description: 'Remove traveller',
      preconditions: 'An open or auto-opening change (staged remove on Apply).', outcome: 'Removes the traveller and de-allocates them from every line (on Apply).',
      params: schema({ paxId: fStr('Traveller id', '') }, ['paxId']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Remove a traveller — staged in the change (removed on Apply; auto-opens in DRAFT).') : no('Pax change goes via a change; ' + itn.offDraftHint() + '.') },
      ],
      async execute(itn, u, input) {
        const id = input && input.paxId; if (!id) return no('A traveller id is required.');
        if (!itn.pax.some((p) => p.id === id)) return no('No traveller "' + id + '".');
        itn.delPax(id);
      } },
    // Edit a traveller's group / type / age / full name, staged through a pending change (auto-opens in DRAFT; a Cancel
    // reverts). The stored group + full name start EMPTY (reset/fresh load) — the form prefills a sample group + a sample
    // full name so an edit is one click. A type change reassigns a fresh monotonic tag and re-prices the lines it sits on.
    { id: 'editPax', fn: 'itnyEditPax', category: 'itny', ruleId: 'R-PX-04', description: 'Edit Pax',
      preconditions: 'An open or auto-opening change, with at least one traveller.', outcome: 'Updates a traveller’s group, type, age and full name (staged; a type change re-tags + re-prices its lines).',
      params: (itn) => {
        // default to the focused traveller (set by the view's edit button); fall back to the first one.
        const p = itn.selectedPax() || itn.pax[0];
        const s = (p && PAX_SAMPLES[p.tag]) || {};
        const rot = SAMPLE_FULLNAMES[(itn.pax.length + itn._idc) % SAMPLE_FULLNAMES.length];
        // each field defaults to the traveller's OWN value, else the seeded sample for its tag, else a sensible fallback.
        const group = (p && p.group) ? p.group : (s.group || SAMPLE_GROUP);
        const fullName = (p && p.fullName) ? p.fullName : (s.fullName || rot);
        const comment = (p && p.comment) ? p.comment : (s.comment || '');
        const age = (p && p.age != null) ? p.age : (s.age != null ? s.age : (p && p.type === PaxType.CHILD ? 9 : 35));
        return schema({
          paxId: fStr('Traveller id', p ? p.id : ''),
          group: fStr('Group (surname)', group),
          paxType: fEnum(Object.values(PaxType), 'Traveller type', p ? p.type : PaxType.ADULT),
          age: fNum('Age (optional)', age),
          fullName: fStr('Full name', fullName),
          comment: fStr('Comment (shown on the FCA)', comment),
        }, ['paxId']);
      },
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Edit a traveller — staged in the change (auto-opens in DRAFT, R-PX-04).') : no('Pax change goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Has travellers', check: (itn) => itn.pax.length ? ok('Travellers available to edit.') : no('No travellers to edit.') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        const id = i.paxId; if (!id) return no('A traveller id is required.');
        const p = itn.pax.find((x) => x.id === id); if (!p) return no('No traveller "' + id + '".');
        const oldType = p.type;
        const newType = i.paxType ? String(i.paxType).toUpperCase() : p.type;
        if (!Object.values(PaxType).includes(newType)) return no('Unknown traveller type "' + newType + '".');
        itn._stagePaxEdit(p, () => {
          if (i.group != null) p.group = String(i.group);
          if (i.fullName != null) p.fullName = String(i.fullName);
          if (i.comment != null) p.comment = String(i.comment);
          if (i.age != null && i.age !== '') p.age = Number(i.age);
          if (newType !== oldType) {
            p.type = newType; p.tag = itn._nextPaxTag(newType); p.name = p.tag;   // a type change → a fresh monotonic tag (never reused)
            itn.units().forEach((un) => { if ((un.paxIds || []).includes(p.id)) { if (un.origin === 'BASELINE' && !un.pendingOp) itn._beginEdit(un, PendingOp.MODIFY); itn._reprice(un); } });
          }
        });
        itn._log('seller', 'edited pax ' + p.tag + ' · group "' + (p.group || '—') + '" · ' + p.type + (p.age != null ? ' · age ' + p.age : '') + ' · ' + (p.fullName || '—') + ' (R-PX-04)');
      } },

    /* ---- itinerary: lifecycle ---- */
    // "Open a change" heads the seller lifecycle group: the entry point into the Pending Changes cycle.
    { id: 'openChange', fn: 'pendingChangesOpen', category: 'pendingChanges', ruleId: 'R-CH-21', description: 'Open a change',
      preconditions: 'INVOICED (Apply/Cancel only) or VOUCHERED+ and not finance-locked; one change at a time.', outcome: 'Opens a Pending Change (seller or client-initiated).',
      params: schema({ initiator: fEnum([ChangeTrigger.SELLER, ChangeTrigger.CLIENT_REQUEST], 'Initiator', ChangeTrigger.SELLER) }),
      checks: [
        { description: 'No open change', check: (itn) => itn.inChange() ? no('A change is already in progress (one at a time).') : ok('No change in progress.') },
        { description: 'Issued itinerary', check: (itn) => {
          if (['VOUCHERED', 'CONFIRMED'].includes(itn.status))
            return itn.financeLocked ? gated('Finance-locked — total-changing changes blocked (R-FN-01).') : ok('Issued itinerary → modify via Pending Changes (R-CH-21).');
          if (itn.status === ItineraryStatus.INVOICED)
            return ok('INVOICED — stage edits or request supplier confirmations before vouchering (Apply/Cancel only; or Revert to Draft, R-IT-10/R-CH-21).');
          return no('In DRAFT just start editing — a draft change opens automatically (Apply/Cancel only). Explicit Open-a-change is for INVOICED+ (R-CH-21).');
        } },
      ],
      async execute(itn, u, input) {
        const initiator = (input && input.initiator) === ChangeTrigger.CLIENT_REQUEST ? ChangeTrigger.CLIENT_REQUEST : ChangeTrigger.SELLER;
        itn._openChange(initiator);
      } },
    { id: 'prepare', fn: 'itnyPrepare', category: 'itny', ruleId: 'R-LC-02', description: '→ PREPARED',
      preconditions: 'DRAFT with ≥1 service and NO open pending change (all changes saved); prices may stay hypothetical estimates.', outcome: 'Status → PREPARED.', params: NO_INPUT,
      checks: [
        { description: 'From DRAFT', check: (itn) => itn.status === ItineraryStatus.DRAFT ? ok('In DRAFT.') : no('Only from DRAFT — itinerary is ' + itn.status + '.') },
        { description: 'Changes saved', check: (itn) => itn.inChange() ? gated('Save (Apply) or cancel the open pending change first — all changes must be saved (R-LC-02).') : ok('No open change.') },
        { description: 'Has a service', check: (itn) => itn.activeUnits().length > 0 ? ok('Has at least one service.') : gated('Add at least one service first.') },
        { description: 'Ready', check: (itn) => ok(itn.provCount() > 0 ? 'Lock as PREPARED (' + itn.provCount() + ' price(s) still hypothetical estimates — can validate later, §13a).' : 'All prices validated → lock as PREPARED.') },
      ],
      async execute(itn) { itn.status = ItineraryStatus.PREPARED; itn._log('seller', 'locked → PREPARED'); } },
    // BROCHURE → BOOKING promotion. Only meaningful for a brochure (hidden on a BOOKING itinerary); gated on PREPARED.
    // Flipping the type unlocks the full lifecycle, suppliers/vouchers, payments and documents. Status stays PREPARED.
    { id: 'convertToItinerary', fn: 'itnyConvertToItinerary', category: 'itny', ruleId: 'R-LC-14', description: 'Create Itinerary',
      preconditions: 'A BROCHURE in PREPARED. Agency/Agent is required (Inquiry ID & itinerary name optional).', outcome: 'itineraryType → BOOKING with the Agency/Agent set; status → DRAFT; the full booking lifecycle, suppliers, payments & documents become available.',
      params: schema({ inquiryId: fStr('Inquiry ID (optional)', ''), itineraryName: fStr('Itinerary name (optional)', ''), agencyAgent: fStr('Agency / Agent', 'Agent A') }, ['agencyAgent']),
      checks: [
        { description: 'Is a brochure', check: (itn) => itn.isBrochure() ? ok('Is a brochure.') : no('Already a booking itinerary — nothing to create.') },
        { description: 'PREPARED', check: (itn) => itn.status === ItineraryStatus.PREPARED ? ok('Brochure is PREPARED.') : gated('Create once the brochure is PREPARED (now ' + itn.status + ').') },
        { description: 'Ready', check: () => ok('Create a full booking itinerary from the brochure (set the Agency/Agent) → unlocks suppliers, payments, vouchers & documents (R-LC-14).') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        const agent = (i.agencyAgent != null && String(i.agencyAgent).trim() !== '') ? String(i.agencyAgent).trim() : 'Agent A';   // required, defaults to Agent A
        itn.itineraryType = ItineraryType.BOOKING;
        itn.agencyAgent = agent;
        if (i.inquiryId != null && String(i.inquiryId).trim() !== '') itn.inquiryId = String(i.inquiryId).trim();
        if (i.itineraryName != null && String(i.itineraryName).trim() !== '') itn.title = String(i.itineraryName).trim();
        itn.status = ItineraryStatus.DRAFT;
        itn._log('seller', 'converted brochure → booking itinerary · Agency/Agent ' + agent + (itn.inquiryId ? ' · inquiry ' + itn.inquiryId : '') + ' → DRAFT (R-LC-14)');
      } },
    // DOCUMENT (no status change): generating the quote is decoupled from the → QUOTED transition (mark QUOTED manually).
    { id: 'quote', fn: 'itnyQuote', category: 'itny', ruleId: 'R-LC-03', description: 'Generate / re-issue Quote',
      preconditions: 'PREPARED or any later state (a quote needs a prepared itinerary). Does NOT change status — use → QUOTED to advance.', outcome: 'Adds an immutable quote snapshot to the itinerary (status unchanged).', params: NO_INPUT,
      checks: [
        { description: 'Past DRAFT', check: (itn) => itn.status !== ItineraryStatus.DRAFT ? ok('Itinerary is past DRAFT.') : no('Set status to PREPARED first.') },
        { description: 'Quotable state', check: (itn) => ['PREPARED', 'QUOTED', 'APPROVED', 'INVOICED', 'VOUCHERED', 'CONFIRMED'].includes(itn.status) ? ok('Generate the client quote document (status unchanged — mark → QUOTED manually).') : no('Cannot quote from ' + itn.status + '.') },
      ],
      async execute(itn) {
        const q = itn._snapshotDoc('QUOTE', 'Q' + itn._nextId()); itn.quotes.push(q);   // snapshot of the itinerary, added to the itinerary
        itn._log('seller', 'generated quote ' + q.id + ' ($' + q.total + ') — status unchanged');
      } },
    { id: 'accept', fn: 'itnyAccept', category: 'itny', ruleId: 'R-LC-04', description: '→ APPROVED',
      preconditions: 'An open quote (QUOTED).', outcome: 'Status → APPROVED (soft commercial confirmation). Payment status is untouched.', params: NO_INPUT,
      checks: [{ description: 'Quote open (QUOTED)', check: (itn) => itn.status === ItineraryStatus.QUOTED ? ok('Open quote awaiting client.') : no('No open quote (status ' + itn.status + ').') }],
      async execute(itn) {
        itn.status = ItineraryStatus.APPROVED;
        itn.recompute();                                              // crossing into APPROVED re-derives payment (NEW → NEEDS_PAYMENT if unpaid)
        itn._log('client', 'accepted quote → APPROVED');
      } },
    // DOCUMENT (no status change): generating the invoice is decoupled from the → INVOICED transition (mark INVOICED manually).
    { id: 'invoice', fn: 'itnyInvoice', category: 'itny', ruleId: 'R-LC-06', description: 'Generate / re-issue Invoice',
      preconditions: 'APPROVED or any later state (not finance-locked). Does NOT change status or request a deposit — use → INVOICED to advance.', outcome: 'Adds an immutable invoice snapshot to the itinerary (status & payment unchanged).', params: NO_INPUT,
      checks: [
        { description: 'Invoiceable state', check: (itn) => {
          if (['INVOICED', 'VOUCHERED', 'CONFIRMED'].includes(itn.status))
            return itn.financeLocked ? gated('Finance-locked — cannot regenerate invoice (R-FN-01).') : ok('Re-generate the invoice document (status unchanged; logged — R-LC-15).');
          if (itn.status === ItineraryStatus.APPROVED) return ok('Generate the client invoice document (status unchanged — mark → INVOICED manually).');
          if (itn.status === ItineraryStatus.QUOTED) return no('Client must accept the quote first.');
          return no('Needs APPROVED (now ' + itn.status + ').');
        } },
      ],
      async execute(itn) {
        if (itn.firstInvoiceDate == null) { itn.firstInvoiceDate = itn.currentDate; itn.recompute(); }   // first invoice freezes the deposit-due base at firstInvoiceDate + 7 — BEFORE the snapshot so it captures the deposit due
        const inv = itn._snapshotDoc('INVOICE', 'INV' + itn._nextId()); itn.invoices.push(inv);   // snapshot of the itinerary, added to the itinerary
        itn._log('seller', 'generated invoice ' + inv.id + ' ($' + inv.total + ', deposit $' + inv.deposit + ') — status unchanged');
      } },
    { id: 'pay', fn: 'itnyPay', category: 'itny', ruleId: 'R-MN-05', description: 'Record client payment',
      preconditions: 'An invoice exists (INVOICED+ or a generated invoice) and a balance is still outstanding.', outcome: 'Records a payment; deposit/milestone flags + payment status re-derive vs total.',
      // default the suggested amount: the next unpaid milestone for the first payment, otherwise the outstanding balance.
      params: (itn) => { const nm = itn.nextMilestone(); return schema({ amount: fNum('Client pays (any amount)', itn.paid() === 0 && nm ? nm.amt : Math.max(0, itn.due())) }, ['amount']); },
      checks: [
        { description: 'Finance only', check: (itn) => finOnly(itn) },
        { description: 'Not terminated', check: (itn) => [ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED, ItineraryStatus.CANCELLED].includes(itn.status) ? no('No payments on a ' + itn.status + ' itinerary (refunds are scheduled as REFUND_TO_CLIENT milestones on cancellation).') : ok('Itinerary is live.') },
        { description: 'Invoice exists', check: (itn) => (itn.invoices.length > 0 || ['INVOICED', 'VOUCHERED', 'CONFIRMED'].includes(itn.status)) ? ok('An invoice exists.') : no('No invoice yet — nothing to pay (generate an invoice / mark → INVOICED first).') },
        { description: 'Balance due', check: (itn) => itn.due() > 0 ? ok('Balance $' + itn.due() + ' outstanding.') : no('Already settled (paid ≥ total).') },
        { description: 'Ready', check: (itn) => ok('Balance $' + itn.due() + ' outstanding — pay any amount.') },
      ],
      async execute(itn, u, input) {
        const a = Number(input && input.amount != null ? input.amount : (itn.nextMilestone() ? itn.nextMilestone().amt : itn.due()));
        if (!a || a <= 0) return no('Payment amount must be a positive number.');
        itn.payments.push({ amount: a, type: a >= itn.due() ? 'FINAL' : (itn.paid() === 0 ? 'DEPOSIT' : 'PARTIAL'), t: itn._clk() });
        itn.recompute(); itn._log('client', 'paid $' + a + ' → ' + itn.paymentStatus);
      } },
    // Record a client refund — money OUT back to the client (distinct from a cancellation's automatic settlement).
    // FIN-only: posts a negative REFUND payment row + a settled REFUND_TO_CLIENT milestone (audit trail), then the
    // payment status re-derives vs total. Capped at money actually collected; ALSO allowed on a TERMINATED itinerary
    // (LOST/SUPERSEDED/CANCELLED) — money collected can still be handed back after the booking is dead.
    { id: 'refund', fn: 'itnyRefund', category: 'itny', ruleId: 'R-MN-08', description: 'Record client refund',
      preconditions: 'Client money collected; only a Finance (FIN) user. Allowed even once the itinerary is terminated.', outcome: 'Refunds client money: a negative REFUND payment row + a settled REFUND_TO_CLIENT milestone; payment status re-derives.',
      params: (itn) => schema({ amount: fNum('Refund to client ($)', Math.max(0, round(itn.paid()))) }, ['amount']),
      checks: [
        { description: 'Finance only', check: (itn) => finOnly(itn) },
        { description: 'Money to refund', check: (itn) => itn.paid() > 0 ? ok('$' + round(itn.paid()) + ' collected — refundable.') : no('Nothing collected yet — nothing to refund.') },
        { description: 'Ready', check: (itn) => ok('Refund client money (≤ $' + round(itn.paid()) + ' collected).') },
      ],
      async execute(itn, u, input) {
        const a = Number(input && input.amount);
        if (!a || a <= 0) return no('Refund amount must be a positive number.');
        if (a > itn.paid() + 0.001) return no('Cannot refund more than the $' + round(itn.paid()) + ' collected.');
        itn.payments.push({ amount: -round(a), type: 'REFUND', t: itn._clk() });
        itn._scheduleRefund(round(a), 'manual client refund (R-MN-08)');
        itn.recompute(); itn._log('finance', 'refunded $' + round(a) + ' → client (R-MN-08)');
      } },
    // Credit note — moving money between itineraries (simulated: the other itinerary isn't modelled). ADD pulls money
    // IN from another itinerary's id; TRANSFER pushes money OUT to another. Recorded as a CREDIT_NOTE payment row.
    { id: 'creditNoteAdd', fn: 'itnyCreditNoteAdd', category: 'itny', ruleId: 'R-FN-03', description: 'Credit Note - Add',
      preconditions: 'Unavailable once the itinerary is terminated (LOST/SUPERSEDED/CANCELLED). Simulated: the source itinerary can spare up to $2000.', outcome: 'Records a credit note received from another itinerary (money in).',
      params: schema({ from: fStr('From itinerary id', ''), amount: fNum('Amount', 0) }, ['from', 'amount']),
      checks: [
        { description: 'Finance only', check: (itn) => finOnly(itn) },
        { description: 'Not terminated', check: (itn) => [ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED, ItineraryStatus.CANCELLED].includes(itn.status) ? no('No credit notes on a ' + itn.status + ' itinerary.') : ok('Itinerary is live.') },
        { description: 'Source has funds', check: (itn, u, input) => { const amt = input && input.amount; return (amt != null && amt > 2000) ? no('Insufficient fund in the itinerary from.') : ok('Source itinerary can spare the amount.'); } },
        { description: 'Ready', check: () => ok('Record a credit note received from another itinerary (money in).') },
      ],
      async execute(itn, u, input) {
        const amt = Number(input && input.amount) || 0;
        if (amt > 2000) return no('Insufficient fund in the itinerary from.');
        if (amt <= 0) return no('Amount must be a positive number.');
        itn.payments.push({ amount: amt, type: 'CREDIT_NOTE', from: (input && input.from) || '', t: itn._clk() });
        itn.recompute(); itn._log('seller', 'credit note +$' + amt + ' from itinerary ' + ((input && input.from) || '?') + ' (R-FN-03)');
      } },
    { id: 'creditNoteTransfer', fn: 'itnyCreditNoteTransfer', category: 'itny', ruleId: 'R-FN-03', description: 'Credit Note - Transfer',
      preconditions: 'Always available.', outcome: 'Transfers a credit note to another itinerary (money out).',
      params: schema({ to: fStr('To itinerary id', ''), amount: fNum('Amount', 0) }, ['to', 'amount']),
      checks: [
        { description: 'Finance only', check: (itn) => finOnly(itn) },
        { description: 'Available', check: () => ok('Transfer a credit note to another itinerary (money out).') },
      ],
      async execute(itn, u, input) {
        const amt = Number(input && input.amount) || 0;
        if (amt <= 0) return no('Amount must be a positive number.');
        itn.payments.push({ amount: -amt, type: 'CREDIT_NOTE', to: (input && input.to) || '', t: itn._clk() });
        itn.recompute(); itn._log('seller', 'credit note -$' + amt + ' to itinerary ' + ((input && input.to) || '?') + ' (R-FN-03)');
      } },
    // ---- deposit / payment milestones (rendered in the Payments & allocations card, not the itinerary-actions list) ----
    // Edit the deposit: skip it, or override its amount/due. Unavailable once the deposit is paid (frozen). Staged in
    // the open change when one is open (or auto-opens), so a Cancel reverts it.
    { id: 'depositEdit', fn: 'itnyDepositEdit', category: 'itny', ruleId: 'R-MN-06', description: 'Edit deposit',
      preconditions: 'The deposit is not yet paid (a paid deposit is frozen). A live, non-brochure itinerary.', outcome: 'Sets the deposit skip / manual amount / manual due (system figure resumes when cleared).',
      params: (itn) => schema({
        skip: { type: 'boolean', title: 'Skip deposit (drop from the schedule)', default: !!itn.deposit.skip },
        manualAmt: fNum('Manual deposit amount (0 / blank = system figure)', itn.deposit.manualAmt != null ? itn.deposit.manualAmt : 0),
        manualDue: fDate('Manual due date (blank = system due)', itn.deposit.manualDue != null ? isoForDay(itn.deposit.manualDue) : ''),
      }),
      checks: [
        { description: 'Live booking', check: (itn) => itn.isBrochure() ? no('Brochures carry no payments.') : ([ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED, ItineraryStatus.CANCELLED].includes(itn.status) ? no('No deposit on a ' + itn.status + ' itinerary.') : ok('Itinerary is live.')) },
        { description: 'Deposit not paid', check: (itn) => itn.deposit.paid ? no('Deposit already paid — it is frozen.') : ok('Deposit not yet paid.') },
        { description: 'Ready', check: () => ok('Set the deposit skip / manual amount / manual due.') },
      ],
      async execute(itn, u, input) {
        itn._ensureChange();
        itn.deposit.skip = !!(input && input.skip);
        const ma = input && Number(input.manualAmt); itn.deposit.manualAmt = (ma && ma > 0) ? round(ma) : null;
        const md = (input && input.manualDue !== '' && input.manualDue != null) ? dayNum(input.manualDue) : null; itn.deposit.manualDue = md;
        itn.recompute();
        itn._log('seller', 'edited deposit → ' + (itn.deposit.skip ? 'skipped' : '$' + itn.depositAmt() + (itn.depositDue() != null ? ' due ' + dayLabel(itn.depositDue()) : '')) + (itn.depositCustom() ? ' (manual)' : ' (system)'));
      } },
    // Add a custom milestone — a dated slice carved out of the outstanding balance. Always custom:true; the due must
    // be after today AND after the last paid milestone; the amount (or % of total) cannot exceed the outstanding residual.
    { id: 'milestoneAdd', fn: 'itnyMilestoneAdd', category: 'itny', ruleId: 'R-MN-07', description: 'Add milestone',
      preconditions: 'A live booking with an outstanding balance. Due after today & after the last paid milestone; amount ≤ outstanding.', outcome: 'Adds a custom payment milestone (tracked in the open change, if any).',
      params: (itn) => schema({
        type: fEnum([MilestoneType.RECEIVE_FROM_CLIENT, MilestoneType.REFUND_TO_CLIENT], 'Direction', MilestoneType.RECEIVE_FROM_CLIENT),
        amt: fNum('Amount (0 = use % of total)', 0),
        prcOfTotal: fNum('% of total (used when amount is 0)', 0),
        due: fDate('Due date', isoForDay((itn._lastPaidDue() != null ? Math.max(itn._lastPaidDue(), itn.currentDate) : itn.currentDate) + 1)),
        comment: fStr('Comment', ''),
      }, ['due']),
      checks: [
        { description: 'Live booking', check: (itn) => itn.isBrochure() ? no('Brochures carry no payments.') : ([ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED, ItineraryStatus.CANCELLED].includes(itn.status) ? no('No milestones on a ' + itn.status + ' itinerary.') : ok('Itinerary is live.')) },
        { description: 'Has a balance', check: (itn) => itn.due() > 0 ? ok('Outstanding $' + itn.due() + '.') : no('Nothing outstanding to schedule.') },
        { description: 'Due after today', check: (itn, u, input) => { const d = input && input.due != null && input.due !== '' ? dayNum(input.due) : null; return (d != null && d <= itn.currentDate) ? no('Due must be after today (' + dayLabel(itn.currentDate) + ').') : ok('Due is in the future.'); } },
        { description: 'Due after last paid', check: (itn, u, input) => { const lp = itn._lastPaidDue(); const d = input && input.due != null && input.due !== '' ? dayNum(input.due) : null; return (lp != null && d != null && d <= lp) ? no('Due must be after the last paid milestone (' + dayLabel(lp) + ').') : ok('Due is after the last paid milestone.'); } },
        { description: 'Within outstanding', check: (itn, u, input) => { const t = itn.total(); const amt = (input && Number(input.amt)) > 0 ? Number(input.amt) : round((input && Number(input.prcOfTotal) || 0) / 100 * t); return (amt > 0 && amt > Math.max(0, itn.due())) ? no('Amount $' + amt + ' exceeds the outstanding $' + itn.due() + '.') : ok('Amount fits within the outstanding balance.'); } },
        { description: 'Ready', check: () => ok('Add a custom payment milestone.') },
      ],
      async execute(itn, u, input) {
        const t = itn.total();
        const prc = input && Number(input.prcOfTotal) || 0;
        const amt = (input && Number(input.amt)) > 0 ? round(Number(input.amt)) : round(prc / 100 * t);
        if (!amt || amt <= 0) return no('Milestone amount must be a positive number.');
        const due = input && input.due != null && input.due !== '' ? dayNum(input.due) : itn.currentDate + 1;
        itn._ensureChange();
        itn.paymentMilestones.push({ id: 'M' + itn._nextId(), type: (input && input.type) || MilestoneType.RECEIVE_FROM_CLIENT, amt, prcOfTotal: prc > 0 ? prc : null, due, custom: true, paid: false, comment: (input && input.comment) || '' });
        itn.recompute();
        itn._log('seller', 'added milestone $' + amt + ' due ' + dayLabel(due) + (itn.inChange() ? ' (staged)' : ''));
      } },
    // Edit a custom, unpaid milestone (by id).
    { id: 'milestoneEdit', fn: 'itnyMilestoneEdit', category: 'itny', ruleId: 'R-MN-07', description: 'Edit milestone',
      preconditions: 'A custom milestone that is not yet paid. Same due/amount rules as Add.', outcome: 'Updates the custom milestone (tracked in the open change, if any).',
      params: (itn) => schema({
        id: fStr('Milestone id', ''),
        type: fEnum([MilestoneType.RECEIVE_FROM_CLIENT, MilestoneType.REFUND_TO_CLIENT], 'Direction', MilestoneType.RECEIVE_FROM_CLIENT),
        amt: fNum('Amount', 0),
        prcOfTotal: fNum('% of total (used when amount is 0)', 0),
        due: fDate('Due date', isoForDay(itn.currentDate + 1)),
        comment: fStr('Comment', ''),
      }, ['id']),
      checks: [
        { description: 'Custom & unpaid', check: (itn, u, input) => { const m = input && itn._milestoneById(input.id); return !m ? no('Milestone not found.') : (m.custom === false ? no('System milestone — not editable.') : (m.paid ? no('Milestone already paid — frozen.') : ok('Custom, unpaid milestone.'))); } },
        { description: 'Due after today', check: (itn, u, input) => { const d = input && input.due != null && input.due !== '' ? dayNum(input.due) : null; return (d != null && d <= itn.currentDate) ? no('Due must be after today (' + dayLabel(itn.currentDate) + ').') : ok('Due is in the future.'); } },
        { description: 'Ready', check: () => ok('Update the custom milestone.') },
      ],
      async execute(itn, u, input) {
        const m = input && itn._milestoneById(input.id); if (!m) return no('Milestone not found.');
        if (m.custom === false || m.paid) return no('Milestone is not editable.');
        itn._ensureChange();
        const m2 = itn._milestoneById(input.id);                    // re-resolve after a possible auto-open (paymentMilestones is unchanged on open)
        const t = itn.total(); const prc = Number(input.prcOfTotal) || 0;
        if (input.type) m2.type = input.type;
        if (Number(input.amt) > 0) { m2.amt = round(Number(input.amt)); m2.prcOfTotal = null; }
        else if (prc > 0) { m2.amt = round(prc / 100 * t); m2.prcOfTotal = prc; }
        if (input.due != null && input.due !== '') m2.due = dayNum(input.due);
        if (input.comment != null) m2.comment = input.comment;
        itn.recompute();
        itn._log('seller', 'edited milestone ' + m2.id + ' → $' + m2.amt + ' due ' + dayLabel(m2.due) + (itn.inChange() ? ' (staged)' : ''));
      } },
    // Remove a custom, unpaid milestone (by id).
    { id: 'milestoneRemove', fn: 'itnyMilestoneRemove', category: 'itny', ruleId: 'R-MN-07', description: 'Remove milestone',
      preconditions: 'A custom milestone that is not yet paid.', outcome: 'Removes the custom milestone (tracked in the open change, if any).',
      params: schema({ id: fStr('Milestone id', '') }, ['id']),
      checks: [
        { description: 'Custom & unpaid', check: (itn, u, input) => { const m = input && itn._milestoneById(input.id); return !m ? no('Milestone not found.') : (m.custom === false ? no('System milestone — not removable.') : (m.paid ? no('Milestone already paid — frozen.') : ok('Custom, unpaid milestone.'))); } },
        { description: 'Ready', check: () => ok('Remove the custom milestone.') },
      ],
      async execute(itn, u, input) {
        const m = input && itn._milestoneById(input.id); if (!m) return no('Milestone not found.');
        if (m.custom === false || m.paid) return no('Milestone is not removable.');
        itn._ensureChange();
        itn.paymentMilestones = itn.paymentMilestones.filter((x) => x.id !== input.id);
        itn.recompute();
        itn._log('seller', 'removed milestone ' + input.id + (itn.inChange() ? ' (staged)' : ''));
      } },
    { id: 'revert', fn: 'itnyRevert', category: 'itny', ruleId: 'R-LC-09', description: '→ DRAFT',
      preconditions: 'Any pre-VOUCHERED state (PREPARED/QUOTED/APPROVED/INVOICED) with no open change; allowed even once paid.', outcome: 'Status → DRAFT (voids the quote/invoice; any payment is kept as client credit). Reason is audited.',
      params: schema({ reason: fStr('Reason', 'Client requested to add new PAX Adult - John Smith') }),
      checks: [
        { description: 'Not in DRAFT', check: (itn) => itn.status !== ItineraryStatus.DRAFT ? ok('Not already in DRAFT.') : no('Already in DRAFT.') },
        { description: 'No open change', check: (itn) => itn.inChange() ? gated('Resolve the open change first (Apply or Cancel).') : ok('No open change.') },
        { description: 'Pre-VOUCHERED', check: (itn) => ['PREPARED', 'QUOTED', 'APPROVED', 'INVOICED'].includes(itn.status) ? ok('Pre-VOUCHERED.') : no('At/after VOUCHERED — vouchers are out to suppliers; edit via Pending Changes (R-LC-09c).') },
        { description: 'Ready', check: (itn) => ok('Revert to DRAFT (voids the quote/invoice' + (itn.hasPaid() ? '; payment kept as client credit' : '') + ', R-LC-09). Allowed until vouchered.') },
      ],
      async execute(itn, u, input) {
        const w = itn.status; itn.status = ItineraryStatus.DRAFT;
        const reason = (input && input.reason) || '';
        itn.recompute();                                              // payment status re-derives (unpaid+no vouchers → NEW; paid → kept as credit)
        itn._log('seller', 'reverted ' + w + ' → DRAFT (' + (itn.hasPaid() ? 'payment kept as client credit' : (w === ItineraryStatus.INVOICED ? 'invoice & deposit request voided' : 'quote voided')) + ', R-LC-09)' + (reason ? ' — ' + reason : ''));
      } },
    // → VOUCHERED raises the supplier requests itself (the former "Send vouchers"): every non-auto line goes out
    // (→ AwaitingSupplier), auto types auto-confirm (→ Booked), and the itinerary flips INVOICED → VOUCHERED.
    { id: 'voucher', fn: 'itnySendVouchers', category: 'itny', ruleId: 'R-LC-07', description: '→ VOUCHERED',
      preconditions: 'INVOICED and payment collected OR credit terms set. Raises supplier requests, landing every item Booked (auto) or AwaitingSupplier.', outcome: 'Status → VOUCHERED; raises a request on each non-auto line (auto types auto-confirm).', params: NO_INPUT,
      checks: [
        { description: 'From INVOICED', check: (itn) => itn.status === ItineraryStatus.INVOICED ? ok('Is INVOICED.') : (itn.status === ItineraryStatus.APPROVED ? no('Generate the invoice & mark → INVOICED first.') : no('Needs INVOICED (now ' + itn.status + ').')) },
        { description: 'Payment cleared', check: (itn) => (itn.hasPaid() || itn.creditTerms) ? ok('Payment collected or credit terms set.') : gated('Voucher blocked: collect payment or set credit terms first (R-LC-07).') },
        { description: 'Holds not expired', check: (itn) => { const it = itn.expiredHoldItem(); return it ? gated('A relied-on supplier hold has expired (' + it.name + ') — re-hold or re-price that line before vouchering.') : ok('No line is relying on an expired hold.'); } },
        { description: 'Ready', check: (itn) => ok('Payment cleared' + (itn.creditTerms && !itn.hasPaid() ? ' (credit terms)' : '') + ' → raise supplier requests & advance to VOUCHERED.') },
      ],
      async execute(itn) { itn._sendVouchers(false); } },
    { id: 'confirm', fn: 'itnyConfirm', category: 'itny', ruleId: 'R-LC-08', description: '→ CONFIRMED',
      preconditions: 'VOUCHERED, no open change, all billable lines CONFIRMED.', outcome: 'Status → CONFIRMED (hard operational confirmation).', params: NO_INPUT,
      checks: [
        { description: 'From VOUCHERED', check: (itn) => itn.status === ItineraryStatus.VOUCHERED ? ok('Is VOUCHERED.') : no('Vouchers must be sent first (now ' + itn.status + ').') },
        { description: 'No open change', check: (itn) => itn.inChange() ? gated('Resolve the pending change before confirming.') : ok('No open change.') },
        { description: 'All confirmed', check: (itn) => itn.allConfirmed() ? ok('All lines confirmed by suppliers.') : gated(itn.unconfCount() + ' line(s) not yet confirmed by suppliers.') },
        { description: 'Ready', check: () => ok('All confirmed (comments reviewed) → confirm itinerary.') },
      ],
      async execute(itn) { itn.status = ItineraryStatus.CONFIRMED; itn._log('seller', 'confirmed itinerary → CONFIRMED'); } },
    // → QUOTED — manual status advance, gated on a generated quote that matches the current itinerary (the doc fp
    // equals the live snapshot fp, i.e. its projection `matchesCurrent`). Generate the quote document first.
    { id: 'toQuoted', fn: 'itnyToQuoted', category: 'itny', ruleId: 'R-LC-03', description: '→ QUOTED',
      preconditions: 'PREPARED with at least one matching quote generated (a quote whose figures match the current itinerary).', outcome: 'Status → QUOTED.', params: NO_INPUT,
      checks: [
        { description: 'From PREPARED', check: (itn) => itn.status === ItineraryStatus.PREPARED ? ok('Is PREPARED.') : no('→ QUOTED only from PREPARED (now ' + itn.status + ').') },
        { description: 'Matching quote', check: (itn) => { const fp = itn.unresolvedRejection() ? null : itn._snapshotFp(); return itn.quotes.some((q) => q.fp === fp) ? ok('A matching quote exists.') : gated('Generate a matching quote first (Documents → Generate Quote).'); } },
        { description: 'Ready', check: () => ok('A matching quote exists → mark the itinerary QUOTED.') },
      ],
      async execute(itn) { itn.status = ItineraryStatus.QUOTED; itn._log('seller', 'marked → QUOTED (matching quote exists)'); } },
    // → INVOICED — manual status advance, gated on a matching invoice. Payment status stays DERIVED (no pin); the
    // deposit becomes the first scheduled milestone the client owes.
    { id: 'toInvoiced', fn: 'itnyToInvoiced', category: 'itny', ruleId: 'R-LC-06', description: '→ INVOICED',
      preconditions: 'APPROVED with at least one matching invoice generated (an invoice whose figures match the current itinerary).', outcome: 'Status → INVOICED; the deposit becomes the first payment milestone (payment status re-derives).', params: NO_INPUT,
      checks: [
        { description: 'From APPROVED', check: (itn) => itn.status === ItineraryStatus.APPROVED ? ok('Is APPROVED.') : no('→ INVOICED only from APPROVED (now ' + itn.status + ').') },
        { description: 'Matching invoice', check: (itn) => { const fp = itn.unresolvedRejection() ? null : itn._snapshotFp(); return itn.invoices.some((iv) => iv.fp === fp) ? ok('A matching invoice exists.') : gated('Generate a matching invoice first (Documents → Generate Invoice).'); } },
        { description: 'Ready', check: () => ok('A matching invoice exists → mark the itinerary INVOICED (deposit becomes due).') },
      ],
      async execute(itn) {
        itn.status = ItineraryStatus.INVOICED; itn.recompute();
        itn._log('seller', 'marked → INVOICED → deposit $' + itn.depositAmt() + ' due (' + itn.paymentStatus + ')');
      } },

    /* ---- itinerary: terminal & flags ---- */
    { id: 'lost', fn: 'itnyMarkLost', category: 'itny', ruleId: 'R-LC-11', description: '→ LOST',
      preconditions: 'DRAFT/PREPARED/QUOTED/APPROVED/INVOICED with no open change.', outcome: 'Status → LOST (reason required & audited).',
      params: schema({ reason: fStr('LOST reason (required)', 'Agent radio silence') }, ['reason']),
      checks: [
        { description: 'Eligible status', check: (itn) => ['DRAFT', 'PREPARED', 'QUOTED', 'APPROVED', 'INVOICED'].includes(itn.status) ? ok('Pre-VOUCHERED.') : no('LOST only from DRAFT/PREPARED/QUOTED/APPROVED/INVOICED.') },
        { description: 'No open change', check: (itn) => itn.inChange() ? gated('Resolve the open change first (Apply or Cancel), then mark LOST (R-LC-11).') : ok('No open change.') },
        { description: 'Ready', check: () => ok('Agent rejected / radio silence → LOST (reason required, R-LC-11).') },
      ],
      async execute(itn, u, input) {
        const r = (input && input.reason) || 'Agent radio silence'; if (!r) return;
        itn.lostReason = r; itn.status = ItineraryStatus.LOST; itn._log('seller', '→ LOST: ' + r + ' (R-LC-11)');
      } },
    { id: 'superseded', fn: 'itnyMarkSuperseded', category: 'itny', ruleId: 'R-LC-12', description: '→ SUPERSEDED',
      preconditions: 'Any step before CONFIRMED, with no line yet AWAITING/CONFIRMED by a supplier.', outcome: 'Status → SUPERSEDED (another option in the inquiry won).', params: NO_INPUT,
      checks: [
        { description: 'Before confirmation', check: (itn) => [ItineraryStatus.CONFIRMED, ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED, ItineraryStatus.CANCELLED].includes(itn.status) ? no('SUPERSEDED only before operational confirmation (now ' + itn.status + ').') : ok('Before operational confirmation.') },
        { description: 'No supplier lines', check: (itn) => itn.units().some((u) => u.requested || u.confirmed) ? no('A line is already out to / confirmed by a supplier — cannot mark SUPERSEDED (R-LC-12).') : ok('No line out to / confirmed by a supplier.') },
        { description: 'Ready', check: () => ok('Another option in the inquiry won → SUPERSEDED (R-LC-12).') },
      ],
      async execute(itn) { itn.status = ItineraryStatus.SUPERSEDED; itn._log('seller', '→ SUPERSEDED (another option chosen, R-LC-12)'); } },
    { id: 'reopen', fn: 'itnyReopen', category: 'itny', ruleId: 'R-LC-13', description: 'Reopen to DRAFT',
      preconditions: 'A LOST or SUPERSEDED itinerary (exception path).', outcome: 'Status → DRAFT for editing (audited).', params: NO_INPUT,
      checks: [
        { description: 'From LOST / SUPERSEDED', check: (itn) => [ItineraryStatus.LOST, ItineraryStatus.SUPERSEDED].includes(itn.status)
          ? ok('Exception reopen → back to DRAFT for editing (audited, R-LC-13).')
          : no('Reopen only from LOST / SUPERSEDED (now ' + itn.status + ').') },
      ],
      async execute(itn) {
        const w = itn.status;
        itn.status = ItineraryStatus.DRAFT; itn.lostReason = null;
        itn.recompute();                                              // payment status re-derives off the now-live DRAFT
        itn._log('seller', 'reopened ' + w + ' → DRAFT (exception, audited, R-LC-13)');
      } },
    { id: 'cancelItn', fn: 'itnyCancel', category: 'itny', ruleId: 'R-CN-09', description: '→ CANCELLED',
      preconditions: 'VOUCHERED or CONFIRMED (an in-progress change is discarded first).', outcome: 'Opens a reversible CANCELLATION change staging CANCEL on every item.', params: NO_INPUT,
      checks: [
        { description: 'Eligible status', check: (itn) => [ItineraryStatus.VOUCHERED, ItineraryStatus.CONFIRMED].includes(itn.status) ? ok('Is VOUCHERED/CONFIRMED.') : no('Only a VOUCHERED or CONFIRMED itinerary can be cancelled.') },
        { description: 'Not already cancelling', check: (itn) => itn.isCancelling() ? no('Cancellation already in progress.') : ok('No cancellation in progress.') },
        { description: 'Ready', check: (itn) => ok(itn.inChange() ? 'Cancel booking — discards the in-progress change (R-CH-25) → fees + refund/credit.' : 'Cancel confirmed booking → fees + refund/credit note (R-CN-09).') },
      ],
      async execute(itn) {
        if (itn.inChange()) itn._revertChange('seller', 'discarded in-progress change for cancellation (R-CH-25)');
        itn._openChange(ChangeTrigger.CANCELLATION);
        itn.billableUnits().forEach((u) => {
          itn._beginEdit(u, PendingOp.CANCEL);
          const fee = u.confirmed != null ? round(u.sellPrice * Constants.CANCEL_FEE_PCT) : 0;
          u.cancelIntent = { fee, refund: u.sellPrice - fee };
        });
        itn._log('seller', 'cancellation started → all items staged CANCEL. Apply to confirm, or Cancel the change to abort (R-CN-09)');
      } },
    { id: 'toggleCredit', fn: 'itnyToggleCreditTerms', category: 'itny', ruleId: 'R-FN-02', description: 'Toggle credit terms',
      preconditions: 'Always.', outcome: 'Flips agency credit terms (lets vouchers go before payment).', params: NO_INPUT,
      checks: [
        { description: 'Available', check: (itn) => ok((itn.creditTerms ? 'Disable' : 'Enable') + ' agency credit terms (R-FN-02).') },
      ],
      async execute(itn) { itn.creditTerms = !itn.creditTerms; itn._log('seller', 'credit terms ' + (itn.creditTerms ? 'ON' : 'OFF') + ' (R-FN-02)'); } },
    { id: 'toggleLock', fn: 'itnyToggleFinanceLock', category: 'itny', ruleId: 'R-FN-01', description: 'Toggle finance lock',
      preconditions: 'VOUCHERED or CONFIRMED.', outcome: 'Flips the finance lock (blocks total-changing changes & invoice regen).', params: NO_INPUT,
      checks: [
        { description: 'Finance only', check: (itn) => finOnly(itn) },
        { description: 'VOUCHERED+', check: (itn) => [ItineraryStatus.VOUCHERED, ItineraryStatus.CONFIRMED].includes(itn.status) ? ok((itn.financeLocked ? 'Unlock' : 'Lock') + ' finance (blocks total changes, R-FN-01).') : no('Finance lock applies once VOUCHERED.') },
      ],
      async execute(itn) { itn.financeLocked = !itn.financeLocked; itn._log('finance', 'finance lock ' + (itn.financeLocked ? 'ON' : 'OFF') + ' (R-FN-01)'); } },
    // COPY AS BROCHURE — derive a reusable BROCHURE from a BOOKING. Copies only NEW & CONFIRMED items and only their
    // commercial data + system price; promotions, manual pricing, locks, the supplier lifecycle, payments, vouchers
    // & documents are dropped. Replaces the current state with the brochure copy (single-aggregate simulator).
    { id: 'copyAsBrochure', fn: 'itnyCopyAsBrochure', category: 'itny', ruleId: 'R-LC-15', description: 'Copy as Brochure',
      preconditions: 'A BOOKING itinerary with at least one NEW or CONFIRMED item.', outcome: 'Replaces the current state with a BROCHURE (DRAFT) copy — only NEW & CONFIRMED items, only commercial data + system prices. Promotions, manual pricing, locks, the supplier lifecycle, payments, vouchers & documents are dropped.',
      params: NO_INPUT,
      checks: [
        { description: 'Is a booking', check: (itn) => itn.isBrochure() ? no('Already a brochure — nothing to copy as a brochure.') : ok('A booking can be copied to a reusable brochure.') },
        { description: 'Has copyable items', check: (itn) => itn.units().some((u) => u.isBillable() && (u.status === ServiceStatus.NEW || u.status === ServiceStatus.CONFIRMED)) ? ok('Copies the NEW & CONFIRMED items (commercial data + system price).') : no('No NEW or CONFIRMED items to copy.') },
      ],
      async execute(itn) { itn._copyAsBrochure(); } },
    { id: 'generateFCA', fn: 'itnyGenerateFCA', category: 'itny', ruleId: 'R-OPS-02', description: 'Generate / re-issue FCA',
      preconditions: 'An Ops (OPS) user, CONFIRMED and every billable line is OPS_READY (cancelled lines ignored); re-issues a fresh snapshot once generated.', outcome: 'Issues a Final Confirmation Advice document (immutable snapshot; sets fcaGenerated).', params: NO_INPUT,
      checks: [
        { description: 'Ops only', check: (itn) => opsOnly(itn) },
        { description: 'From CONFIRMED', check: (itn) => itn.status === ItineraryStatus.CONFIRMED ? ok('Is CONFIRMED.') : no('FCA is generated once the itinerary is CONFIRMED (now ' + itn.status + ').') },
        { description: 'OPS-ready', check: (itn) => itn.fcaReady() ? ok('All billable lines OPS_READY.') : gated('Every service line must be OPS-confirmed (OPS_READY) first (R-OPS-02).') },
        { description: 'Ready', check: (itn) => ok(itn.fcaGenerated ? 'Re-issue the Final Confirmation Advice document (logged — R-LC-15).' : 'All lines OPS-confirmed → generate the Final Confirmation Advice (R-OPS-02).') },
      ],
      async execute(itn) {
        const reissue = itn.fcaGenerated;
        itn.fcaGenerated = true;
        const fca = itn._snapshotDoc('FCA', 'FCA' + itn._nextId()); itn.fcas.push(fca);   // snapshot of the itinerary, added to the itinerary
        itn._log('ops', (reissue ? 're-issued' : 'generated') + ' FCA ' + fca.id + ' (all lines OPS_READY, R-OPS-02)');
      } },

    /* ---- pending changes ---- */
    { id: 'cRevertDraft', fn: 'pendingChangesRevertToDraft', category: 'pendingChanges', ruleId: 'R-CH-23', description: '→ DRAFT',
      preconditions: 'A change past DRAFT (PREPARED/QUOTED/APPROVED/INVOICED), before Apply — including an itinerary cancellation.', outcome: 'Change status → DRAFT (re-open to edit; staged edits kept).', params: NO_INPUT,
      checks: [
        { description: 'Change open', check: (itn) => itn.inChange() ? ok('A change is open.') : no('No change open.') },
        { description: 'Past DRAFT', check: (itn) => !itn.inChange() ? null : (itn.changeSet.status !== 'DRAFT' ? ok('Change is past DRAFT.') : no('Change already DRAFT.')) },
        { description: 'Ready', check: (itn) => !itn.inChange() ? null : ok('Re-open the change to DRAFT to edit further (staged edits kept; needs re-quote, R-CH-23).') },
      ],
      async execute(itn) { itn.changeSet.status = 'DRAFT'; itn.pendingStatus = 'DRAFT'; itn._log('seller', 'change reverted to DRAFT (R-CH-23)'); } },
    { id: 'cPrepare', fn: 'pendingChangesPrepare', category: 'pendingChanges', ruleId: 'R-CH-05', description: '→ PREPARED',
      preconditions: 'A DRAFT change with ≥1 staged edit — including an itinerary cancellation (runs the same cycle, all items CANCEL).', outcome: 'Change status → PREPARED (ready to quote).', params: NO_INPUT,
      checks: [
        { description: 'Change open', check: (itn) => itn.inChange() ? ok('A change is open.') : no('No change open.') },
        { description: 'Not a draft change', check: (itn) => !itn.inChange() ? null : (itn.isDraftChange() ? no('Draft change (DRAFT itinerary) — Apply or Cancel only (R-CH-27).') : ok('Not a DRAFT-itinerary change.')) },
        { description: 'Change in DRAFT', check: (itn) => !itn.inChange() ? null : (itn.changeSet.status === 'DRAFT' ? ok('Change is in DRAFT.') : no('Change already ' + itn.changeSet.status + '.')) },
        { description: 'Has staged edit', check: (itn) => !itn.inChange() ? null : (itn.hasStagedEdits() ? ok('Has a staged edit.') : gated('Stage at least one edit first.')) },
        { description: 'Ready', check: (itn) => !itn.inChange() ? null : ok('Mark the staged change as PREPARED (ready to quote).') },
      ],
      async execute(itn) { itn.changeSet.status = 'PREPARED'; itn.pendingStatus = 'PREPARED'; itn._log('seller', 'change marked PREPARED'); } },
    { id: 'cQuote', fn: 'pendingChangesQuote', category: 'pendingChanges', ruleId: 'R-CH-06', description: '→ QUOTED',
      preconditions: 'PREPARED change with ≥1 staged edit.', outcome: 'Change status → QUOTED.', params: NO_INPUT,
      checks: [
        { description: 'Change open', check: (itn) => itn.inChange() ? ok('A change is open.') : no('No change open.') },
        { description: 'Marked PREPARED', check: (itn) => !itn.inChange() ? null : (itn.changeSet.status !== 'DRAFT' ? ok('Change marked PREPARED.') : no('Mark the change PREPARED first.')) },
        { description: 'Not yet quoted', check: (itn) => !itn.inChange() ? null : (itn.changeSet.status === 'PREPARED' ? ok('Change is PREPARED (not yet quoted).') : no('Change already quoted (' + itn.changeSet.status + ').')) },
        { description: 'Has staged edit', check: (itn) => !itn.inChange() ? null : (itn.hasStagedEdits() ? ok('Has a staged edit.') : gated('Stage at least one edit first.')) },
        { description: 'Ready', check: (itn) => !itn.inChange() ? null : ok('Quote the change (' + (itn.hasPaid() ? 'delta or full' : 'full re-quote — no payment yet') + ').') },
      ],
      async execute(itn) { itn.changeSet.status = 'QUOTED'; itn.pendingStatus = 'QUOTED'; itn._log('seller', 'change quote → pending QUOTED'); } },
    { id: 'cApprove', fn: 'pendingChangesApprove', category: 'pendingChanges', ruleId: 'R-CH-07', description: '→ APPROVED',
      preconditions: 'A QUOTED change.', outcome: 'Change status → APPROVED.', params: NO_INPUT,
      checks: [
        { description: 'QUOTED change', check: (itn) => (itn.inChange() && itn.changeSet.status === 'QUOTED') ? ok('Client decides on the change quote.') : no(itn.inChange() ? 'Change is ' + itn.changeSet.status + ', not QUOTED.' : 'No change open.') },
      ],
      async execute(itn) { itn.changeSet.status = 'APPROVED'; itn.pendingStatus = 'APPROVED'; itn._log('client', 'approved change'); } },
    { id: 'cInvoice', fn: 'pendingChangesInvoice', category: 'pendingChanges', ruleId: 'R-CH-09', description: '→ INVOICED',
      preconditions: 'An APPROVED change.', outcome: 'Change status → INVOICED; the extra owed surfaces as an outstanding balance (payment status re-derives).', params: NO_INPUT,
      checks: [
        { description: 'APPROVED change', check: (itn) => (itn.inChange() && itn.changeSet.status === 'APPROVED') ? ok('Approved → amendment invoice (extra owed becomes outstanding).') : no(itn.inChange() ? 'Change must be APPROVED (now ' + itn.changeSet.status + ').' : 'No change open.') },
      ],
      async execute(itn) { itn.changeSet.status = 'INVOICED'; itn.pendingStatus = 'INVOICED'; itn.recompute(); itn._log('seller', 'amendment invoice → extra owed outstanding (' + itn.paymentStatus + ')'); } },
    { id: 'cApply', fn: 'pendingChangesApply', category: 'pendingChanges', ruleId: 'R-CH-11', description: 'Apply change',
      preconditions: 'Staged edits; no unresolved supplier rejection.', outcome: 'Commits the change to baseline. A PostBookingModif generates supplier vouchers first (with confirmation) when needed; a PreBookingModif raises NONE (its requests wait for the itinerary Send Vouchers). Cancellations finalise here.',
      // Dynamic params: only prompt when there is actually something to confirm — a PostBookingModif that raises
      // vouchers (confirmVouchers) or a cancellation (issueCreditNote). A PreBookingModif raises no vouchers, so it
      // needs no input and Apply runs straight through (no modal).
      params: (itn) => {
        if (!itn.inChange()) return NO_INPUT;
        const isCxl = itn.changeSet.trigger === ChangeTrigger.CANCELLATION;
        const fields = {};
        if (itn.changeNeedsVoucher()) fields.confirmVouchers = { type: 'boolean', title: 'Generate supplier vouchers now (needed when vouchered/confirmed lines changed)', default: true };
        if (isCxl) fields.issueCreditNote = { type: 'boolean', title: 'Issue credit note (cancellation; else cash refund)', default: true };
        return Object.keys(fields).length ? schema(fields) : NO_INPUT;
      },
      checks: [
        { description: 'Change open', check: (itn) => itn.inChange() ? ok('A change is open.') : no('No change open.') },
        { description: 'Cancellation ready', check: (itn) => { const isCxl = itn.inChange() && itn.changeSet.trigger === ChangeTrigger.CANCELLATION; return isCxl ? ok('Apply cancellation → all items CANCELLED, itinerary CANCELLED (fees + refund/credit).') : null; } },
        { description: 'Has staged edit', check: (itn) => { const isCxl = itn.inChange() && itn.changeSet.trigger === ChangeTrigger.CANCELLATION; return (!itn.inChange() || isCxl) ? null : (itn.hasStagedEdits() ? ok('Has a staged edit.') : gated('Stage at least one edit first.')); } },
        { description: 'No rejection', check: (itn) => { const isCxl = itn.inChange() && itn.changeSet.trigger === ChangeTrigger.CANCELLATION; return (!itn.inChange() || isCxl) ? null : (itn.unresolvedRejection() ? gated('Unresolved supplier rejection — resolve it (reinstate / replace / drop / revert to confirmed) before applying.') : ok('No unresolved supplier rejection.')); } },
        { description: 'Holds not expired', check: (itn) => { const isCxl = itn.inChange() && itn.changeSet.trigger === ChangeTrigger.CANCELLATION; if (!itn.inChange() || isCxl) return null; const it = itn.expiredHoldItem(); return it ? gated('A relied-on supplier hold has expired (' + it.name + ') — re-hold or re-price that line before applying.') : ok('No line is relying on an expired hold.'); } },
        { description: 'Ready', check: (itn) => { const isCxl = itn.inChange() && itn.changeSet.trigger === ChangeTrigger.CANCELLATION; return (!itn.inChange() || isCxl) ? null : ok(itn.changeNeedsVoucher() ? 'Apply → supplier vouchers will be generated automatically (confirm on apply, R-CH-26).' : 'Commit the change → merge to baseline.'); } },
      ],
      async execute(itn, u, input) {
        const isCxl = itn.changeSet && itn.changeSet.trigger === ChangeTrigger.CANCELLATION;
        if (!isCxl && itn.changeNeedsVoucher()) {                         // generate supplier vouchers first, only if confirmed
          if (!(input && input.confirmVouchers)) { itn._log('seller', 'apply held — supplier voucher generation not confirmed (R-CH-26)'); return no('Apply held — supplier voucher generation was not confirmed (R-CH-26).'); }
          // item.Confirm lines: capture them BEFORE the send (which clears confirmOnApply on auto types / attach),
          // then realise & confirm each covering live voucher (all-or-nothing). The voucher is created by the send
          // when nothing/stale was out (cases 1 & 3); for an already-matching request (case 2) the existing live
          // voucher is confirmed instead (R-IT-05 / R-VC-01).
          const toConfirm = itn.staged().filter((u) => u.confirmOnApply).map((u) => u.id);
          itn._sendVouchers(true);
          const done = new Set();
          toConfirm.forEach((id) => {
            const it = itn.findItem(id); if (!it || !it.confirmOnApply) return;   // already booked by the send (cleared per line)
            // confirm the supplier's live voucher; when none exists (e.g. the matching request's voucher was
            // rejected then reinstated) raise a fresh one first — a queued Confirm always lands (R-IT-05).
            const v = itn.liveVoucherFor(it.supplierId) || itn._makeSupplierVoucher(it.supplierId, true);
            if (v && !done.has(v.id)) { itn._confirmVoucher(v); done.add(v.id); }
          });
        }
        // A full cancellation must tell every engaged supplier to cancel: the staged CANCELs become CANCEL
        // lines on a fresh voucher per supplier (superseding its live one), same as a per-item cancel (R-CN-09).
        if (isCxl) itn._sendVouchers(true);
        let fees = 0, refundCapped = 0;
        itn.units().forEach((u) => {
          if (u.pendingOp === PendingOp.CANCEL) {
            // The line lands on CANCELLED immediately (intent). If a per-item cancel raised a fresh cancel-ask
            // (an AWAITING request from the send above), supplier status reads AwaitingSupplier until the supplier
            // answers (→ Booked on confirm / Rejected on reject); a full cancellation or one with nothing out
            // simply reads Booked. The fee/refund still settles here, on Apply, either way.
            u.status = ServiceStatus.CANCELLED;
            u.cancellation = u.cancelIntent || { fee: 0, refund: 0 };
            fees += u.cancellation.fee || 0;
            if (!isCxl && u.cancellation.refund > 0) {
              // refund only money actually collected (paid() shrinks as each refund posts) — mirrors the cancellation path's clamp.
              const give = Math.min(u.cancellation.refund, Math.max(0, itn.paid()));
              if (give < u.cancellation.refund) { refundCapped += u.cancellation.refund - give; u.cancellation = { fee: u.cancellation.fee, refund: give }; }
              if (give > 0) { itn.payments.push({ amount: -give, type: 'REFUND', t: itn._clk() }); itn._scheduleRefund(give, 'line cancellation refund (R-CN-09)'); }
            }
          }
        });
        const dropRefund = itn.units().some((x) => x.pendingOp === PendingOp.REMOVE && x.dropNoFee);   // drop-rejected staged (R-CN-08)
        itn.items = itn.items.filter((s) => s.pendingOp !== PendingOp.REMOVE);
        itn.items.forEach((s) => { s.extras = s.extras.filter((e) => e.pendingOp !== PendingOp.REMOVE); });
        itn.pax = itn.pax.filter((p) => !p.pendingRemove);
        itn.pax.forEach((p) => { p.origin = 'BASELINE'; });
        itn.units().forEach((u) => { u.origin = 'BASELINE'; u.pendingOp = null; u.prevOp = null; u.committed = null; u.committedLife = null; u.cancelIntent = null; u.priorRequested = null; u.requestOnApply = false; u.confirmOnApply = false; });
        itn.changeSet = null; itn.pendingStatus = 'NONE';
        if (isCxl) {
          itn.status = ItineraryStatus.CANCELLED;
          const net = Math.max(0, itn.paid() - fees);
          // Net money owed back to the client → keep it as client credit (credit note) OR pay it back (refund). A
          // refund is scheduled as a REFUND_TO_CLIENT milestone alongside the negative payment row; the payment
          // status itself re-derives to CANCELLED (a dead itinerary).
          if (net > 0) {
            if (input && input.issueCreditNote) { itn.payments.push({ amount: -net, type: 'CREDIT_NOTE', t: itn._clk() }); }
            else { itn.payments.push({ amount: -net, type: 'REFUND', t: itn._clk() }); itn._scheduleRefund(net, 'cancellation refund (R-CN-09)'); }
          }
          itn.recompute();
          itn._log('seller', 'cancellation applied → CANCELLED · fees $' + fees + ' · refund/credit $' + net + ' (R-CN-09)');
        } else {
          // drop-rejected (R-CN-08): the dropped line leaves the client over-paid → refund the difference (seller absorbs).
          if (dropRefund) { const over = itn.paid() - itn.total(); if (over > 0) { itn.payments.push({ amount: -over, type: 'REFUND', t: itn._clk() }); itn._scheduleRefund(over, 'over-payment refund on dropped line (R-CN-08)'); } }
          itn.recompute(); itn._log('seller', 'applied change → merged to baseline' + (refundCapped ? ' · refund capped at money collected (−$' + refundCapped + ')' : ''));
        }
        itn._snapshotVersion(isCxl ? 'cancellation applied → CANCELLED' : 'change applied → merged to baseline');   // store the itinerary version after the apply
      } },
    { id: 'cCancel', fn: 'pendingChangesCancel', category: 'pendingChanges', ruleId: 'R-CH-12', description: 'Cancel / discard change',
      preconditions: 'No change-created voucher still out to a supplier.', outcome: 'Discards the change (or aborts a cancellation) → baseline.', params: NO_INPUT,
      checks: [
        { description: 'Change open', check: (itn) => itn.inChange() ? ok('A change is open.') : no('No change open.') },
        { description: 'No live voucher', check: (itn) => !itn.inChange() ? null : (itn.changeHasLiveVoucher() ? gated('Outstanding voucher(s) out to supplier(s). A sent voucher can’t be silently discarded — resolve each line first: supplier must Reject, or Revert the amendment / Cancel the line then Apply (R-CH-24).') : ok('No change-created voucher still out.')) },
        { description: 'Ready', check: (itn) => !itn.inChange() ? null : ok(itn.changeSet.trigger === ChangeTrigger.CANCELLATION ? 'Cancel the cancellation (abort).' : 'Discard the pending change → revert to baseline.') },
      ],
      async execute(itn) { itn._revertChange('seller', (itn.changeSet && itn.changeSet.trigger === ChangeTrigger.CANCELLATION) ? 'cancelled the cancellation → itinerary stays CONFIRMED' : 'cancelled pending change'); } },

    /* ---- item ---- */
    { id: 'addExtra', fn: 'itemAddExtra', category: 'item', ruleId: 'R-EX-01', description: 'Add Extra',
      preconditions: 'Selected line is a service; in an open or auto-opening change (staged ADD).', outcome: 'Adds a child extra (own price/pax/voucher) on the SAME supplier as the service, as a staged ADD.',
      // No supplier field: an extra always inherits the parent service's supplier (R-EX-01) — services and their
      // extras must share one supplier, so the seller cannot pick a different one here.
      params: schema({ name: fStr('Extra name', 'Spa package'), adultRate: fNum('Adult rate / day', 120), childRate: fNum('Child rate / day', 60) }, ['name']),
      checks: [
        { description: 'On a service', check: (itn, u) => u.isService() ? ok('Selected line is a service.') : no('Extras attach to a service, not another extra.') },
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Adding an extra goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Ready', check: (itn, u) => ok('Add a child extra on ' + Suppliers[u.supplierId].name + ' (same supplier as the service) — staged in the change (auto-opens in DRAFT).') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        const sup = u.supplierId; if (!Suppliers[sup]) return;   // extras always inherit the service's supplier
        const name = i.name || 'Spa package'; if (!name) return;
        const rates = { ADULT: Number(i.adultRate) || 0, CHILD: Number(i.childRate) || 0, INFANT: 0 };
        itn._ensureChange();
        const ex = itn.addExtraTo(u, sup, name, rates);
        ex.origin = 'PENDING'; ex.pendingOp = PendingOp.ADD; ex.hypothetical = false;
        itn._touchChange(); itn._log('seller', 'staged ADD extra ' + ex.id + ' to ' + u.id);
        itn.recompute();
      } },
    { id: 'hold', fn: 'itemRequestHold', category: 'item', ruleId: 'R-IT-01', description: 'Add Hold',
      preconditions: 'A NEW item with no live supplier hold covering the current spec.', outcome: 'Records a supplier hold (HELD, with expiry) covering the current spec. Status stays NEW — a hold is a record, not a status.',
      params: schema({ expiresAt: fDate('Hold expires', isoForDay(7)) }),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Record a hold — staged in the change (auto-opens in DRAFT).') : no('A hold goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Nothing queued', check: (itn, u) => (u.requestOnApply || u.confirmOnApply) ? no('A supplier request/confirmation is already queued on Apply.') : ok('No supplier request/confirmation queued.') },
        { description: 'NEW line', check: (itn, u) => u.activeStatus === ServiceStatus.NEW ? ok('Line is NEW (pre-commitment).') : no('Holds only apply before supplier commitment (now ' + u.activeStatus + ').') },
        { description: 'No covering hold', check: (itn, u) => u.activeHolds().some((h) => h.fp === u.fingerprint()) ? no('A supplier hold already covers the current spec.') : ok('No hold covers the current spec yet.') },
        { description: 'Ready', check: () => ok('Record a supplier hold (HELD) covering the current spec.') },
      ],
      async execute(itn, u, input) {
        const t = u.target();
        const expiresAt = isoDate((input && input.expiresAt) || isoForDay(7));
        itn._ensureChange(); itn._beginLife(u);   // a hold is staged — auto-open a change + snapshot lifecycle so Cancel reverts it
        u.holds.push({ id: 'H' + itn._nextId(), fp: t.fp, price: t.price, expiresAt, expired: false, status: 'HELD', at: itn._clk() });
        itn.recompute(); itn._touchChange();   // a hold expiring before the deposit base may pull the deposit due forward
        itn._log('seller', 'staged supplier hold ' + u.id + ' → HELD (expires ' + expiresAt + ') — saved on Apply');
      } },
    { id: 'holdStatus', fn: 'itemToggleHoldStatus', category: 'item', ruleId: 'R-IT-02', description: 'Toggle held/released',
      preconditions: 'A specific hold on the item (toggled from the holds list).', outcome: 'Flips that hold between HELD and RELEASED.',
      params: schema({ holdId: fStr('Hold id', '') }, ['holdId']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Record a hold — staged in the change (auto-opens in DRAFT).') : no('A hold goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Active hold', check: (itn, u) => (u.holds || []).some((x) => !x.expired) ? ok('Cycle a hold HELD ↔ RELEASED.') : no('No active holds on this item.') },
      ],
      async execute(itn, u, input) {
        const hold = (u.holds || []).find((x) => x.id === (input && input.holdId));
        if (!hold) return no('No hold "' + ((input && input.holdId) || '') + '" on this item.');
        itn._ensureChange(); itn._beginLife(u);   // flipping a hold is staged — auto-open a change + snapshot lifecycle so Cancel reverts it
        hold.status = hold.status === HoldStatus.RELEASED ? HoldStatus.HELD : HoldStatus.RELEASED;
        itn.recompute(); itn._touchChange();   // releasing/holding changes the active-hold set → may shift the deposit due
        itn._log('seller', 'hold ' + hold.id + ' → ' + hold.status + ' on ' + u.id + ' — saved on Apply');
      } },
    { id: 'expire', fn: 'itemToggleHoldExpired', category: 'item', ruleId: 'R-IT-04', description: 'Toggle hold-expired',
      preconditions: 'A specific hold on the item (toggled from the holds list).', outcome: 'Flips that hold’s expired flag (informational).',
      params: schema({ holdId: fStr('Hold id', '') }, ['holdId']),
      checks: [
        { description: 'Has a hold', check: (itn, u) => (u.holds && u.holds.length) ? ok('Toggle a hold’s expired flag.') : no('No holds on this item.') },
      ],
      async execute(itn, u, input) {
        const hold = (u.holds || []).find((x) => x.id === (input && input.holdId));
        if (!hold) return no('No hold "' + ((input && input.holdId) || '') + '" on this item.');
        hold.expired = !hold.expired;
        itn.recompute();   // expiring/clearing changes the active-hold set → may shift the deposit due
        itn._log('seller', 'hold ' + hold.id + ' ' + (hold.expired ? 'EXPIRED' : 'cleared') + ' on ' + u.id);
      } },
    { id: 'validate', fn: 'itemValidatePrice', category: 'item', ruleId: 'R-IT-03', description: 'Validate price',
      preconditions: 'In an open or auto-opening change (validation can change the price → staged).', outcome: 'Rebuilds the system net/rack/sell breakdown from the rate card (staged MODIFY) and clears the hypothetical estimate flag. An optional net total pins a supplier-confirmed figure.',
      params: schema({ net: fNum('Validated net total (blank = keep the rate-card breakdown)', null) }),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('Validate the system breakdown → staged MODIFY (can change the price; auto-opens a draft change).')
          : no('Price validation goes via a change; ' + itn.offDraftHint() + '.') },
      ],
      async execute(itn, u, input) {
        const raw = input && (input.net != null && input.net !== '' ? input.net : (input.price != null && input.price !== '' ? input.price : null));
        const has = raw != null;
        const v = has ? Number(raw) : null;
        if (has && (isNaN(v) || v < 0)) return no('Validated net must be a non-negative number.');
        const old = u.netFigure();
        itn._stageEdit(u, () => {
          u.hypothetical = false;
          u.itemManualPrice.validatedNet = has ? round(v) : null;       // pin a supplier-confirmed net (or clear → re-validate from the rate card)
          recomputeItemPrice(u, true);                                  // rebuild the system breakdown, then apply the pin
        });
        itn.recompute();
        const changed = has && v !== old;
        itn._log('seller', 'staged validate ' + u.id + (changed ? ' net $' + old + '→$' + u.netFigure() : ' (net $' + u.netFigure() + ')') + ' (R-IT-03)');
      } },
    { id: 'manual', fn: 'itemManagePrice', category: 'item', ruleId: 'R-PR-01', description: 'Manual price',
      preconditions: 'Staged MODIFY in an open or auto-opening change (same gate as a manual price).', outcome: 'Sets the rate type and the manual sell levers — manual total sell, manual margin, and a Unit price (Unit charge type) or per-pax ADT/CHD/INF prices (Person charge type). The system net and all calc totals stay system-derived.',
      // Params show the rate type + ALL price fields (Unit price AND per-pax ADT/CHD/INF); the exec applies whichever
      // matches the chosen charge type. Defaults reflect the line's current rate type and any existing overrides.
      params: (itn) => {
        const u = itn.selected(); const rt = (u && u.rateType) || RT_DEFAULT;
        const pax = (code) => { const ov = ((u && u.itemManualPrice && u.itemManualPrice.paxOverrides) || []).find((o) => o.type === code); return ov ? ov.sell : null; };
        const unitOv = ((u && u.itemManualPrice && u.itemManualPrice.unitOverrides) || []).find((o) => o.idx == null);
        return schema({
          chargeType: fEnum(['Person', 'Unit'], 'Charge type', rt.chargeType),
          timeUnit: fEnum(['Night', 'Day', 'Stay'], 'Time unit', rt.timeUnit),
          manualTotalSell: fNum('Manual total sell ($ — blank = unset, top priority)', (u && u.itemManualPrice && u.itemManualPrice.manualTotalSell) || null),
          manualMargin: fNum('Manual margin (% — blank = use system margin)', (u && u.itemManualPrice && u.itemManualPrice.manualMargin) || null),
          unitPrice: fNum('Unit price (Unit charge type — sell per unit)', unitOv ? unitOv.sell : null),
          adtPrice: fNum('ADT price (Person charge type — sell per adult)', pax('ADT')),
          chdPrice: fNum('CHD price (Person charge type — sell per child)', pax('CHD')),
          infPrice: fNum('INF price (Person charge type — sell per infant)', pax('INF')),
          clear: { type: 'boolean', title: 'Clear all manual overrides (back to system price)', default: false },
        });
      },
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Price change goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Not staged otherwise', check: (itn, u) => (u.pendingOp && u.pendingOp !== PendingOp.MODIFY && u.pendingOp !== PendingOp.ADD) ? no('Already staged: ' + u.pendingOp + '.') : ok('Not staged as a non-MODIFY op.') },
        { description: 'Ready', check: (itn, u) => ok((u.manualPrice != null || (u.itemManualPrice && (u.itemManualPrice.manualMargin != null || (u.itemManualPrice.unitOverrides || []).length || (u.itemManualPrice.paxOverrides || []).length)) ? 'Adjust the manual price levers' : 'Override the system price') + ' → staged MODIFY' + (u.confirmed ? '; a CONFIRMED service gets the UPDATED label on re-voucher only if NET moves.' : '.')) },
      ],
      async execute(itn, u, input) {
        const i = input || {}; const man = u.itemManualPrice; const num = (x) => (x == null || x === '') ? null : Number(x);
        const wantsClear = !!i.clear;
        const cur = u.rateType || RT_DEFAULT;
        const nextRt = { chargeType: (i.chargeType && ['Person', 'Unit'].includes(i.chargeType)) ? i.chargeType : cur.chargeType, timeUnit: (i.timeUnit && ['Night', 'Day', 'Stay'].includes(i.timeUnit)) ? i.timeUnit : cur.timeUnit };
        const rtChanged = nextRt.chargeType !== cur.chargeType || nextRt.timeUnit !== cur.timeUnit;
        // resolve the prospective sell-side levers (no mutation yet — validate first)
        let nextTotal = man.manualTotalSell, nextMargin = man.manualMargin;
        let nextUnitOv = man.unitOverrides || [], nextPaxOv = (man.paxOverrides || []).slice();
        if (wantsClear) { nextTotal = null; nextMargin = null; nextUnitOv = []; nextPaxOv = []; }
        else {
          const hasTotal = ('manualTotalSell' in i) || ('price' in i);                                   // 'price' is a legacy alias for a bare manual sell
          if (hasTotal) nextTotal = num(('manualTotalSell' in i) ? i.manualTotalSell : i.price);
          if ('manualMargin' in i) nextMargin = num(i.manualMargin);
          if (Array.isArray(i.unitOverrides)) nextUnitOv = i.unitOverrides.map((o) => ({ idx: o.idx == null ? null : Number(o.idx), sell: Number(o.sell) }));
          if (Array.isArray(i.paxOverrides)) nextPaxOv = i.paxOverrides.map((o) => ({ type: String(o.type), idx: Number(o.idx || 0), sell: Number(o.sell) }));
          // form fields → overrides, per the (new) charge type
          if (nextRt.chargeType === 'Unit') {
            if ('unitPrice' in i) { const up = num(i.unitPrice); nextUnitOv = up != null ? [{ idx: null, sell: up }] : []; }
          } else {
            const setPax = (code, val) => { if (!(val in i)) return; const v = num(i[val]); nextPaxOv = nextPaxOv.filter((o) => o.type !== code); if (v != null) nextPaxOv.push({ type: code, idx: 0, sell: v }); };
            setPax('ADT', 'adtPrice'); setPax('CHD', 'chdPrice'); setPax('INF', 'infPrice');
          }
          if (rtChanged) { if (nextRt.chargeType === 'Unit') nextPaxOv = []; else nextUnitOv = []; }   // drop overrides that don't fit the new charge type
        }
        // validation (R-PR-01): rate type + sell levers only; system net/calc fields are never set here
        if (nextTotal != null && (isNaN(nextTotal) || nextTotal < 0)) return no('Manual total sell must be a non-negative number.');
        if (nextMargin != null && (isNaN(nextMargin) || nextMargin <= -100)) return no('Manual margin must be greater than −100%.');
        for (const o of nextUnitOv) { if (isNaN(o.sell) || o.sell < 0) return no('A unit price must be ≥ 0.'); if (o.idx != null && o.idx < 1) return no('Unit index must be ≥ 1 or null (wildcard).'); }
        for (const o of nextPaxOv) { if (isNaN(o.sell) || o.sell < 0) return no('A pax price must be ≥ 0.'); if (!['ANY', 'ADT', 'CHD', 'INF'].includes(o.type)) return no('Unknown pax type ' + o.type + '.'); }
        // stage the edit (recompute refreshes every calc field)
        itn._ensureChange();
        const actor = itn.changeSet.trigger === ChangeTrigger.CLIENT_REQUEST ? 'client' : 'seller';
        const staged = itn._stageEdit(u, () => {
          if (rtChanged) u.rateType = nextRt;
          man.manualTotalSell = nextTotal; man.manualMargin = nextMargin;
          man.unitOverrides = nextUnitOv; man.paxOverrides = nextPaxOv;
          if (rtChanged) itn._reprice(u);                                  // rebuild the system breakdown for the new rate shape
        });
        itn.recompute();
        itn._log(actor, (staged ? 'staged MODIFY ' : 'edited pending ') + u.id + ' → '
          + (wantsClear ? 'cleared manual (system $' + u.itemSystemPrice.total.sell + ')'
             : rateTypeTitle(nextRt) + ' sell $' + u.itemTotalPrice.totalSell + ' (net $' + u.itemTotalPrice.totalNet + ')') + ' (R-PR-01)');
      } },
    { id: 'addDiscount', fn: 'itemAddDiscount', category: 'item', ruleId: 'R-PR-02', description: 'Add Discount',
      preconditions: 'Staged MODIFY in an open or auto-opening change (same gate as a manual price).', outcome: 'Adds an item-specific MANUAL promotion (% off the sell) to the line. A manual promo always applies, reduces the client price and shows on the documents & supplier voucher. Σ manual discounts cannot exceed 100%.',
      params: schema({ descr: fStr('Discount label', 'Early Bird'), amount: fNum('Discount %', 5) }, ['amount']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Discounts go via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Not staged otherwise', check: (itn, u) => (u.pendingOp && u.pendingOp !== PendingOp.MODIFY && u.pendingOp !== PendingOp.ADD) ? no('Already staged: ' + u.pendingOp + '.') : ok('Not staged as a non-MODIFY op.') },
        { description: 'Ready', check: (itn, u) => ok(((itn.promotions || []).some((p) => p.isManual && (u.promotionIds || []).includes(p.id)) ? 'Add another manual promotion' : 'Add a manual promotion') + ' → staged MODIFY (shown on the documents & voucher).') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        // the line's current MANUAL instances (kept across the edit unless cleared/removed); catalog selections are untouched.
        let manuals = (itn.promotions || []).filter((p) => p.isManual && (u.promotionIds || []).includes(p.id));
        let created = [];
        if (i.clearDiscounts || Array.isArray(i.customDiscounts) || Array.isArray(i.manualPromos)) manuals = [];
        if (Array.isArray(i.customDiscounts)) created = i.customDiscounts.map((d) => makeManualPromo(itn, u, String(d.descr || 'Discount'), Number(d.amount) || 0));
        if (Array.isArray(i.manualPromos)) created = i.manualPromos.map((d) => makeManualPromo(itn, u, String(d.descr || d.name || 'Discount'), Number(d.amount != null ? d.amount : manualPct(d)) || 0));
        if (i.removeDiscountIdx != null) manuals = manuals.filter((_, idx) => idx !== Number(i.removeDiscountIdx));
        if (i.removePromoId != null) manuals = manuals.filter((p) => p.id !== i.removePromoId);
        const amt = (i.amount != null && i.amount !== '') ? Number(i.amount) : ((i.discountAmount != null && i.discountAmount !== '') ? Number(i.discountAmount) : null);
        if (amt != null && amt !== 0) {
          if (isNaN(amt) || amt < 0 || amt > 100) return no('Each manual discount must be 0–100%.');
          created.push(makeManualPromo(itn, u, String(i.descr || i.discountDescr || 'Discount'), amt));
        }
        const finalManuals = manuals.concat(created);
        const dsum = finalManuals.reduce((a, p) => a + manualPct(p), 0);
        if (dsum > 100) return no('Manual discounts total ' + dsum + '% — cannot exceed 100%.');
        created.forEach((p) => { if (!itn.promotions.some((x) => x.id === p.id)) itn.promotions.push(p); });   // register new manual instances
        // new promotionIds = the line's CATALOG instance refs (untouched) + the kept/created MANUAL instance ids
        const catalogRefs = (u.promotionIds || []).filter((id) => { const p = (itn.promotions || []).find((x) => x.id === id); return p && !p.isManual; });
        const newIds = catalogRefs.concat(finalManuals.map((p) => p.id));
        const staged = itn._stageEdit(u, () => { u.promotionIds = newIds; });
        itn._pruneOrphanPromos();   // drops manual instances removed above (now unreferenced)
        itn.recompute();
        itn._log('seller', (staged ? 'staged MODIFY ' : 'edited pending ') + u.id + ' → manual promos ' + dsum + '% (' + finalManuals.length + ' promo' + (finalManuals.length === 1 ? '' : 's') + ') (R-PR-02)');
      } },
    { id: 'selectPromotion', fn: 'itemSelectPromotion', category: 'item', ruleId: 'R-PR-03', description: 'Select Promotion', hidden: true,   // driven by the in-tab "select" buttons (needs a templateId)
      preconditions: 'An ACCOMMODATION line with a catalog promotion template of its supplier (not already selected on this line); staged via an open or auto-opening change.', outcome: 'Creates a SELECTED promotion instance (in itn.promotions) from a catalog template and associates this line with it. The same template can be selected on OTHER lines (a separate instance each), but not twice on the SAME line. Add more services to the instance (Toggle Promotion Service) so a multi-line deal — e.g. a circuit — matches.',
      params: schema({ templateId: fStr('Promotion template id', '') }, ['templateId']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Promotion selection goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Accommodation', check: (itn, u) => (u.type === ServiceType.ACCOMMODATION) ? ok('Accommodation line.') : no('Promotions apply to accommodation lines only.') },
        { description: 'Not staged otherwise', check: (itn, u) => (u.pendingOp && u.pendingOp !== PendingOp.MODIFY && u.pendingOp !== PendingOp.ADD) ? no('Already staged: ' + u.pendingOp + '.') : ok('Not staged as a non-MODIFY op.') },
        { description: 'Not already selected', check: (itn, u, input) => { const tid = (input || {}).templateId; return (tid && itn._itemHasTemplate(u, tid)) ? no('This promotion is already selected for this line.') : ok('Not yet selected on this line.'); } },
        { description: 'Ready', check: (itn, u) => ok('Select a supplier promotion for this line → a new instance, staged MODIFY.') },
      ],
      async execute(itn, u, input) {
        const t = (itn.promotionCatalog || []).find((x) => x.id === (input || {}).templateId && x.supplierId === u.supplierId);
        if (!t) return no('Promotion not available for this line.');
        if (itn._itemHasTemplate(u, t.id)) return no('This promotion is already selected for this line.');   // no duplicate of the same promo on one line
        const inst = instanceFromTemplate(itn, t);
        itn.promotions.push(inst);                                 // register the instance; the staged ref below keeps it from being pruned
        const staged = itn._stageEdit(u, () => { u.promotionIds = (u.promotionIds || []).concat([inst.id]); });
        itn.recompute();
        itn._log('seller', (staged ? 'staged MODIFY ' : 'edited pending ') + u.id + ' → selected promo "' + t.name + '" (' + inst.id + ') (R-PR-03)');
      } },
    { id: 'togglePromoItem', fn: 'itemTogglePromoItem', category: 'item', ruleId: 'R-PR-04', description: 'Toggle Promotion Service', hidden: true,   // driven by the in-tab member/candidate buttons (needs promoId [+itemId])
      preconditions: 'A selected promotion instance and an ACCOMMODATION line of its supplier; staged via an open or auto-opening change.', outcome: 'Adds or removes a line from a selected promotion instance (so e.g. a circuit deal spanning two lodges can match). Removing the last member drops the instance.',
      params: schema({ promoId: fStr('Promotion instance id', ''), itemId: fStr('Item id (defaults to the open line)', '') }, ['promoId']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Promotion changes go via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Ready', check: (itn, u) => ok('Add or remove a service on this promotion → staged MODIFY.') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        const inst = (itn.promotions || []).find((x) => x.id === i.promoId);
        if (!inst) return no('Promotion not found.');
        const target = i.itemId ? itn.findItem(i.itemId) : u;
        if (!target) return no('Item not found.');
        if (target.type !== ServiceType.ACCOMMODATION) return no('Promotions apply to accommodation lines only.');
        if (target.supplierId !== inst.supplierId) return no('Line is a different supplier to the promotion.');
        const has = (target.promotionIds || []).includes(inst.id);
        if (!has && itn._itemHasTemplate(target, inst.templateId)) return no('That promotion is already selected for this line.');   // no duplicate of the same promo on one line
        const staged = itn._stageEdit(target, () => { target.promotionIds = has ? (target.promotionIds || []).filter((x) => x !== inst.id) : (target.promotionIds || []).concat([inst.id]); });
        itn._pruneOrphanPromos();   // if the removed line was the last member, drop the instance
        itn.recompute();
        itn._log('seller', (staged ? 'staged MODIFY ' : 'edited pending ') + target.id + ' → ' + (has ? 'removed from' : 'added to') + ' promo "' + inst.name + '" (R-PR-04)');
      } },
    { id: 'allocDates', fn: 'itemAllocateDates', category: 'item', ruleId: 'R-AL-01', description: 'Change Dates',
      preconditions: 'A service, or an extra (whose window must sit within its parent); staged MODIFY in an open or auto-opening change.', outcome: 'Sets start/end dates (YYYY-MM-DD; drives nights × pax pricing). A service’s date change auto enclose/expands its date-following extras; an independently-dated extra is clamped inside. An extra cannot exceed its parent’s dates (R-EX-02).',
      // ISO date pickers; default to the line's current dates. An extra edited here keeps its own window (datesLocal).
      params: (itn) => { const u = itn.selected(); const sd = (u && u.startDate) ? isoDate(u.startDate) : isoForDay(1); const ed = (u && u.endDate) ? isoDate(u.endDate) : sd; return schema({ startDate: fDate('Start date', sd), endDate: fDate('End date', ed) }, ['startDate', 'endDate']); },
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Date change goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Ready', check: (itn, u) => {
          if (u.isExtra()) { const p = u.parent(); if (!p) return no('Extra has no parent service.'); return ok('Set extra dates within the parent window ' + p.startDate + '→' + p.endDate + ' → staged (R-EX-02).'); }
          return u.origin === 'PENDING' ? ok('Set dates on this newly-added item (its following extras track the window).') : ok('Set dates → staged MODIFY; following extras auto enclose/expand; a CONFIRMED service gets the UPDATED label on re-voucher (R-IT-07).');
        } },
      ],
      async execute(itn, u, input) {
        const sd = input && input.startDate, ed = input && input.endDate;
        if (sd == null || ed == null || sd === '' || ed === '') return no('Both start and end dates are required.');
        const a = dayNum(sd), b = dayNum(ed);
        if (a > b) { itn._log('seller', 'rejected dates ' + u.id + ' ' + isoForDay(a) + '→' + isoForDay(b) + ' — start is after end'); return no('Start date is after end date.'); }
        if (u.isExtra()) {                                          // an extra must not exceed its parent's dates (R-EX-02)
          const p = u.parent();
          const pa = dayNum(p && p.startDate), pb = dayNum(p && p.endDate);
          if (!p || a < pa || b > pb) { itn._log('seller', 'rejected extra dates ' + u.id + ' ' + isoForDay(a) + '→' + isoForDay(b) + ' — must sit within parent ' + (p ? p.startDate + '→' + p.endDate : '(none)') + ' (R-EX-02)'); return no('Extra dates must sit within the parent window' + (p ? ' ' + p.startDate + '→' + p.endDate : '') + ' (R-EX-02).'); }
        }
        const staged = itn._stageEdit(u, () => {
          u.startDate = isoForDay(a); u.endDate = isoForDay(b); itn._reprice(u);
          if (u.isExtra()) u.datesLocal = true;                    // an edited extra diverges → keeps its own window, no longer follows the service
          if (u.isService()) {
            // The date change cascades to extras like the qty cascade: a date-FOLLOWING extra (datesLocal=false) tracks
            // the FULL new window (enclose + expand); an independently-dated extra (datesLocal=true) is only clamped
            // INSIDE the new window (enclose only, R-EX-02). CANCEL/REMOVE extras are left alone.
            u.extras.forEach((e) => {
              if (e.pendingOp === PendingOp.CANCEL || e.pendingOp === PendingOp.REMOVE) return;
              let na, nb, why;
              if (e.datesLocal) {
                na = Math.min(Math.max(dayNum(e.startDate), a), b); nb = Math.min(Math.max(dayNum(e.endDate), na), b);
                if (na === dayNum(e.startDate) && nb === dayNum(e.endDate)) return;   // still inside the window — untouched
                why = 'clamped extra ' + e.id + ' into the new parent window';
              } else {
                na = a; nb = b;                                    // follow the full parent window (enclose + expand)
                if (na === dayNum(e.startDate) && nb === dayNum(e.endDate)) return;   // already matches the window
                why = 'extra ' + e.id + ' followed the parent window';
              }
              if (e.origin === 'BASELINE') itn._beginEdit(e, PendingOp.MODIFY);
              e.startDate = isoForDay(na); e.endDate = isoForDay(nb); itn._reprice(e);
              itn._log('seller', why + ' → ' + e.startDate + '→' + e.endDate + ' (R-EX-02)');
            });
          }
        });
        itn._log('seller', (staged ? 'staged date change ' : 'set dates on pending ') + u.id + ' → ' + isoForDay(a) + '→' + isoForDay(b) + (staged ? ' (MODIFY)' : ''));
      } },
    { id: 'allocPax', fn: 'itemAllocatePax', category: 'item', ruleId: 'R-AL-02', description: 'Allocate travellers',
      preconditions: 'Staged MODIFY in an open or auto-opening change; an extra’s travellers must be a subset of its parent service.', outcome: 'Sets which travellers are on this line (re-prices). An extra cannot exceed its parent’s travellers; dropping a traveller from a service removes it from its extras too (R-EX-02).',
      // default the traveller set to the selected line's current allocation (per-line default, sourced from the aggregate)
      params: (itn) => { const u = itn.selected(); return schema({ paxIds: { type: 'array', items: { type: 'string' }, title: 'Traveller ids', default: (u && Array.isArray(u.paxIds)) ? [...u.paxIds] : [] } }, ['paxIds']); },
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Pax allocation goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Ready', check: (itn, u) => {
          const tail = u.isExtra() ? ' (extra: limited to the parent service’s travellers, R-EX-02)' : ' (removing a traveller cascades to its extras, R-EX-02)';
          return u.origin === 'PENDING' ? ok('Set travellers on this newly-added item' + tail + '.') : ok('Change travellers → staged MODIFY (re-prices; re-voucher if confirmed)' + tail + '.');
        } },
      ],
      async execute(itn, u, input) {
        let ids = (input && input.paxIds) || [];
        if (!Array.isArray(ids)) ids = String(ids).split(',').map((s) => s.trim()).filter(Boolean);
        ids = ids.filter((id) => itn.pax.some((p) => p.id === id));
        if (u.isExtra()) {                                          // clamp to the parent service's travellers (R-EX-02)
          const par = u.parent(); const reqd = ids.length;
          ids = ids.filter((id) => par && par.paxIds.includes(id));
          if (ids.length !== reqd) itn._log('seller', 'clamped extra ' + u.id + ' travellers to parent set (R-EX-02)');
        }
        const staged = itn._stageEdit(u, () => {
          u.paxIds = ids; itn._reprice(u);
          if (u.isService()) {
            // Pax enclosure cascades like the dates window: a traveller dropped from the service is dropped from each
            // linked extra too (an extra can never exceed its parent — R-EX-02). Only removals cascade; adding a
            // traveller to the service leaves the extras' own (subset) allocation alone. CANCEL/REMOVE extras untouched.
            u.extras.forEach((e) => {
              if (e.pendingOp === PendingOp.CANCEL || e.pendingOp === PendingOp.REMOVE) return;
              const keep = (e.paxIds || []).filter((id) => ids.includes(id));
              if (keep.length === (e.paxIds || []).length) return;   // nothing dropped from this extra
              if (e.origin === 'BASELINE') itn._beginEdit(e, PendingOp.MODIFY);
              e.paxIds = keep; itn._reprice(e);
              itn._log('seller', 'extra ' + e.id + ' travellers clamped to the parent set (R-EX-02)');
            });
          }
        });
        itn._log('seller', staged ? 'staged pax change ' + u.id + ' → [' + ids.join(',') + '] (MODIFY)' : 'set pax on pending ' + u.id + ' → [' + ids.join(',') + ']');
      } },
    { id: 'qty', fn: 'itemChangeQty', category: 'item', ruleId: 'R-AL-03', description: 'Change Qty',
      preconditions: 'Staged MODIFY in an open or auto-opening change; quantity ≥ 1.', outcome: 'Sets the commercial quantity (scales price, versions supplier intent). A service’s qty cascades to its linked extras; an edited extra keeps its own value. Min 1.',
      params: schema({ qty: fNum('Quantity (commercial)', 1) }, ['qty']),
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Qty change goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Not staged otherwise', check: (itn, u) => (u.pendingOp && u.pendingOp !== PendingOp.MODIFY && u.pendingOp !== PendingOp.ADD) ? no('Already staged: ' + u.pendingOp + '.') : ok('Not staged as a non-MODIFY op.') },
        { description: 'Ready', check: (itn, u) => { const tail = u.isService() ? ' (cascades to linked extras)' : ''; return ok(u.origin === 'PENDING' ? 'Set the quantity on this newly-added item' + tail + '.' : 'Change quantity → staged MODIFY (re-prices; a CONFIRMED service gets the UPDATED label on re-voucher)' + tail + '.'); } },
      ],
      async execute(itn, u, input) {
        const qty = Math.max(1, Number(input && input.qty) || 1);   // min 1 (same clamp as addService)
        // stage (baseline → MODIFY) or edit-in-place (pending ADD), then re-price each line.
        const apply = (line) => { if (line.origin === 'BASELINE') itn._beginEdit(line, PendingOp.MODIFY); line.qty = qty; itn._reprice(line); };
        const staged = itn._stageEdit(u, () => {
          u.qty = qty; itn._reprice(u);                      // u is already staged by _stageEdit
          if (u.isService()) {
            // cascade to extras still linked to the service (those not independently edited).
            u.extras.forEach((e) => { if (!e.qtyLocal && (!e.pendingOp || e.pendingOp === PendingOp.MODIFY || e.pendingOp === PendingOp.ADD)) apply(e); });
          } else {
            u.qtyLocal = true;   // an edited extra diverges → keeps its own value, no longer driven by the service
          }
        });
        itn._log('seller', (staged ? 'staged qty change ' : 'set qty on pending ') + u.id + ' → ×' + qty + (u.isService() ? ' (cascaded to linked extras)' : ' (local)'));
      } },
    { id: 'markAwaiting', fn: 'itemMarkAwaiting', category: 'item', ruleId: 'R-IT-10', description: 'Confirm',
      preconditions: 'A NEW item with nothing out to the supplier yet (or a supplier-rejected line). Auto-confirm items (insurance) may be confirmed too — they book on their own voucher at the next send.', outcome: 'Status → CONFIRMED (intent). The supplier voucher is raised at the next voucher generation — the itinerary Send Vouchers, or a PostBookingModif Apply — then supplier status → AwaitingSupplier (NeedsRequest until then). An auto-confirm item is booked outright on its own CONFIRMED voucher.', params: NO_INPUT,
      // A supplier-rejected line can be re-confirmed (clears the rejection, raises a fresh request) — that early
      // success short-circuits the later "nothing out yet" checks, so they are skipped once `rej` holds.
      checks: [
        { description: 'Not already confirming', check: (itn, u) => u.requestOnApply ? no('Already confirming — the voucher follows at Send Vouchers / a PostBookingModif Apply.') : ok('Not already confirming.') },
        { description: 'No confirm queued', check: (itn, u) => u.confirmOnApply ? no('Confirm already queued.') : ok('No confirm queued.') },
        { description: 'Ready', check: (itn, u) => (u.supplierStatus === SupplierStatus.Rejected) ? ok('Re-confirm (clears the rejection) → CONFIRMED; the voucher follows at the next send (R-IT-10 / R-IT-06).') : null },
        { description: 'Nothing out yet', check: (itn, u) => (u.supplierStatus === SupplierStatus.Rejected) ? null : (u.confirmed != null ? no('Already confirmed for this line.') : ok('Not yet confirmed.')) },
        { description: 'No request out', check: (itn, u) => (u.supplierStatus === SupplierStatus.Rejected) ? null : (u.requested != null ? no('A request is already out for this line.') : ok('No request out.')) },
        { description: 'Not already CONFIRMED', check: (itn, u) => (u.supplierStatus === SupplierStatus.Rejected) ? null : (u.activeStatus === ServiceStatus.CONFIRMED ? no('Already CONFIRMED.') : ok('Not already CONFIRMED.')) },
        { description: 'Ready', check: (itn, u) => (u.supplierStatus === SupplierStatus.Rejected) ? null : ok('Confirm → status CONFIRMED (intent); the supplier voucher follows at Send Vouchers / a PostBookingModif Apply (R-IT-10).') },
      ],
      async execute(itn, u) {
        itn._beginLife(u);                                       // tracked in the change → revertible on Cancel
        if (u.supplierStatus === SupplierStatus.Rejected) u.requested = null;   // clear the rejection; a fresh request is raised on Apply
        u.status = ServiceStatus.CONFIRMED;                      // intent → CONFIRMED; supplier status tracks the supplier ack
        u.requestOnApply = true;                                 // commercial request (voucher + requested) raised on Apply
        itn._log('seller', 'requested supplier confirmation ' + u.id + ' → CONFIRMED (voucher raised on Apply; supplier status NeedsRequest until then, R-IT-10)');
      } },
    // A supplier status-Rejected line is resolved through the status picker / Remove, not bespoke actions:
    //   · pick CONFIRMED  → markAwaiting (clears the rejection and re-requests; the voucher follows at the next send)
    //   · pick NEW        → newItem (gated restart, clears the commercial triple)
    //   · Remove          → removeItem (a rejected line drops with no client fee, refunds overpayment on Apply, R-CN-08)
    // (replaces reinstateResend / reinstateConfirm / revertConfirmed / replaceNew / dropRejected)
    { id: 'newItem', fn: 'itemToNew', category: 'item', ruleId: 'R-IT-06', description: 'Reset to NEW',
      preconditions: 'A line with NOTHING out to the supplier (confirmed == null AND requested == null).', outcome: 'Restarts the line from NEW — clears holds and the commercial triple. (Once a voucher is out or agreed you must Cancel, not reset.)', params: NO_INPUT,
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Status change goes via a change; ' + itn.offDraftHint() + '.') },
        // Rule: can't switch to NEW while the supplier is engaged (a voucher is out or agreed). Cancel it first.
        { description: 'Nothing out', check: (itn, u) => (u.confirmed != null || u.requested != null) ? no('A supplier voucher is out (requested) or agreed (confirmed) — can’t reset to NEW; Cancel it first (R-IT-06).') : ok('Nothing out to the supplier.') },
        // A queued request/confirm or a hold is NOT "already NEW" — Reset stays available as the per-line undo.
        { description: 'Not already NEW', check: (itn, u) => (u.activeStatus === ServiceStatus.NEW && !u.requestOnApply && !u.confirmOnApply && (u.holds || []).length === 0) ? no('Already NEW.') : ok('Not already a clean NEW line.') },
        { description: 'Ready', check: () => ok('Restart this line from NEW — clears holds and the commercial triple (R-IT-06).') },
      ],
      async execute(itn, u) {
        itn._ensureChange(); itn._beginLife(u);                  // staged via committedLife → revertible on Cancel
        u.status = ServiceStatus.NEW;
        u.requested = null; u.confirmed = null; u.holds = []; u.paymentTerms = null; u.supplierAside = null;
        u.confirmOnApply = false; u.requestOnApply = false;
        itn.recompute(); itn._touchChange();
        itn._log('seller', 'reset ' + u.id + ' → NEW (cleared holds + commercial triple, R-IT-06)');
      } },
    { id: 'opsReady', fn: 'itemToggleOpsReady', category: 'item', ruleId: 'R-OPS-01', description: 'Toggle OPS_READY',
      preconditions: 'An Ops (OPS) user, a CONFIRMED service whose supplier line is Booked.', outcome: 'Flips OPS_READY (Ops verified; gates FCA).', params: NO_INPUT,
      checks: [
        { description: 'Ops only', check: (itn) => opsOnly(itn) },
        { description: 'CONFIRMED', check: (itn, u) => u.status === ServiceStatus.CONFIRMED ? ok('Line is a CONFIRMED service.') : no('OPS_READY only on a CONFIRMED service.') },
        { description: 'Booked', check: (itn, u) => u.supplierStatus === SupplierStatus.Booked ? ok('Supplier line is Booked.') : no('OPS-confirm once the supplier line is Booked (now ' + u.supplierStatus + ').') },
        { description: 'Ready', check: (itn, u) => ok((u.opsReady ? 'Clear' : 'Set') + ' OPS_READY (Ops verified; gates FCA, R-OPS-01).') },
      ],
      async execute(itn, u) { u.opsReady = !u.opsReady; itn._log('ops', 'OPS_READY ' + (u.opsReady ? 'set' : 'cleared') + ' ' + u.id + ' (R-OPS-01)'); } },
    // ADD DOCUMENT — attach an informational document (e.g. a flight ticket, a link to a docs folder) directly to the
    // line. NOT a generated quote/invoice/FCA and NOT part of pending changes: it saves immediately, is never staged
    // and never rides a supplier voucher. No preconditions; allowed even while the line is locked.
    { id: 'addDocument', fn: 'itemAddDocument', category: 'item', ruleId: 'R-DOC-01', description: 'Add Document',
      preconditions: 'A selected line (allowed even when locked). Not part of pending changes — attaches immediately.', outcome: 'Attaches an informational document (title + description/URL) to the line; not staged, not on the supplier voucher.',
      params: schema({ title: fStr('Title', 'Flight Ticket'), description: fStr('Description / URL', DEFAULT_DOC_URL) }, ['title']),
      checks: [
        { description: 'Ready', check: (itn, u) => ok('Attach a document to ' + u.id + ' — saved immediately (not part of a pending change).') },
      ],
      async execute(itn, u, input) {
        const i = input || {};
        const title = (i.title != null && String(i.title).trim() !== '') ? String(i.title) : 'Flight Ticket';
        const description = (i.description != null && String(i.description) !== '') ? String(i.description) : DEFAULT_DOC_URL;
        if (!u.documents) u.documents = [];
        u.documents.push({ id: 'DOC' + itn._nextId(), title, description, at: itn._clk() });
        itn._log('seller', 'attached document "' + title + '" to ' + u.id + ' (R-DOC-01)');
      } },
    // R-CH-24: a sent voucher is one-way — you can't un-send it. To unwind an amendment on a CONFIRMED line you
    // re-issue the ORIGINAL terms as a compensating voucher (supplier reconfirms → back to CONFIRMED); `requested`
    // stays live until they answer. (To unwind a newly-ADDED line whose voucher is out, send a cancellation: Cancel.)
    { id: 'revertAmend', fn: 'itemRevertAmend', category: 'item', ruleId: 'R-CH-24', description: 'Revert amendment',
      preconditions: 'An amended CONFIRMED line (showing the UPDATED label) with the original still on file.', outcome: 'Restores the original terms and re-vouchers them to the supplier on Apply (no silent un-send); supplier reconfirms → CONFIRMED.', params: NO_INPUT,
      // Reachable state: an amended CONFIRMED line whose amended voucher is still out (isUpdated, hasLiveRequest),
      // with the original agreed terms still recorded on `confirmed`. (committed/committedLife are cleared on Apply,
      // so the original SPEC is gone — but `confirmed.fp` + `confirmed.price` survive and carry it.)
      checks: [
        { description: 'Amended CONFIRMED line', check: (itn, u) => {
          if (u.isUpdated && u.hasLiveRequest())
            return ok('Re-issue the ORIGINAL terms as a compensating voucher on Apply (supersedes the amendment); supplier reconfirms → CONFIRMED (R-CH-24).');
          if (u.hasLiveRequest()) return no('A voucher is out for this line — to unwind a newly-added line send a cancellation (Cancel), not a revert (R-CH-24).');
          return no('Only for an amended CONFIRMED line (UPDATED label) whose original is still on file (R-CH-24).');
        } },
      ],
      async execute(itn, u) {
        const orig = JSON.parse(u.confirmed.fp);                 // the original agreed NET spec — survives Apply on `confirmed`; the live spec does not
        itn._ensureChange();                                     // stage the revert in a change (auto-opens if none)
        itn._beginEdit(u, PendingOp.MODIFY);
        u.startDate = orig.startDate; u.endDate = orig.endDate;  // restore the rest of the original fingerprint…
        u.paxIds = [...orig.paxIds]; u.qty = orig.qty || 1;
        if (orig.rateType) u.rateType = { ...orig.rateType };
        Object.keys(orig.rates || {}).forEach((k) => { if (!u.rates[k]) u.rates[k] = { net: 0, rack: 0, sell: null }; u.rates[k].net = orig.rates[k]; });  // restore NET rates (keep rack; sell derived)
        u.promotionIds = deep(orig.promos || []);   // restore the original promo-instance associations (the fingerprint carries them)
        u.itemManualPrice.manualTotalSell = null; u.itemManualPrice.manualMargin = null; u.itemManualPrice.unitOverrides = []; u.itemManualPrice.paxOverrides = []; u.itemManualPrice.validatedNet = null;   // …un-pin the amendment (net restored via the rate card)
        itn._reprice(u);                                         // rebuild the system breakdown → netFigure matches the original confirmed.fp
        u.confirmOnApply = true;                                 // Apply raises + confirms the compensating voucher (R-VC-01)
        itn.recompute(); itn._touchChange();
        itn._log('seller', 'reverted amendment ' + u.id + ' → original terms re-vouchered as a compensating voucher on Apply (R-CH-24)');
      } },
    { id: 'cancel', fn: 'itemCancel', category: 'item', ruleId: 'R-CN-01', description: 'Cancel',
      preconditions: 'A CONFIRMED line ENGAGED with the supplier (requested or confirmed voucher), in an open or auto-opening change. A line with nothing out → use Remove.', outcome: 'Stages CANCEL keeping the item with a fee/refund (refund posts on Apply); cascades to extras.',
      params: schema({ fee: fNum('Cancellation fee retained', 0), refund: fNum('Refund to client', 0) }),
      checks: [
        { description: 'Not staged otherwise', check: (itn, u) => (u.pendingOp && u.pendingOp !== PendingOp.ADD) ? no('Already staged: ' + u.pendingOp + '.') : ok('Not staged as a non-ADD op.') },
        { description: 'Not CANCELLED', check: (itn, u) => u.status === ServiceStatus.CANCELLED ? no('Already CANCELLED.') : ok('Not already CANCELLED.') },
        // Cancel (→ CANCELLED) is for a CONFIRMED line ENGAGED with the supplier (a voucher requested or confirmed)
        // — it tells the supplier to cancel. A line with nothing out (NEW, or CONFIRMED with no voucher) → use Remove.
        { description: 'Engaged supplier', check: (itn, u) => (u.status !== ServiceStatus.CONFIRMED || (u.requested == null && u.confirmed == null)) ? no('Cancel is for a CONFIRMED line with a supplier voucher out/agreed; this has nothing out — use Remove.') : ok('CONFIRMED with a supplier voucher out/agreed.') },
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Cancel goes via a change; ' + itn.offDraftHint() + '.') },
        { description: 'Ready', check: (itn, u) => ok('Stage CANCEL' + ((u.isService() && u.extras.length) ? ' (cascades to extras)' : '') + ' — keeps it (with fee/refund; posts on Apply).') },
      ],
      async execute(itn, u, input) {
        const fee = Number(input && input.fee != null ? input.fee : (u.confirmed != null ? round(u.sellPrice * Constants.CANCEL_FEE_PCT) : 0)) || 0;
        const ref = Number(input && input.refund != null ? input.refund : (u.sellPrice - fee)) || 0;
        itn._ensureChange();
        itn._beginEdit(u, PendingOp.CANCEL); u.cancelIntent = { fee, refund: ref };
        // cascade overrides a staged MODIFY too — an extra must not outlive its cancelled parent (committed snapshot already taken).
        if (u.isService()) u.extras.forEach((e) => { if (!e.pendingOp || e.pendingOp === PendingOp.MODIFY) { itn._beginEdit(e, PendingOp.CANCEL); e.cancelIntent = { fee: 0, refund: 0 }; } });
        itn._touchChange();
        itn._log('seller', 'staged CANCEL ' + u.id + ' fee $' + fee + ' refund $' + ref + ' (refund deferred to Apply)');
      } },
    // TOGGLE: Remove ↔ Restore. While the change is unapplied, a line staged REMOVE can be Restored (the removal is
    // undone — the line returns to its committed baseline); otherwise it stages REMOVE / discards a pending ADD.
    { id: 'removeItem', fn: 'itemRemove', category: 'item', ruleId: 'R-CN-03', description: 'Remove / restore',
      preconditions: 'A line with NOTHING out to the supplier — NEW, or CONFIRMED with requested == null AND confirmed == null — in an open or auto-opening change; a staged MODIFY may be removed too (Restore returns it to MODIFY); a pending-ADD discards immediately. A line already staged REMOVE can be Restored (undo) until the change is applied.', outcome: 'Stages REMOVE (drops on Apply, no fee) / discards a pending ADD, OR restores a line staged REMOVE — back to its committed baseline, or to MODIFY if that is what REMOVE replaced.', params: NO_INPUT,
      checks: [
        { description: 'Stageable', check: (itn) => itn.canStage() ? ok('A change is open or can auto-open.') : no('Remove goes via a change; ' + itn.offDraftHint() + '.') },
        // A staged CANCEL is the only op Remove can't target (it is its own resolution). A staged MODIFY CAN be
        // removed (Remove supersedes the MODIFY; Restore brings the MODIFY back); a staged REMOVE acts as Restore.
        { description: 'Not staged otherwise', check: (itn, u) => (u.pendingOp === PendingOp.CANCEL) ? no('Already staged: CANCEL.') : ok('Removable (incl. a staged MODIFY), or staged REMOVE → restorable.') },
        // Remove / restore is for a line with NOTHING out to the supplier: NEW, or CONFIRMED with no requested/
        // confirmed voucher. A line with a voucher out/agreed → use Cancel; a CANCELLED line is not a Remove target.
        // (When already staged REMOVE the line had nothing out, so this passes — and Restore is always allowed.)
        { description: 'Nothing out', check: (itn, u) => (u.pendingOp === PendingOp.REMOVE) ? ok('Staged REMOVE — Restore undoes it.') : ((u.status === ServiceStatus.CANCELLED || u.confirmed != null || u.requested != null) ? no('Remove is only for a line with no supplier voucher out (NEW, or CONFIRMED with nothing out); this has a voucher — use Cancel.') : ok('No supplier voucher out.')) },
        { description: 'Ready', check: (itn, u) => ok((u.pendingOp === PendingOp.REMOVE) ? ('Restore this line — undo the staged removal' + (u.prevOp === PendingOp.MODIFY ? ' (returns to MODIFY)' : '') + ' (change not yet applied).') : ((u.origin === 'PENDING' && u.pendingOp === PendingOp.ADD) ? 'Discard this newly-added item (exists only in this change).' : 'Stage REMOVE' + (u.pendingOp === PendingOp.MODIFY ? ' (supersedes the staged MODIFY)' : '') + ((u.isService() && u.extras.length) ? ' (cascades to extras)' : '') + ' — drops from itinerary on Apply (no fee).')) },
      ],
      async execute(itn, u) {
        itn._ensureChange();
        // RESTORE: undo a staged REMOVE. A REMOVE that REPLACED a MODIFY (prevOp) returns to MODIFY — the staged spec
        // edits are still on the line, so just flip the op back. Otherwise revert the line to its committed baseline.
        if (u.pendingOp === PendingOp.REMOVE) {
          const restore = (x) => {
            if (x.prevOp === PendingOp.MODIFY) { x.pendingOp = PendingOp.MODIFY; x.prevOp = null; return; }   // back to MODIFY (keep edits)
            if (x.committedLife) { const cl = x.committedLife; x.status = cl.status; x.requested = deep(cl.requested); x.confirmed = deep(cl.confirmed); x.supplierAside = deep(cl.supplierAside) || null; x.qtyLocal = cl.qtyLocal; x.datesLocal = cl.datesLocal; x.paymentTerms = deep(cl.paymentTerms) || null; x.holds = deep(cl.holds) || []; }
            x.pendingOp = null; x.committed = null; x.committedLife = null; x.prevOp = null;
          };
          if (u.isService()) u.extras.forEach((e) => { if (e.pendingOp === PendingOp.REMOVE) restore(e); });
          restore(u);
          itn.recompute(); itn._touchChange(); itn._log('seller', 'restored ' + u.id + ' — undid staged REMOVE');
          return;
        }
        const drop = (x) => { if (x.isService()) itn.items = itn.items.filter((y) => y.id !== x.id); else { const pr = itn.parentOf(x); if (pr) pr.extras = pr.extras.filter((y) => y.id !== x.id); } };
        if (u.origin === 'PENDING' && u.pendingOp === PendingOp.ADD) { drop(u); itn.selectedId = null; itn.recompute(); itn._touchChange(); itn._log('seller', 'discarded added item ' + u.id); return; }
        u.prevOp = u.pendingOp || null;                            // remember a superseded MODIFY so Restore returns to it
        itn._beginEdit(u, PendingOp.REMOVE);
        // cascade overrides a staged MODIFY too — an extra must not outlive its removed parent (remembers its own prevOp).
        if (u.isService()) u.extras.forEach((e) => { if (!e.pendingOp || e.pendingOp === PendingOp.MODIFY) { e.prevOp = e.pendingOp || null; itn._beginEdit(e, PendingOp.REMOVE); } });
        itn._touchChange(); itn._log('seller', 'staged REMOVE ' + u.id + (u.prevOp === PendingOp.MODIFY ? ' (superseded MODIFY)' : ' (NEW line, no fee)'));
      } },

    /* ---- voucher (per-supplier, all-or-nothing) ---- */
    { id: 'voucherConfirm', fn: 'voucherConfirm', category: 'voucher', ruleId: 'R-VC-01', description: 'Confirm voucher',
      preconditions: 'A voucher (any status — re-answerable); the supplier provides a booking ref on the first confirm.', outcome: 'ALL lines confirm at once (CANCEL lines apply, CONFIRM lines book); payment terms copied on first service confirm.',
      params: () => schema({ voucherId: fStr('Voucher id', ''), bookingId: fStr('Supplier booking ref (first confirm only)', 'BK-' + Math.floor(Math.random() * 1e6).toString().padStart(6, '0')) }, ['voucherId']),
      checks: [
        { description: 'Confirmable voucher', check: (itn, u, input) => {
          const id = input && input.voucherId;
          if (!id) return ok('Supplier confirms a voucher (all lines, all-or-nothing — R-VC-01).');
          const v = itn.voucherById(id); if (!v) return no('No such voucher.');
          if (!itn.supplierBookings[v.supplierId] && !(input && input.bookingId)) return ok('Confirm — provide a booking ref (first booking for ' + Suppliers[v.supplierId].name + ').');
          return ok('Supplier confirms voucher ' + id + ' → all lines CONFIRMED/CANCELLED (R-VC-01).');
        } },
      ],
      async execute(itn, u, input) {
        const v = itn.voucherById(input && input.voucherId);
        if (!v) return no('No such voucher.');
        itn._confirmVoucher(v, input && input.bookingId);
      } },
    { id: 'voucherReject', fn: 'voucherReject', category: 'voucher', ruleId: 'R-VC-02', description: 'Reject voucher',
      preconditions: 'A voucher (any status — re-answerable); a reject comment is required.', outcome: 'ALL lines reject at once → CONFIRM items surface supplier status Rejected (resolve per item: reinstate / replace / drop).',
      params: schema({ voucherId: fStr('Voucher id', ''), comment: fStr('Supplier reject comment (required)', 'No availability for the requested dates') }, ['voucherId', 'comment']),
      checks: [
        { description: 'Rejectable voucher', check: (itn, u, input) => {
          const id = input && input.voucherId;
          if (!id) return ok('Supplier rejects a voucher (all lines; comment required — R-VC-02).');
          const v = itn.voucherById(id); if (!v) return no('No such voucher.');
          // A pure-cancellation voucher (every line a CANCEL) is a notice, not a request — the supplier can only
          // confirm (acknowledge) it. Reject applies to a request with something to confirm (a mixed voucher reject
          // sends its cancel lines to REJECTED too).
          if (v.lines.length && v.lines.every((l) => l.action === LineAction.CANCEL)) return no('A cancellation voucher is a notice — the supplier can only confirm it.');
          return ok('Supplier rejects voucher ' + id + ' → all lines REJECTED (comment required, R-VC-02).');
        } },
      ],
      async execute(itn, u, input) {
        const v = itn.voucherById(input && input.voucherId);
        if (!v) return no('No such voucher.');
        const comment = (input && input.comment) || ''; if (!comment) return no('A supplier reject comment is required (R-VC-02).');
        if (v.lines.length && v.lines.every((l) => l.action === LineAction.CANCEL)) return no('A cancellation voucher is a notice — the supplier can only confirm it.');
        v.status = VoucherStatus.REJECTED; v.comment = comment; v.resolvedAt = itn._clk();
        v.lines.forEach((line) => {
          line.state = 'REJECTED';
          const it = itn.findItem(line.itemId); if (!it) return;
          // all-or-nothing: every answered line goes REJECTED. The item STATUS is unchanged (it keeps its intent:
          // CONFIRMED, or CANCELLED for a refused cancellation); supplier status derives Rejected from the request.
          if (line.action === LineAction.CANCEL) {
            if (it.requested && it.requested.voucherId === v.id) it.requested.state = 'REJECTED';
            return;
          }
          // CONFIRM line: drive the item to supplier status Rejected regardless of prior state. A SENT-voucher
          // reject already has a live request → flip it. A re-answer of a CONFIRMED voucher has requested===null and
          // confirmed set → synthesize a rejected request from the line and clear confirmed so it's no longer Booked.
          if (it.requested) it.requested.state = 'REJECTED';
          else { it.requested = { fp: line.fp, price: line.price, ver: line.ver, state: 'REJECTED', voucherId: v.id }; it.confirmed = null; }
        });
        itn._log('supplier', 'rejected voucher ' + v.id + ' (' + Suppliers[v.supplierId].name + '): ' + comment + ' → supplier status Rejected (resolve per item, R-VC-02)');
        itn._freezeChangeOnRejection();                          // a rejection freezes the open change back to DRAFT
      } },
    { id: 'voucherConfirmPrior', fn: 'voucherConfirmPrior', category: 'voucher', ruleId: 'R-IF-06', description: 'Supplier confirms superseded voucher',
      preconditions: 'A superseded voucher still unanswered (the prior-version race).', outcome: 'Supplier status note on each line; the supplier may bill the prior version.',
      params: schema({ voucherId: fStr('Voucher id', '') }, ['voucherId']),
      checks: [
        { description: 'Outstanding superseded voucher', check: (itn, u, input) => {
          const id = input && input.voucherId;
          if (!id) return ok('Acknowledge a superseded voucher the supplier still answered (R-IF-06).');
          const v = itn.voucherById(id); if (!v) return no('No such voucher.');
          return v.isPriorRace() ? ok('Late race: supplier confirms superseded voucher ' + id + ' → supplier status note (R-IF-06).') : no('Not an outstanding superseded voucher.');
        } },
      ],
      async execute(itn, u, input) {
        const v = itn.voucherById(input && input.voucherId); if (!v || !v.isPriorRace()) return no('Not an outstanding superseded voucher.');
        v.resolvedAt = itn._clk();
        v.lines.forEach((line) => { const it = itn.findItem(line.itemId); if (it) it.supplierAside = { state: 'CONFIRMED', ver: line.ver, ctx: 'PRIOR_VERSION', at: itn._clk() }; });
        itn._log('supplier', 'confirmed PRIOR voucher ' + v.id + ' → note; supplier may bill the original (R-IF-06)');
      } },
    { id: 'voucherRejectPrior', fn: 'voucherRejectPrior', category: 'voucher', ruleId: 'R-IF-06', description: 'Supplier rejects superseded voucher',
      preconditions: 'A superseded voucher still unanswered (the prior-version race).', outcome: 'Benign supplier status note on each line.',
      params: schema({ voucherId: fStr('Voucher id', '') }, ['voucherId']),
      checks: [
        { description: 'Outstanding superseded voucher', check: (itn, u, input) => {
          const id = input && input.voucherId;
          if (!id) return ok('Acknowledge a superseded voucher the supplier rejected (R-IF-06).');
          const v = itn.voucherById(id); if (!v) return no('No such voucher.');
          return v.isPriorRace() ? ok('Late race: supplier rejects superseded voucher ' + id + ' → benign note (R-IF-06).') : no('Not an outstanding superseded voucher.');
        } },
      ],
      async execute(itn, u, input) {
        const v = itn.voucherById(input && input.voucherId); if (!v || !v.isPriorRace()) return no('Not an outstanding superseded voucher.');
        v.resolvedAt = itn._clk();
        v.lines.forEach((line) => { const it = itn.findItem(line.itemId); if (it) it.supplierAside = { state: 'REJECTED', ver: line.ver, ctx: 'PRIOR_VERSION', at: itn._clk() }; });
        itn._log('supplier', 'rejected PRIOR voucher ' + v.id + ' → benign note (R-IF-06)');
      } },

    /* ---- supplier payment + lock (money paid OUT to a supplier locks the supplier; FIN unlocks it) ---- */
    { id: 'addSupplierPayment', fn: 'supplierAddPayment', category: 'voucher', ruleId: 'R-LK-01', description: 'Add Supplier Payment',
      preconditions: 'A supplier with at least one CONFIRMED voucher.', outcome: 'Records a payment to the supplier and LOCKS the supplier — every one of its itinerary lines locks (only a FIN user can Unlock).',
      params: schema({ supplierId: fStr('Supplier id', ''), amount: fNum('Amount', 0), comment: fStr('Comment', '') }, ['supplierId', 'amount']),
      checks: [
        { description: 'Supplier with confirmed voucher', check: (itn, u, input) => {
          const sup = input && input.supplierId;
          if (!sup) return ok('Record a payment to a supplier — needs a confirmed voucher; locks the supplier (R-LK-01).');
          if (!Suppliers[sup]) return no('No such supplier "' + sup + '".');
          return itn.hasConfirmedVoucher(sup)
            ? ok('Record a payment to ' + Suppliers[sup].name + ' → locks the supplier and its lines (R-LK-01).')
            : no('Add a payment once the supplier has at least one CONFIRMED voucher (R-LK-01).');
        } },
      ],
      async execute(itn, u, input) {
        const sup = input && input.supplierId; if (!Suppliers[sup]) return no('No such supplier "' + sup + '".');
        if (!itn.hasConfirmedVoucher(sup)) return no('Supplier has no confirmed voucher yet (R-LK-01).');
        const amount = Number(input && input.amount) || 0;
        const comment = (input && input.comment) || '';
        itn.supplierPayments.push({ supplierId: sup, amount, comment, at: itn._clk() });
        itn.lockSupplier(sup);
        itn._log('finance', 'supplier payment $' + amount + ' → ' + Suppliers[sup].name + (comment ? ' (' + comment + ')' : '') + ' → ' + Suppliers[sup].name + ' LOCKED (R-LK-01)');
      } },
    // Lock lives on the SUPPLIER: it sets the supplier lock and cascades, locking every one of its lines. Any user may
    // lock (it protects the engaged supplier); only FIN can Unlock. A payment locks automatically; this is the manual lever.
    { id: 'lockSupplier', fn: 'supplierLock', category: 'voucher', ruleId: 'R-LK-01', description: 'Lock supplier',
      preconditions: 'A supplier with at least one CONFIRMED voucher that is not already locked.', outcome: 'Locks the supplier and all of its itinerary lines (blocks every item action until a FIN user unlocks it).',
      params: schema({ supplierId: fStr('Supplier id', '') }, ['supplierId']),
      checks: [
        { description: 'Lockable supplier', check: (itn, u, input) => {
          const sup = input && input.supplierId;
          if (!sup) return ok('Lock a supplier → freezes all its lines (R-LK-01).');
          if (!Suppliers[sup]) return no('No such supplier "' + sup + '".');
          if (itn.supplierLocked(sup)) return no(Suppliers[sup].name + ' is already locked.');
          return itn.hasConfirmedVoucher(sup)
            ? ok('Lock ' + Suppliers[sup].name + ' and all its lines (R-LK-01).')
            : no('Lock a supplier once it has at least one CONFIRMED voucher (R-LK-01).');
        } },
      ],
      async execute(itn, u, input) {
        const sup = input && input.supplierId; if (!Suppliers[sup]) return no('No such supplier "' + sup + '".');
        if (itn.supplierLocked(sup)) return no(Suppliers[sup].name + ' is already locked.');
        if (!itn.hasConfirmedVoucher(sup)) return no('Supplier has no confirmed voucher yet (R-LK-01).');
        itn.lockSupplier(sup);
        itn._log('finance', 'locked ' + Suppliers[sup].name + ' + its lines (' + (itn.currentUser ? itn.currentUser.name : '?') + ', R-LK-01)');
      } },
    // Unlock lives on the SUPPLIER: it clears the supplier lock and cascades, unlocking every one of its lines. FIN-only.
    { id: 'unlockSupplier', fn: 'supplierUnlock', category: 'voucher', ruleId: 'R-LK-01', description: 'Unlock supplier',
      preconditions: 'A LOCKED supplier; only a Finance user (currentUser.role FIN) may unlock.', outcome: 'Unlocks the supplier and all of its itinerary lines.',
      params: schema({ supplierId: fStr('Supplier id', '') }, ['supplierId']),
      checks: [
        { description: 'Unlockable supplier (FIN)', check: (itn, u, input) => {
          const sup = input && input.supplierId;
          if (!sup) return ok('Unlock a supplier (Finance only) → unlocks all its lines (R-LK-01).');
          if (!Suppliers[sup]) return no('No such supplier "' + sup + '".');
          if (!itn.supplierLocked(sup)) return no(Suppliers[sup].name + ' is not locked.');
          if (!itn.currentUser || itn.currentUser.role !== UserRole.FIN) return no('Only a Finance (FIN) user can unlock — switch user in the header.');
          return ok('Unlock ' + Suppliers[sup].name + ' and all its lines (Finance override, R-LK-01).');
        } },
      ],
      async execute(itn, u, input) {
        const sup = input && input.supplierId; if (!Suppliers[sup]) return no('No such supplier "' + sup + '".');
        if (!itn.supplierLocked(sup)) return no(Suppliers[sup].name + ' is not locked.');
        if (!itn.currentUser || itn.currentUser.role !== UserRole.FIN) return no('Only a Finance (FIN) user can unlock (R-LK-01).');
        itn.unlockSupplier(sup);
        itn._log('finance', 'unlocked ' + Suppliers[sup].name + ' + its lines (' + itn.currentUser.name + ', R-LK-01)');
      } },

    /* ---- documents (generated quotes & invoices) ---- */
    { id: 'quoteMarkSent', fn: 'quoteMarkSent', category: 'document', ruleId: 'R-DOC-01', description: 'Mark As Sent',
      preconditions: 'A generated quote (always available).', outcome: 'Flags the quote as sent to the client.',
      params: schema({ id: fStr('Quote id', '') }, ['id']),
      checks: [
        { description: 'Available', check: () => ok('Mark this quote as sent to the client.') },
      ],
      async execute(itn, u, input) { const q = (itn.quotes || []).find((x) => x.id === (input && input.id)); if (q) { q.sent = true; itn._log('seller', 'quote ' + q.id + ' marked as sent to client'); } } },
    { id: 'invoiceMarkSent', fn: 'invoiceMarkSent', category: 'document', ruleId: 'R-DOC-01', description: 'Mark As Sent',
      preconditions: 'A generated invoice (always available).', outcome: 'Flags the invoice as sent to the client.',
      params: schema({ id: fStr('Invoice id', '') }, ['id']),
      checks: [
        { description: 'Available', check: () => ok('Mark this invoice as sent to the client.') },
      ],
      async execute(itn, u, input) { const iv = (itn.invoices || []).find((x) => x.id === (input && input.id)); if (iv) { iv.sent = true; itn._log('seller', 'invoice ' + iv.id + ' marked as sent to client'); } } },
    { id: 'fcaMarkSent', fn: 'fcaMarkSent', category: 'document', ruleId: 'R-DOC-01', description: 'Mark As Sent',
      preconditions: 'A generated FCA (always available).', outcome: 'Flags the FCA as sent to the client.',
      params: schema({ id: fStr('FCA id', '') }, ['id']),
      checks: [
        { description: 'Available', check: () => ok('Mark this FCA as sent to the client.') },
      ],
      async execute(itn, u, input) { const f = (itn.fcas || []).find((x) => x.id === (input && input.id)); if (f) { f.sent = true; itn._log('seller', 'FCA ' + f.id + ' marked as sent to client'); } } },
  ];

  /* ======================================================================
   * 8a. View registry — the CQRS query side, the read-model mirror of
   *     ACTION_REGISTRY. getViews() materialises bound descriptors with the
   *     SAME object shape as getActions() (id/fn/scope/description/params/…),
   *     so an API layer can enumerate queries the way it enumerates commands.
   *     Each entry's query(itn,u,input) DELEGATES to an existing read-model
   *     method — no logic moves here, the registry is a self-describing index
   *     (just as getActions() indexes the real {fn}Exec methods). Queries are
   *     unconditional + side-effect free, so there is no checks/isAllowed/
   *     execute — only `query`. `fn` is the method base: {fn}Query is generated.
   *       scope ∈ itinerary | item | pax | change  (the query analogue of category)
   *       params  — FILTER schema (itemId/paxId), reuses schema()/fStr/fEnum
   *       reads   — prose "what it returns" (the query analogue of outcome)
   *       returns — descriptive result-shape hint ('object'|'array'|'string')
   * ==================================================================== */
  const VIEW_REGISTRY = [
    /* ---- itinerary scope ---- */
    { id: 'summary', fn: 'itnySummary', scope: 'itinerary', ruleId: 'V-ITN-01', description: 'Itinerary summary',
      reads: 'Overview header: status ladder + terminals, totals (committed/projected/change), pending-change status, next milestone, travel + supplier-status rollup, flags.',
      params: NO_INPUT, returns: 'object', query: (itn) => itn.summary() },
    { id: 'projection', fn: 'itnyProjection', scope: 'itinerary', ruleId: 'V-ITN-02', description: 'Full projection',
      reads: 'The complete CQRS read-model snapshot — header + totals + deposit + milestones + pax + payments + quotes/invoices/fcas + items + vouchers + suppliers + promotions + continuity.',
      params: NO_INPUT, returns: 'object', query: (itn) => itn.projection() },
    { id: 'dbDocument', fn: 'itnyDbDocument', scope: 'itinerary', ruleId: 'V-ITN-03', description: 'DB document',
      reads: 'Persistence-layer snapshot: baseline items + active change set + vouchers + payments + deposit + milestones + embedded summary.',
      params: NO_INPUT, returns: 'object', query: (itn) => itn.dbDocument() },
    { id: 'items', fn: 'itnyItems', scope: 'itinerary', ruleId: 'V-ITN-04', description: 'Items list',
      reads: 'Every service/extra line as a projection (name, type, supplier, dates, pax, price, status, commercial triple, holds, promotions, documents).',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.projection().items },
    { id: 'paxes', fn: 'itnyPaxes', scope: 'itinerary', ruleId: 'V-ITN-05', description: 'Paxes list',
      reads: 'Every traveller (id, name, tag, group, age, pending/remove flags).',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.projection().pax },
    { id: 'suppliers', fn: 'itnySuppliers', scope: 'itinerary', ruleId: 'V-ITN-06', description: 'Suppliers',
      reads: 'Per-supplier rollup: booking ref, vouchers + latest status, confirmed payment terms, lock state, payment totals (total/paid/due/dueDate).',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.supplierView() },
    { id: 'vouchers', fn: 'itnyVouchers', scope: 'itinerary', ruleId: 'V-ITN-07', description: 'Vouchers',
      reads: 'Every voucher as a projection: supplier, version, status, booking id, supersedes/superseded chain, lines (item/action/price/terms).',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.voucherView() },
    { id: 'milestones', fn: 'itnyMilestones', scope: 'itinerary', ruleId: 'V-ITN-08', description: 'Payment schedule',
      reads: 'Client payment milestone timeline: deposit + custom milestones + outstanding residual, each with due day, kind, amount, %, paid state.',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.milestoneSchedule() },
    { id: 'continuity', fn: 'itnyContinuity', scope: 'itinerary', ruleId: 'V-ITN-09', description: 'Continuity / allocation',
      reads: 'Day-by-day location + gap analysis for the allocation grid: dates, day/night place, accommodation-gap nights, transport-gap days, transfer routes.',
      params: NO_INPUT, returns: 'object', query: (itn) => itn.continuity() },
    { id: 'promotions', fn: 'itnyPromotions', scope: 'itinerary', ruleId: 'V-ITN-10', description: 'Promotions',
      reads: 'Selected promo instances + catalog templates, each with live match evaluation (matched/why, members, candidates, multi-service).',
      params: NO_INPUT, returns: 'object', query: (itn) => itn.promotionsView() },
    { id: 'unmatchedPromotions', fn: 'itnyUnmatchedPromotions', scope: 'itinerary', ruleId: 'V-ITN-11', description: 'Unmatched promotions',
      reads: 'Advisory: selected promo instances that no longer match any member line (shown in the pending-changes panel; never blocks Apply).',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.unmatchedPromotions() },
    /* ---- change scope ---- */
    { id: 'changeEdits', fn: 'changeEdits', scope: 'change', ruleId: 'V-CHG-01', description: 'Staged edits',
      reads: 'The edit-list of the open pending change: per-unit op (ADD/MODIFY/CANCEL/REMOVE), before/after, cancel intent, lifecycle.',
      params: NO_INPUT, returns: 'array', query: (itn) => itn.changeEdits() },
    /* ---- item scope (target = selected line) ---- */
    { id: 'itemView', fn: 'itemView', scope: 'item', ruleId: 'V-ITM-01', description: 'Item view',
      reads: 'Full projection of the selected line: spec, price (system/manual/total), status, commercial triple, holds, promotions, documents, supplier payment.',
      params: NO_INPUT, returns: 'object', query: (itn, u) => (u ? itn._itemView(u) : null) },
    { id: 'itemPromotions', fn: 'itemPromotions', scope: 'item', ruleId: 'V-ITM-02', description: 'Item promotions',
      reads: 'Promos for the selected line: selected instances + other supplier instances + catalog templates (with match eval), and the toggle-state colour hint.',
      params: NO_INPUT, returns: 'object', query: (itn, u) => (u ? itn.promotionsForItem(u) : null) },
    { id: 'stagedDiff', fn: 'itemStagedDiff', scope: 'item', ruleId: 'V-ITM-03', description: 'Staged diff',
      reads: 'Field-level before/after for the selected line in the open change (empty when the line has no committed baseline).',
      params: NO_INPUT, returns: 'array', query: (itn, u) => (u ? itn.stagedDiff(u) : []) },
    { id: 'appliedPromos', fn: 'itemAppliedPromos', scope: 'item', ruleId: 'V-ITM-04', description: 'Applied promos',
      reads: 'Matched promotions on the selected line (shown on documents + vouchers): id, name, manual?, matched, amount, benefits, member count.',
      params: NO_INPUT, returns: 'array', query: (itn, u) => (u ? itn._appliedPromos(u) : []) },
    /* ---- pax scope ---- */
    { id: 'paxRoute', fn: 'paxRoute', scope: 'pax', ruleId: 'V-PAX-01', description: 'Pax route',
      reads: 'One traveller\'s journey as ribbons: stays, transfers and gaps in date order.',
      params: schema({ paxId: fStr('Pax id', '') }, ['paxId']), returns: 'array',
      query: (itn, u, input) => itn.paxRoute(input && input.paxId) },
  ];

  /* ---- backward-compat delegators ------------------------------------------
   * Each action's logic now lives ONCE, inline in its ACTION_REGISTRY entry
   * (isAllowed/execute). For ergonomics + back-compat, install thin prototype
   * shims `{category}{Name}Enabled(u)` / `{category}{Name}Exec(u, input)` that
   * simply forward to the registry. The shims hold NO logic — the registry is
   * the single source of truth. happyPath() and the tests call these. -------- */
  // SELLER item actions that may only be performed within a pending change. The voucher-panel answers
  // (voucher confirm/reject, prior-voucher answers) stay FREE — a third party's all-or-nothing answer on a
  // voucher cannot depend on the seller's change state; holds + ops-ready are exempt too (pre-/post-commercial).
  ['markAwaiting', 'newItem', 'revertAmend']
    .forEach((id) => { const a = ACTION_REGISTRY.find((x) => x.id === id); if (a) a.changeOnly = true; });
  // Item actions still allowed on a LOCKED line (the supplier payment lock closes everything else): OPS-ready toggle
  // (Ops verification is orthogonal to finance) and Add Document (an informational attachment, not a commercial edit).
  const LOCK_EXEMPT = ['opsReady', 'addDocument'];

  /* ---- brochure mode — ONE source of truth for which actions a BROCHURE itinerary allows/shows.
   *      A brochure only builds (DRAFT↔PREPARED): the commercial machinery (suppliers/vouchers,
   *      payments, documents) and the post-PREPARED transitions are off. ---- */
  // The ONLY itny actions a brochure permits (everything else in the itny category is blocked + hidden).
  const BROCHURE_ITNY_ALLOWED = ['addService', 'addTraveller', 'removeTraveller', 'editPax', 'revert', 'prepare', 'convertToItinerary'];
  // Item actions a brochure does NOT permit (status confirm/cancel + supplier holds). Other line edits stay.
  const BROCHURE_ITEM_BLOCKED = ['markAwaiting', 'cancel', 'hold'];
  // Categories that belong to the hidden sections (Suppliers & vouchers / Documents).
  const BROCHURE_BLOCKED_CATEGORIES = ['voucher', 'document'];
  // The blocking verdict for an action under brochure mode, or null if it's allowed (or we're not a brochure).
  // pendingChanges stays free — building in DRAFT auto-opens a draft change whose Apply/Cancel must work.
  const brochureBlock = (itn, a) => {
    if (!itn.isBrochure()) return null;
    if (a.category === 'itny') return BROCHURE_ITNY_ALLOWED.includes(a.id) ? null : no('Not available for a Brochure — only build, → DRAFT/PREPARED and Create Itinerary (create it first).');
    if (a.category === 'item') return BROCHURE_ITEM_BLOCKED.includes(a.id) ? no('Not available for a Brochure — no supplier holds or status confirm/cancel (create the itinerary first).') : null;
    if (BROCHURE_BLOCKED_CATEGORIES.includes(a.category)) return no('Not available for a Brochure — suppliers/vouchers & documents are off (create the itinerary first).');
    return null;
  };
  // View hint: whether an action is hidden from the UI surfaces. A brochure hides everything brochureBlock refuses;
  // Convert-to-Itinerary is the inverse — only ever shown for a brochure (hidden on a BOOKING itinerary, per spec).
  const isHidden = (itn, a) => {
    if (a.hidden) return true;
    if (a.id === 'convertToItinerary') return !itn.isBrochure();
    return !!brochureBlock(itn, a);
  };

  /* ---- shared action gates — ONE implementation for BOTH public surfaces (getActions descriptors
   *      and the prototype shims), so the guards can never drift apart again. ---- */
  // Enablement gate: selection / CANCELLED / change-gating, then the action's own isAllowed. A CANCELLED line is
  // closed to seller actions while its cancel-ask is still out (the SUPPLIER answers it via voucherConfirm/
  // voucherReject) and once it resolves; a REFUSED cancellation (supplier status Rejected) falls through so the
  // seller can resolve it. changeOnly is only hard-blocked when no change is open AND none can auto-open here
  // (DRAFT/VOUCHERED/CONFIRMED, not locked).
  const gateAllowed = (itn, a, u, input) => {
    // Evaluate EVERY applicable gate (no short-circuit) so the per-action checklist can show all of them; the
    // returned aggregate's headline (ok/why/gated) is still the FIRST failing check in this exact order — the
    // same verdict the old short-circuiting chain returned. `runAction` only gates the cases where running the
    // action's own isAllowed would be unsafe or meaningless (a brochure-blocked action, or no selected item).
    const checks = [];
    // Brochure mode trumps everything: a brochure only builds (DRAFT↔PREPARED); the rest is off until converted.
    const bb = brochureBlock(itn, a);
    if (itn.isBrochure()) checks.push(bb ? Object.assign({}, bb, { label: 'Brochure' }) : ok('Allowed in this brochure.', 'Brochure'));
    let runAction = !bb;
    if (a.category === 'item') {
      if (!u) { checks.push(no('Select a service or extra first.', 'Selection')); runAction = false; }
      else {
        checks.push(ok('A service or extra is selected.', 'Selection'));
        // A LOCKED line (its supplier is locked) is closed to every item action EXCEPT the lock-exempt ones (OPS-ready,
        // Add Document). Unlock lives on the supplier (FIN-only), not the line. Ordered first among the line gates so it trumps the status/cancel gates below.
        checks.push((u.locked && !LOCK_EXEMPT.includes(a.id)) ? no('Line is LOCKED — its supplier is locked; a Finance (FIN) user must Unlock the supplier.', 'Line lock') : ok(u.locked ? 'Line is locked, but this action is allowed while locked.' : 'Line is not locked.', 'Line lock'));
        // A CANCELLED line is TERMINAL once the supplier is engaged (a voucher is out / agreed) — you can't switch its
        // status. A confirmed cancellation RECORDS confirmed (_confirmVoucher), so a booked cancellation is engaged and
        // therefore terminal — a confirmed cancellation is final. (The nothing-out branch is a defensive fallback only.)
        if (u.status === ServiceStatus.CANCELLED && (u.confirmed != null || u.requested != null)) {
          checks.push((u.requested && u.requested.state === 'AWAITING')
            ? no('Cancellation is out to the supplier — awaiting their answer (confirm/reject the voucher).', 'Cancellation')
            : no('Item is CANCELLED with supplier engagement — terminal, no further status changes.', 'Cancellation'));
        } else checks.push(ok('Line is not a terminal cancellation.', 'Cancellation'));
      }
    }
    // While a supplier rejection is unresolved, the pending change is FROZEN to DRAFT — only Cancel / discard is
    // available. The seller must resolve every rejected line via its item actions (Confirm / re-request / Cancel),
    // or discard the change. (Item actions stay free — that's how the rejection gets resolved.)
    if (a.category === 'pendingChanges' && a.id !== 'cCancel' && itn.inChange() && !itn.isCancelling() && itn.unresolvedRejection())
      checks.push(gated('Unresolved supplier rejection — resolve every rejected line (Confirm / re-request / Cancel) or discard the change. Only Cancel is available until then.', 'Rejection freeze'));
    // The itinerary cannot advance through its lifecycle (prepare → quote → accept → invoice → voucher → confirm)
    // while any line is rejected — resolve every rejection first.
    if (a.category === 'itny' && ['prepare', 'toQuoted', 'accept', 'toInvoiced', 'voucher', 'confirm'].includes(a.id) && itn.unresolvedRejection())
      checks.push(gated('A supplier rejection is unresolved — resolve every rejected line before advancing the itinerary.', 'Rejection gate'));
    if (a.changeOnly && !itn.inChange() && !itn.canAutoOpenChange()) checks.push(no('Available within a pending change only (open a change first).', 'Change required'));
    // The action's own rule(s). A compound body returns an allChecks(...) aggregate whose `.checks` flatten in
    // here; a single-verdict body contributes one check (labelled "Rule" so it reads in the breakdown).
    if (runAction) {
      let v;
      if (a.checks) {                                                  // collection-of-checks authoring → derive the verdict
        try { v = runActionChecks(itn, a, u, input); } catch (e) { v = no('error: ' + e.message, 'Rule'); }
      } else {                                                         // legacy hand-written isAllowed
        try { v = a.isAllowed(itn, u, input || {}); } catch (e) { v = no('error: ' + e.message, 'Rule'); }
        if (v && !v.checks && !v.label) v = Object.assign({}, v, { label: 'Rule' });
      }
      checks.push(v);
    }
    return allChecks(...checks);
  };
  // Execution gate: an exec refuses exactly what isAllowed refuses (returns the blocking {ok:false, why}
  // instead of mutating), then auto-creates the pending change a changeOnly action needs and runs.
  const gateExec = (itn, a, u, input) => {
    const verdict = gateAllowed(itn, a, u, input);
    if (!verdict.ok) return Promise.resolve(verdict);
    if (a.changeOnly && !itn.inChange()) itn._ensureChange();
    return Promise.resolve(a.execute(itn, u, input || {}));
  };

  ACTION_REGISTRY.forEach((a) => {
    Itinerary.prototype[a.fn + 'Enabled'] = function (u, input) { return gateAllowed(this, a, u, input); };
    Itinerary.prototype[a.fn + 'Exec'] = function (u, input) { return gateExec(this, a, u, input); };
  });

  // Query side: install a thin `{fn}Query(u, input)` read method per view. Item-scope views target
  // the passed line (else the selected one); no gate — queries are always allowed + side-effect free.
  VIEW_REGISTRY.forEach((v) => {
    Itinerary.prototype[v.fn + 'Query'] = function (u, input) {
      const target = v.scope === 'item' ? (u || this.selected()) : undefined;
      return v.query(this, target, input || {});
    };
  });

  /* ======================================================================
   * 8b. LIFECYCLES — the SINGLE source of truth for itny.lifecycle.html.
   *     Ladders, terminal sets, item/change states, scope mapping, section
   *     leads and branch notes all live here (next to the code) so the
   *     reference page is a pure renderer. Edit behaviour in itny.js → edit
   *     the matching note here in the same file; the page follows. The live
   *     matrices / catalogue / JSON examples are still generated from
   *     getActions() + driven scenarios, so those never need touching.
   * ==================================================================== */
  const LIFECYCLES = {
    overview: {
      lead: 'The model has <b>three</b> intertwined lifecycles. The <b>itinerary</b> is the client-facing spine. <b>Every</b> edit routes through a <b>pending change</b> — auto-opening as an Apply/Cancel-only <b>PreBookingModif</b> in DRAFT, or a full-flow <b>PostBookingModif</b> once VOUCHERED+. Each <b>item</b> (service/extra) runs its own hold→voucher→confirm path. Supplier status ties each item’s commercial figures to what the supplier has actually agreed.',
      cards: [
        { cat: 'itny', h: 'Itinerary', body: 'Status ladder DRAFT→…→CONFIRMED (+ LOST/SUPERSEDED/CANCELLED). Owns quote/invoice/payment and the voucher/confirm gates.' },
        { cat: 'pendingChanges', h: 'Change', body: 'A reversible amendment. <b>PreBookingModif</b> (pre-VOUCHERED) is Apply/Cancel only; <b>PostBookingModif</b> (VOUCHERED+) runs its own DRAFT→…→INVOICED→Apply cycle (supplier vouchers are raised at Apply).' },
        { cat: 'item', h: 'Service / extra', body: 'NEW (arranging holds) then supplier voucher (target/requested/confirmed → supplier status) → CONFIRMED/CANCELLED. Always edited through a staged change.' },
      ],
    },
    itinerary: {
      lead: 'The client-facing spine. A seller drives the itinerary down the ladder; money and supplier vouchers gate the late steps. Three terminal states sit off to the side — two of them re-openable. The transition map below lists EVERY edge, including the back-edges (revert / reopen) and the routes into each terminal.',
      ladder: ItineraryFlow,
      terminal: [{ key: 'LOST', sub: 'agent gone' }, { key: 'SUPERSEDED', sub: 'other option' }, { key: 'CANCELLED', sub: 'booking voided' }],
      // Every state-transition edge — forward ladder, back-edges (revert/reopen) and the routes into the three terminals.
      // kind ∈ { fwd, back, term } drives the colouring in the reference's transition map.
      transitions: [
        { from: 'DRAFT', to: 'PREPARED', via: 'Prepare', kind: 'fwd', pre: 'At least one billable service on the itinerary.' },
        { from: 'PREPARED', to: 'QUOTED', via: '→ QUOTED (quote issued)', kind: 'fwd', pre: 'A Quote document has been generated.' },
        { from: 'QUOTED', to: 'APPROVED', via: 'Accept', kind: 'fwd', pre: 'Client / agent approved the quote.' },
        { from: 'APPROVED', to: 'INVOICED', via: '→ INVOICED (invoice issued · deposit requested)', kind: 'fwd', pre: 'An Invoice document has been generated (sets deposit requested).' },
        { from: 'INVOICED', to: 'VOUCHERED', via: 'Send Vouchers (payment collected or credit-terms)', kind: 'fwd', pre: 'Client payment collected, or agency credit-terms are on.' },
        { from: 'VOUCHERED', to: 'CONFIRMED', via: 'Confirm (every billable line booked)', kind: 'fwd', pre: 'Every billable line CONFIRMED by its supplier.' },
        { from: 'PREPARED / QUOTED / APPROVED / INVOICED', to: 'DRAFT', via: 'Revert (voids quote/invoice; any payment kept as client credit)', kind: 'back', pre: 'A pre-VOUCHERED step and not finance-locked.' },
        { from: 'DRAFT / PREPARED / QUOTED / APPROVED / INVOICED', to: 'LOST', via: 'Mark Lost (agent rejected/silent)', kind: 'term', pre: 'Any pre-VOUCHERED step; the agent rejected or went silent.' },
        { from: 'any pre-CONFIRMED step (no line yet AWAITING/CONFIRMED by a supplier)', to: 'SUPERSEDED', via: 'Mark Superseded (another option in the inquiry won)', kind: 'term', pre: 'Pre-CONFIRMED with no line yet AWAITING / CONFIRMED by a supplier.' },
        { from: 'VOUCHERED / CONFIRMED', to: 'CANCELLED', via: 'Cancel itinerary (cancellation change → Apply · fees/refund/credit-note)', kind: 'term', pre: 'VOUCHERED or CONFIRMED; raised via a cancellation change that is then applied.' },
        { from: 'LOST / SUPERSEDED', to: 'DRAFT', via: 'Reopen (audited exception, R-LC-13)', kind: 'back', pre: 'Audited exception only (R-LC-13).' },
      ],
      notes: [
        { h: '↩ Revert &amp; reopen', body: '<b>Revert:</b> <code>PREPARED/QUOTED/APPROVED/INVOICED</code> → back to <code>DRAFT</code> (voids quote/invoice; allowed even once paid — the payment is kept as client credit). <b>Reopen:</b> a <code>LOST</code>/<code>SUPERSEDED</code> itinerary can be brought back to <code>DRAFT</code> as an audited exception (R-LC-13). At/after VOUCHERED, edits use a change.' },
        { h: '✖ Terminal', body: '<code>LOST</code> (agent rejected/silent, from any pre-VOUCHERED step — DRAFT/PREPARED/QUOTED/APPROVED/INVOICED) · <code>SUPERSEDED</code> (another option in the inquiry won — allowed at <b>any pre-CONFIRMED step</b> while no line is yet AWAITING/CONFIRMED by a supplier) · <code>CANCELLED</code> (cancel a CONFIRMED booking via a cancellation change).' },
        { h: '$ Gates &amp; FCA', body: 'Voucher needs payment collected <i>or</i> credit-terms. Confirm needs every billable line CONFIRMED. Once CONFIRMED, <b>Generate FCA</b> needs every required line <code>OPS_READY</code> (R-OPS-02). Finance-lock blocks total-changing edits &amp; invoice regen.' },
      ],
    },
    brochure: {
      lead: 'A <b>Brochure</b> is a cut-down planning shell: it walks only <code>DRAFT ↔ PREPARED</code> with NO supplier/voucher, payment or document machinery — you build services + travellers and mark it PREPARED. When ready it is promoted to a full booking via <b>Create Itinerary</b> (PREPARED → itineraryType BOOKING, status → DRAFT), which unlocks the whole spine.',
      ladder: BrochureFlow,
      exit: { key: 'Create Itinerary', sub: '→ BOOKING · DRAFT' },
      allowed: ['Add service', 'Add traveller', 'Remove traveller', 'Edit Pax', 'Revert', 'Prepare', 'Create Itinerary'],
      notes: [
        { h: 'Build-only surface', body: 'Only the build actions + the DRAFT/PREPARED transitions are available: <b>Add service</b>, <b>Add / Remove traveller</b>, <b>Edit Pax</b>, <b>Revert</b>, <b>Prepare</b>, <b>Create Itinerary</b>. Suppliers / vouchers, payments, documents and the post-PREPARED ladder are all off (a central brochure gate blocks + hides them) until the brochure is created as an itinerary.' },
        { h: 'Create Itinerary', body: '<b>Create Itinerary</b> (from a <code>PREPARED</code> brochure) flips <code>itineraryType</code> to BOOKING, sets the Agency/Agent (Inquiry ID + name optional) and drops the status to <code>DRAFT</code> — unlocking the full lifecycle, suppliers, payments, vouchers & documents. The reverse, <b>Copy as Brochure</b>, snapshots a BOOKING back down to a fresh planning brochure.' },
      ],
    },
    change: {
      lead: 'Every edit goes through a <b>Pending Change</b>, one at a time, stamped <b>PreBookingModif</b> or <b>PostBookingModif</b> at open. A change <b>auto-opens</b> on the first edit in <code>DRAFT</code>, <code>VOUCHERED</code> or <code>CONFIRMED</code> (unless finance-locked); the manual <b>Open a change</b> button works from INVOICED (Apply/Cancel only — e.g. pre-voucher supplier requests, R-IT-10) and VOUCHERED+ (to pick the initiator). A <b>PreBookingModif</b> (pre-VOUCHERED, e.g. DRAFT) is <b>Apply / Cancel only</b>. A <b>PostBookingModif</b> (VOUCHERED+) runs its own mini-ladder (Prepare → Quote → Approve → Invoice), then <b>Apply</b> merges to baseline. Most cycle steps are optional (R-CH-26): <b>supplier vouchers are generated automatically on Apply</b> (with a confirmation) whenever a vouchered/confirmed line changed.',
      entry: { key: 'open', sub: 'auto / VOUCHERED+', next: 'stage edits' },
      ladder: ChangeFlow,
      exit: { key: 'merged', sub: '→ baseline' },
      notes: [
        { h: 'PreBookingModif vs PostBookingModif', body: 'The <b>type</b> is stamped from the itinerary status at open: pre-VOUCHERED → <b>PreBookingModif</b> (Apply/Cancel only); <code>VOUCHERED</code>/<code>CONFIRMED</code> → <b>PostBookingModif</b> (full prepare→quote→approve→invoice→apply). <code>PREPARED/QUOTED/APPROVED/INVOICED</code> do not auto-open — revert to DRAFT to edit. A draft change also <b>auto-closes</b> when emptied (every edit undone or discarded, no pending traveller); an edit undone by hand drops its empty MODIFY in any change. A PostBookingModif never auto-closes — Apply or Cancel it.' },
        { h: 'Cancellation change', body: '<b>Cancel itinerary</b> opens a <code>CANCELLATION</code> change staging CANCEL on every item. It is a <b>PostBookingModif with all items cancelled</b> — the same actions and cycle (Prepare → Quote → Approve → Invoice → Apply), plus a direct <b>Apply</b> at any step (→ items + itinerary <code>CANCELLED</code> + fees/refund/credit-note) and <b>Cancel</b> (abort). Whether the whole itinerary or a single line is cancelled, every <i>supplier-engaged</i> item raises a <b>cancel-ask</b> on Apply and its supplier status stays <code>AwaitingSupplier</code> until the supplier acknowledges the notice (then <code>Booked</code>); only a line with nothing out — or an auto type (insurance) — settles to <code>Booked</code> immediately.' },
        { h: 'Discard guard (R-CH-24)', body: 'A draft change can always be <b>discarded</b> → it restores baseline and never un-sends a voucher (vouchers go out only on <b>Apply</b>). An amendment voucher already out from a <i>prior</i> Apply (a line showing the <code>UPDATED</code> label) stays live regardless — discarding just drops the new edits on top of it. To actually unwind that live voucher, resolve the line: <b>Revert the amendment</b> (re-vouchers the original terms → supplier reconfirms) or <b>Cancel</b> the line (sends a cancellation), then Apply — or wait for the supplier to reject. A sent voucher is one-way; you resolve it, you don’t silently un-send it.' },
      ],
    },
    item: {
      lead: 'Each line walks a short path: <code>NEW</code> (arranging supplier <b>holds</b>) → <code>CONFIRMED</code>, or <code>CANCELLED</code>. Item actions live in the simulator’s item modal and operate on the selected line — always staged through a change (auto-opening in DRAFT).',
      ladder: ItemFlow,
      // CANCELLED is a terminal branch off the NEW→CONFIRMED spine (a committed line is cancelled, a NEW line removed) —
      // rendered to the side of the diagram like the itinerary/payment/voucher terminals.
      terminal: [{ key: 'CANCELLED', sub: 'cancelled · terminal' }],
      // The full per-line lifecycle = item STATUS (seller intent) × supplier status (the voucher dimension).
      // Each {key} is a reachable permutation with a canonical builder in itny.lifecycle.html; the matrix merges the
      // commercial-supplier status view into the item table so the voucher progression is visible end-to-end.
      matrixCols: [
        { key: 'NEW',          label: 'NEW',       rec: 'NeedsRequest',     sub: 'nothing out' },
        { key: 'CONF_NEEDS',   label: 'CONFIRMED', rec: 'NeedsRequest',     sub: 'intent · no voucher' },
        { key: 'CONF_AWAIT',   label: 'CONFIRMED', rec: 'AwaitingSupplier', sub: 'voucher out · awaiting' },
        { key: 'CONF_BOOKED', label: 'CONFIRMED', rec: 'Booked',          sub: 'voucher confirmed' },
        { key: 'CONF_REJ',     label: 'CONFIRMED', rec: 'Rejected',         sub: 'request refused' },
        { key: 'CANC_AWAIT',   label: 'CANCELLED', rec: 'AwaitingSupplier', sub: 'cancel-ask out' },
        { key: 'CANC_TERM',    label: 'CANCELLED', rec: 'Booked',          sub: 'cancellation confirmed · terminal' },
      ],
      notes: [
        { h: 'status is INTENT; supplier-sync lives in supplier status', body: 'A line’s <code>status</code> is just the seller’s intent — <code>NEW → CONFIRMED</code>, or <code>CANCELLED</code>. Whether the supplier has actually agreed/refused is the separate <b>supplier status</b> dimension (<code>AwaitingSupplier</code> / <code>Rejected</code> / <code>Booked</code>). So requesting confirmation moves status to <code>CONFIRMED</code> immediately (supplier status says if it is really booked yet); the old <code>AWAITING_CONFIRMATION</code> / <code>AWAITING_CANCELLATION</code> / <code>REJECTED</code> statuses are gone.' },
        { h: 'Holds are a record, not a status', body: 'A line stays <code>NEW</code> while supplier holds are arranged. <b>Add Hold</b> records a supplier hold (HELD) covering the current spec. The item list shows the line’s <b>activeHold</b> status — <code>HELD</code> (live; flagged <i>·stale</i> when it no longer covers the current spec), <code>EXPIRED</code>, or <code>VOIDED</code> (released) — never as a HELD/HOLD_REQUESTED item status.' },
        { h: 'Supplier says no → supplier status Rejected', body: 'A voucher reject (or per-line Reject) leaves the line’s <b>status</b> untouched (it keeps its CONFIRMED intent) and surfaces supplier status <code>Rejected</code>. Resolve by <b>reinstate (resend)</b>, <b>reinstate (accidental→confirmed)</b>, <b>replace (→NEW)</b>, or <b>drop (no fee)</b>.' },
        { h: 'Amend a CONFIRMED line → the UPDATED label', body: 'A staged MODIFY that’s re-vouchered keeps the line <code>CONFIRMED</code> but flags a derived <code>UPDATED</code> label (its agreed figure no longer matches the current target) until the supplier re-confirms (label clears). Committed lines are <b>cancelled</b> (with fee), never removed.' },
        { h: 'Cancel a line → CANCELLED (cancel-ask stays live)', body: 'Cancelling moves the line straight to <code>CANCELLED</code>; if the supplier was engaged a <b>cancel-ask</b> goes out on Apply (fee/refund settles now) and supplier status shows <code>AwaitingSupplier</code>. The supplier answers on the voucher: <b>confirm</b> → the cancellation is recorded (<code>confirmed</code> set) → supplier status <code>Booked</code> and the line is <b>terminal</b> (a confirmed cancellation is final, never revived); <b>reject</b> → supplier status <code>Rejected</code> with the request still out — also <b>terminal</b> (a refused cancellation can’t be re-driven). A <b>pure-cancellation voucher</b> is a notice — it can only be confirmed. A cancel with nothing out (or an auto type) is <code>Booked</code> immediately; a full-itinerary cancellation still raises cancel-asks on its engaged lines, so those read <code>AwaitingSupplier</code> until the supplier acks.' },
        { h: 'Status-picker switching keys on supplier ENGAGEMENT', body: 'The three status transitions (→ NEW / → CONFIRMED / → CANCELLED) gate on whether the supplier is <b>engaged</b> — <code>confirmed != null</code> OR <code>requested != null</code>: <b>(3)</b> with NOTHING out you can switch to any status; <b>(4)</b> you can <i>not</i> reset to <code>NEW</code> while engaged (Cancel it first); <b>(5)</b> a <code>CANCELLED</code> line is <b>terminal</b> — a confirmed cancellation records <code>confirmed</code>, so it stays engaged and can’t be switched. The picker reads the line’s ACTIVE status (committed baseline), so a merely-staged Confirm doesn’t change what’s out.' },
      ],
    },
    scope: {
      lead: '<b>Every</b> edit now flows through a <b>pending change</b> (P2 — no more inline editing). In <code>DRAFT</code> a change <b>auto-opens</b> on the first edit and is <b>Apply / Cancel only</b> (a "draft change"); from <code>VOUCHERED</code>+ the same edit goes into an <b>amendment change</b> (PostBookingModif) that runs the full Prepare → Quote → Approve → (Invoice) → Apply cycle. <b>Apply</b> commits to baseline. <b>Supplier vouchers are generated only at two points: the itinerary Send Vouchers, and a PostBookingModif Apply</b> — a <b>PreBookingModif</b> (pre-VOUCHERED draft change) raises none; its queued Confirm requests wait for Send Vouchers. Price <b>validation</b> and adding a supplier <b>hold</b> are themselves staged through the change too; only <b>expiring</b> an existing hold is immediate.',
      rows: [
        { edit: 'Add a service / extra', inline: 'auto-staged <code>ADD</code>, Apply to commit', staged: 'staged <code>ADD</code> (origin PENDING) — discardable until vouchered', rule: 'R-CH-20 / R-EX-01' },
        { edit: 'Validate price', inline: 'auto-staged <code>MODIFY</code> (rebuilds the system breakdown, clears hypothetical), Apply to commit', staged: 'staged <code>MODIFY</code> — available in any open / auto-opening change', rule: 'R-IT-03' },
        { edit: 'Manual price', inline: 'auto-staged <code>MODIFY</code>, Apply to commit', staged: 'staged <code>MODIFY</code> on the baseline line', rule: 'R-PR-01 / R-CH-04' },
        { edit: 'Change dates / allocate travellers', inline: 'auto-staged <code>MODIFY</code>, Apply to commit', staged: 'staged <code>MODIFY</code> (CONFIRMED line gets the UPDATED label on re-voucher)', rule: 'R-AL-01/02' },
        { edit: 'Cancel a committed line', inline: 'auto-staged <code>CANCEL</code> — refund posts on Apply', staged: 'staged <code>CANCEL</code> — refund posts on Apply', rule: 'R-CN-01' },
        { edit: 'Remove a NEW line', inline: 'auto-staged <code>REMOVE</code> / discard a pending ADD', staged: 'staged <code>REMOVE</code> / discard a pending ADD', rule: 'R-CN-03' },
        { edit: 'Add / remove traveller', inline: 'auto-staged PENDING / removed on Apply', staged: 'PENDING pax / removed on Apply', rule: 'R-PX-03' },
      ],
    },
    holds: {
      lead: 'A line can carry a collection of supplier <b>holds</b>, each <code>{ status: HELD | RELEASED, price, expiresAt, expired }</code> stamped with the spec it covers. <b>Add Hold</b> records a HELD hold for the current spec; the per-hold toggle flips it <code>HELD ↔ RELEASED</code>. Holds do <b>not</b> change the item status (it stays <code>NEW</code>); only <b>active</b> holds (neither expired nor RELEASED) count, and <code>holdMismatch</code> flags when a live hold exists but none cover the current target.',
      note: 'Note how the last row keeps the line <code>NEW</code> with <code>holdMismatch:true</code> — the spec moved past the hold, so <b>Add Hold</b> becomes available again to cover the new price.',
    },
    voucher: {
      lead: 'A <b>voucher</b> is the request sent to a single supplier. Issuing vouchers groups every one of a supplier’s items onto <b>one</b> voucher (a line per service/extra, each CONFIRM or CANCEL); auto types (insurance) confirm themselves on a dedicated auto-confirmed voucher and never appear on a supplier’s request voucher. Re-issuing for a supplier <b>supersedes</b> its previous voucher. A supplier answers the whole voucher <b>all-or-nothing</b>: <b>Confirm</b> (with a booking ref on the first confirm — one per supplier) books every line; <b>Reject</b> (comment required) rejects every line, sending each item to supplier status <code>Rejected</code> for per-item resolution.',
      ladder: [{ key: 'SENT', sub: 'out to supplier', next: 'confirm' }, { key: 'CONFIRMED', sub: 'booked' }],
      terminal: [{ key: 'REJECTED', sub: 'supplier said no' }, { key: 'SUPERSEDED', sub: 're-issued' }],
      notes: [
        { h: 'All-or-nothing', body: 'Confirm books <b>every</b> line (CONFIRM lines confirm; CANCEL lines finalise → the already-<code>CANCELLED</code> item’s cancel-ask resolves, supplier status <code>AwaitingSupplier → Booked</code>); Reject rejects every line (CONFIRM <i>and</i> CANCEL → supplier status <code>Rejected</code> — a refused cancellation resolves like any rejection). There is no per-line supplier answer — resolve a rejection per item (reinstate / replace / drop / revert-to-confirmed).' },
        { h: 'A pure-cancellation voucher is a notice', body: 'A voucher whose lines are <b>all CANCEL</b> is a cancellation notice — the supplier can <b>only confirm</b> (acknowledge) it, not reject it. Reject is reserved for a voucher that still asks the supplier to confirm something (a mixed confirm+cancel voucher, where rejecting it sends the cancel lines to supplier status <code>Rejected</code> too).' },
        { h: 'Booking ref &amp; payment terms', body: 'The supplier supplies a <b>booking ref</b> on the first confirm; it is reused for that supplier’s later vouchers. On first confirm each <b>service</b> line copies its supplier’s payment terms (<code>{depositPct, dueDays}</code>); <b>extras inherit</b> their parent service’s terms. The supplier view merges these into a due-date <b>timeline</b> (earliest due + total outstanding).' },
        { h: 'Supersede &amp; the prior-version race (R-IF-06)', body: 'A re-issue marks the prior voucher <code>SUPERSEDED</code> and links the two. A superseded-but-unanswered voucher can still be confirmed/rejected late (the race) → recorded as a supplier status note. The covering supplier <b>hold id</b> is captured on each line so it is sent with the voucher.' },
      ],
    },
    payment: {
      lead: 'The itinerary carries a single <b>payment status</b> that is <b>fully derived</b> from money collected vs the <b>total</b> — there is no per-state button and no pinning. Every payment / credit note (and every change Apply) re-runs <code>_recalcPayment()</code>: a dead itinerary is <code>CANCELLED</code>; one with no client money, no supplier vouchers <i>and</i> still pre-approval (before <code>APPROVED</code>) is <code>NEW</code> (nothing collectable yet); otherwise it falls straight out of <code>paid</code> vs <code>total</code> — under → <code>NEEDS_PAYMENT</code>, exact (non-zero total) → <code>FULLY_PAID</code>, over → <code>OVERPAID</code>. So accepting the quote (→ <code>APPROVED</code>) ends <code>NEW</code>. <i>How</i> the balance is collected lives in the <b>deposit</b> object and the <b>payment-milestone schedule</b>, not in the status.',
      ladder: [
        { key: 'NEW', sub: 'pre-approval · no money', next: 'approve' },
        { key: 'NEEDS_PAYMENT', sub: 'balance outstanding', next: 'collect' },
        { key: 'FULLY_PAID', sub: 'paid in full' },
      ],
      terminal: [
        { key: 'OVERPAID', sub: 'paid &gt; total' },
        { key: 'CANCELLED', sub: 'dead — money flow stops' },
      ],
      notes: [
        { h: 'Derived, not driven (R-MN-05)', body: '<b>Record client payment</b> appends to <code>payments[]</code> and re-runs the money side (<code>_recalcDeposit</code> → <code>_recalcMilestones</code> → <code>_recalcPayment</code>). The status is pure paid-vs-total: <code>NEW</code> only while there is no money, no voucher <i>and</i> the itinerary is still pre-approval (before <code>APPROVED</code>); <code>CANCELLED</code> whenever the itinerary status is CANCELLED/LOST/SUPERSEDED. Credit notes are ordinary <code>CREDIT_NOTE</code> rows in <code>payments[]</code> that feed <code>paid()</code>.' },
        { h: 'Finance-only money actions (FIN)', body: 'The money operations are restricted to a <b>Finance (FIN)</b> operator — <b>Record client payment</b>, <b>Record client refund</b>, <b>Credit Note – Add/Transfer</b> and <b>Toggle finance lock</b>. A non-FIN (SP) user sees them blocked (switch the operating user in the header). <b>Record client refund</b> (R-MN-08) pays money back: a negative <code>REFUND</code> <code>payments[]</code> row + a settled <code>REFUND_TO_CLIENT</code> milestone, capped at the money collected.' },
        { h: 'Deposit object', body: 'The <code>deposit</code> is a first-class object — a <b>system</b> figure (Σ sellPrice × depositPct, due = the earlier of first-invoice date + 7 days and the earliest active-hold expiry — else TBD) vs an optional <b>manual</b> amount/due, with <code>skip</code> to drop it. It <b>recomputes while unpaid &amp; not customised</b> and <b>freezes once paid</b> (<b>Edit deposit</b> is the only lever, disabled after payment).' },
        { h: 'Milestone schedule', body: 'The Payments card shows a schedule: the <b>deposit</b> (first, unless skipped) → seller-added <b>custom</b> milestones (<b>Add/Edit/Remove milestone</b>, each a dated slice of the balance) → any <b>recorded (settled) outstanding</b> slices → the dynamic <b>outstanding</b> residual (last). Each row also shows its <b>paid %</b> + amount left (deposit 100%, a partly-covered slice 30%, the live outstanding 0%). A custom milestone’s due must be after today &amp; after the last paid milestone. Invariant: <b>Σ unpaid milestones === total − paid</b>. When fully paid then the itinerary grows, a fresh outstanding milestone re-appears. Milestone edits are tracked in the open change (a <b>Cancel</b> reverts them) and are embedded in generated quotes/invoices + their matching.' },
        { h: 'Recorded outstanding &amp; the cancel fix (R-MN-09)', body: 'The moment the dynamic <b>outstanding</b> residual is fully covered it is <b>recorded</b> — frozen as a paid milestone — so history keeps it and any later balance change emits a <b>fresh</b> outstanding/refund line instead of mutating the settled one. This fixes the pay-then-cancel bug: a cancellation’s <b>retained fees</b> now count toward the schedule’s billable base, so a fully-paid itinerary that is cancelled no longer derives a phantom <b>negative</b> outstanding — the kept fee reads settled and the refund is its own <code>REFUND_TO_CLIENT</code> row.' },
        { h: 'Cancellation branch', body: 'Applying a <b>cancellation</b> sets the itinerary CANCELLED → payment status <code>CANCELLED</code>; any net money owed back is either kept as client credit (<i>issue credit note</i>) or paid back as a <b>REFUND_TO_CLIENT</b> milestone alongside a negative <code>payments[]</code> row.' },
        { h: 'Itinerary-view countdown', body: 'The closest unpaid milestone (<code>nextMilestone()</code>) surfaces in the itinerary header with a days-left accent — <b>green</b> &gt; 3 days, <b>yellow</b> 1–3, <b>red</b> at/after due.' },
      ],
    },
    supplierStatus: {
      lead: 'Each item tracks three supplier-facing figures — <b>target</b> (current intent), <b>requested</b> (what’s out to the supplier, now carried on a voucher line), <b>confirmed</b> (what they agreed) — and derives a supplier status state. This is what tells ops what to <i>do</i> next on a line.',
      states: {
        NeedsRequest: 'raise/send a request (incl. stale request → re-voucher the current terms)', AwaitingSupplier: 'sent, waiting', NeedsDecision: 'reserved — no producer yet',
        Booked: 'nothing to do', Rejected: 'supplier refused → resolve',
      },
      derivation: 'Derivation (top-down, first match): <code>requested REJECTED (line or request) → Rejected</code> (unless the target has since moved past the refused figure → <code>NeedsRequest</code>); a <code>CANCELLED</code> line whose cancel-ask is still out → <code>AwaitingSupplier</code>; <code>requested.AWAITING &amp; matches target → AwaitingSupplier</code> else <code>NeedsRequest</code> (stale request out); else <code>confirmed == target → Booked</code> else <code>NeedsRequest</code>. <code>NeedsDecision</code> is reserved (no producer yet).',
      visibility: '<b>Visibility:</b> the table shows the raw derivation. In the simulator a line still in the <b>hold phase</b> (<code>NEW</code>) does <b>not</b> surface a supplier status until vouchers are issued for its context — the itinerary reaches <code>VOUCHERED</code>; a hold-phase line staged in a pending change waits for <b>Apply</b> (which raises its voucher). Lines past the hold phase always show it — including a <code>CANCELLED</code> line whose cancel-ask is still live: though no longer billable, it keeps tracking supplier status (<code>AwaitingSupplier</code> until the supplier confirms the cancellation, <code>Rejected</code> if they refuse).',
    },
  };

  /* ======================================================================
   * 9. View config — the read-only domain reference for the simulator.
   * ==================================================================== */
  const CONFIG = {
    meta: { title: 'Itinerary Rule Engine', version: SIM_VERSION, source: 'itinerary.logic.md (v2.4)', model: 'DDD aggregate (itny.js)' },
    enums: { ItineraryStatus: Object.values(ItineraryStatus), ItineraryType: Object.values(ItineraryType), PaymentStatus: Object.values(PaymentStatus), MilestoneType: Object.values(MilestoneType), ServiceStatus: Object.values(ServiceStatus), HoldStatus: Object.values(HoldStatus), ServiceType: Object.values(ServiceType), PaxType: Object.values(PaxType), PendingOp: Object.values(PendingOp), ModificationType: Object.values(ModificationType), SupplierStatus: Object.values(SupplierStatus), VoucherStatus: Object.values(VoucherStatus), LineAction: Object.values(LineAction), UserRole: Object.values(UserRole) },
    constants: Constants,
    suppliers: Suppliers,
    agencies: Agencies,
    flow: Constants.FLOW,
    lifecycles: LIFECYCLES,
  };

  return {
    Itinerary, Item, Voucher,
    ItineraryStatus, ItineraryType, PaymentStatus, MilestoneType, ServiceStatus, HoldStatus, ServiceType, PaxType, PendingOp, ChangeTrigger, ModificationType, SupplierStatus,
    VoucherStatus, LineAction, TravelStatus, UserRole,
    Suppliers, Constants, LIFECYCLES,
    ACTION_REGISTRY, VIEW_REGISTRY, CONFIG,
    // date helpers (exposed so the view / tests can convert between a day number and its ISO date deterministically).
    dates: { isoForDay, dayForISO, dayNum, isoDate, anchorYear, dayLabel },
  };
});
