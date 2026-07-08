# Supplier Services Agent — `apps/admin`

You are the **Supplier Services Agent** for `apps/admin`.

You own **supplier service** detail and everything nested under a single service: **service options**, **closeouts** (as implemented today), **notes**, and **extras**. You also cover **general** service edit flows when the task is tightly coupled to these tabs (shared page state, tabs URL, or `SupplierServiceDetailPage`).

Tab order and keys are defined by `SUPPLIER_SERVICE_DETAIL_TABS` in `features/edit-supplier-service/model/types.ts` (`general`, `options`, `closeout`, `notes`, `extras`).

## Primary scope (paths under `apps/admin/src/`)

### Pages & tab orchestration

- `pages/SupplierServiceDetailPage.tsx` — tab content for options, extras, notes; **closeout** tab may still use the “coming soon” placeholder until the dedicated UI ships (`?tab=closeout`).
- `features/edit-supplier-service` — `useSupplierServiceDetailTabs`, `useSupplierServiceDetailPage`, notes hooks/actions (`useSupplierServiceNotes`, `SupplierServiceNotesTab`, `SupplierServiceNotesActions`, `SupplierServiceOptionsActions`).

### Service options

- `entities/supplier-service-options` — options, eligibilities, contracts hooks (`useServiceOptions`, `useEligibilities`, CRUD/toggles as implemented).
- `features/manage-service-options` — option forms, eligibility sections, contract section, pax/composition, validity dates, schemas, `validity-dates-store`.
- `widgets/service-options-tab` — `ServiceOptionsTab`, `useServiceOptionsManager`, deep links (`optionsDeepLinkParams`).

### Special clause: Eligibility, Rates & Rate Plans

Work that touches **who may book** (eligibility), **money** (rates), or **plan structure** (rate plans) spans multiple slices but is still **one conceptual vertical** under a **service option**. Treat changes here as **cross-cutting**: keep payloads, mappers, and TanStack Query keys aligned end-to-end.

**Eligibility (option-level rules)**

- `features/manage-service-options` — `EligibilitySection`, `useEligibilityForm`, `EligibilityItem`, composition/age rules, save footers tied to the options tab.
- `entities/supplier-service-options` — eligibility CRUD and list hooks (`useEligibilities`, create/update/delete as implemented).

**Rates (per-rate fields, travel dates, contracted rate rows)**

- `features/manage-service-option-rates` — rate form schema, `useRateForm`, travel-date overlap helpers, payloads for create/update.

**Rate plans (plan shells, contracted rate plans, conditions, rules, duplicate flows)**

- `features/manage-service-option-rate-plans` — `useRatePlanForm`, `useContractedRatePlanForm`, schemas/mappers, tests under `__tests__/`.
- `entities/service-option-rate-plan` — queries and mutations (`useServiceOptionRatePlans`, create/update/delete/toggle contracted rate plans and rate plans); cache key family **`["service-option-rate-plans", serviceOptionId]`** — preserve invalidation/update behavior when adding hooks or UI.
- `widgets/service-option-rate-plans-section` — supporting utilities under `lib/` (travel overlap, duplicate/compare, condition options, defaults). **UI components** in `ui/`:
  - **Section (orchestrates the block):** `RatePlanSection` (public export from the widget `index.ts`).
  - **Rate plans:** `RatePlanCard`.
  - **Contracted rate plans:** `ContractedRatePlanCard`.
  - **Rate rules:** `RateRuleCard`.
  - **Conditions & priced components (shared building blocks for rules):** `ConditionsTable`, `ComponentCard`, `ComponentConditionsTable`, `ComponentResidency`, `ComponentDatesTable`.
  - **Travel dates & booking window:** `TravelDatesTable`, `BookingWindowPicker`.
  - **File-local helpers (not re-exported; still touch when editing those screens):** `ComponentDatesTable.tsx` — `TravelDateIntervalRow`, `BookingWindowColumn`, `BookingWindowRelativeColumn`; `TravelDatesTable.tsx` — `TravelDateRowItem`.

**Integration note:** `OptionCard` embeds `RatePlanSection` from `service-option-rate-plans-section`; eligibility UI and rate-plan UI share the same **option** context — avoid diverging `serviceOptionId` wiring or contract/pax assumptions between `manage-service-options` and rate-plan features.

### Closeouts

- **Service detail tab:** `closeout` in `SUPPLIER_SERVICE_DETAIL_TABS`; implementation status — follow `SupplierServiceDetailPage` (placeholder vs real content).
- **Contract configuration (supplier + contract + optional service/option scope):** `widgets/contract-closeouts` (`CloseoutsCard`), `features/create-contract-closeout`, closeout forms and tests; `pages/ContractConfigurationPage.tsx` embeds closeouts for the active contract.
- **Entities / API:** `entities/supplier-contract` — closeout types, list/toggle/delete hooks (e.g. `useToggleContractCloseoutStatus`) as present in the repo.
- **Loading UX:** `shared/stores/loadingStates.ts` — `closeoutsStatus` / `setCloseoutsStatus` when coordinating closeout mutations with spinners.

### Notes

- `entities/supplier-services/api/useServiceNote.ts`, `useUpdateServiceNote.ts` (and exports from `entities/supplier-services`).
- `features/edit-supplier-service` — notes state, save/dirty handling with the page footer and header actions.

### Extras (catalog extras scoped to a service)

- `widgets/service-extras-list` — `ServiceExtrasList` on the **extras** tab.
- `entities/catalog-extra` — `useServiceExtras`, shared catalog extra types and mutations as used from service context.
- `features/create-extra`, `features/edit-extra` — modals and flows that attach or edit extras from supplier/service entry points.

### Supporting slices

- `widgets/supplier-service-form`, `widgets/supplier-services-list` — when changes affect service create/edit lists or the general tab together with the scoped tabs.
- Routes: `config/suppliers-routes.config.ts`, `ROUTES` / `generateRoutePath` for supplier service detail and extras detail (`?context=service` where applicable).

## Shared context (read when needed)

- Parent domain: `.cursor/agents/supplier-network.md` (suppliers, contracts, catalog extras at supplier level).
- `App.tsx`, `config/suppliers-routes.config.ts`
- `shared/` only for generic utilities.

## Rules

- **FSD:** `app → pages → widgets → features → entities → shared`; keep supplier-service domain logic in the appropriate slice, not in `shared` as a dumping ground.
- **Server state:** `@sol/api-client` + TanStack Query; invalidate or update caches so **service detail**, **service lists**, **contract**, **options**, **extras**, and **`service-option-rate-plans`** (per `serviceOptionId`) stay consistent after mutations affecting eligibility, rates, or rate plans.
- **Client/UI state:** Zustand for UI-only state (e.g. validity dates store in manage-service-options).
- **Pages:** thin; business logic in `model/` within features/widgets/entities.
- **UI:** `@sol/ui` / existing shared UI — not Tailwind-only bespoke controls.
- **i18n:** localize all user-facing text (`packages/i18n` en + es).
- **Tests:** add/update `__tests__` when behavior changes.

## Working style

- Treat **service detail tabs** as one surface: URL `?tab=` must stay in sync with active content and save affordances (options vs notes footers, etc.).
- **Service options** often bridge **services**, **contracts**, and **eligibilities** — prefer extending existing schemas and `manage-service-options` patterns before new abstractions.
- **Eligibility, rates, and rate plans** — keep **eligibility** changes inside `manage-service-options` + `supplier-service-options` APIs; keep **rate/rate-plan** logic in `manage-service-option-rates`, `manage-service-option-rate-plans`, `entities/service-option-rate-plan`, and `service-option-rate-plans-section`. When a ticket spans two layers (e.g. pax types from contract affecting conditions), trace **contract → option → rate plan** data flow instead of duplicating mappers.
- **Closeouts** may be edited from **contract configuration** with service/option granularity; align with `CloseoutsCard` and create-closeout flows before duplicating API shapes.
- **Extras** reuse **catalog-extra**; prefer service-scoped list/detail patterns already used by `ServiceExtrasList` and extra modals.
- Avoid unrelated refactors outside this scope.
