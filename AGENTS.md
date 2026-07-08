# Codex Working Guide

This repository already keeps most project-specific AI guidance in [`.cursor/rules/`](./.cursor/rules) and [`.cursor/skills/`](./.cursor/skills). Treat those files as the source of truth. This `AGENTS.md` is the Codex-friendly entry point that tells you what to follow and where to look.

## Core Project Defaults

- Architecture follows Feature-Sliced Design (FSD): `app -> pages -> widgets -> features -> entities -> shared`.
- Prefer existing shared UI from `@sol/ui` and app-level shared components over raw Tailwind-only implementations.
- Use i18n for all user-facing strings. Keep locale files in sync across `packages/i18n/src/locales/en/` and `packages/i18n/src/locales/es/`.
- Use TanStack Query cache updates after mutations so detail and list views stay aligned. For row-level table mutations such as status toggles, prefer targeted cache updates over invalidating the active list query, so current client-side sort and table state are preserved.
- Keep forms and modals reset-safe: clear form state, mutation state, and validation state when closing.
- Testing is required for meaningful behavior changes. Use `__tests__/` at the feature/widget/entity root for unit and integration tests; keep Playwright specs in `e2e/tests/`.

## Always Apply

Review these first for most tasks:

- [`.cursor/rules/testing-strategy.mdc`](./.cursor/rules/testing-strategy.mdc)
- [`.cursor/skills/feature-slice-design/SKILL.md`](./.cursor/skills/feature-slice-design/SKILL.md)

Read this when working from Figma or translating designs into code:

- [`.cursor/rules/figma-mcp.instructions.mdc`](./.cursor/rules/figma-mcp.instructions.mdc)

Figma-driven UI changes must be token-accurate:

- Fetch Figma design context and screenshot before styling decisions.
- Match the exact repo token or component variant that corresponds to the Figma variable or spec. Do not substitute “close enough” tokens like `text-muted-foreground`, `bg-gray-50`, or generic defaults because they look similar.
- If the design uses a token that does not exist in the codebase yet, add the token or document the gap instead of guessing.
- Apply this strictness to typography, colors, borders, spacing, alignment, and component variants, not just layout.

## Domain agents (`apps/admin`)

For work scoped to a single admin domain, invoke the matching slash command so the agent loads the right slice map and boundaries. Prompt files live in [`.cursor/agents/`](./.cursor/agents/); see [`.cursor/agents/README.md`](./.cursor/agents/README.md).

| Domain                                                 | Command                    | Prompt                   |
| ------------------------------------------------------ | -------------------------- | ------------------------ |
| Agency group / agency / agent                          | `/agency-agent`            | `agency-network.md`      |
| Destination tree & modals                              | `/destination-agent`       | `destination-network.md` |
| Supplier, head office, contracts, extras, margin rules | `/supplier-agent`          | `supplier-network.md`    |
| Service options, rates, closeouts, notes               | `/supplier-services-agent` | `supplier-services.md`   |
| Itineraries (list, create, filters)                    | `/itinerary-agent`         | `itinerary.md`           |
| App shell, routing, sidebar, auth                      | `/platform-agent`          | `platform-shell.md`      |

Use domain agents for feature work inside their scope; use `/platform-agent` for cross-cutting shell changes. Global rules below still apply.

## Task Routing

When a task touches one of these areas, read the linked Cursor rule or skill before editing:

- Architecture and slice placement:
  [`.cursor/skills/feature-slice-design/SKILL.md`](./.cursor/skills/feature-slice-design/SKILL.md)
- Route-level and detail-page loading UX:
  [`.cursor/rules/page-loading-ux.mdc`](./.cursor/rules/page-loading-ux.mdc),
  [`.cursor/skills/page-loading-ux/SKILL.md`](./.cursor/skills/page-loading-ux/SKILL.md)
- Query cache, mutation reconciliation, and toggle status flows:
  [`.cursor/rules/tanstack-query-cache.mdc`](./.cursor/rules/tanstack-query-cache.mdc),
  [`.cursor/rules/toggle-status-mutation-cache.mdc`](./.cursor/rules/toggle-status-mutation-cache.mdc),
  [`.cursor/rules/list-ordering-performance.mdc`](./.cursor/rules/list-ordering-performance.mdc)
- Entity types and update hooks:
  [`.cursor/rules/entity-types-and-update-hooks.mdc`](./.cursor/rules/entity-types-and-update-hooks.mdc)
- Form behavior and validation:
  [`.cursor/rules/form-state-modals.mdc`](./.cursor/rules/form-state-modals.mdc),
  [`.cursor/rules/form-ui-standards.mdc`](./.cursor/rules/form-ui-standards.mdc),
  [`.cursor/rules/validation-error-handling.mdc`](./.cursor/rules/validation-error-handling.mdc),
  [`.cursor/rules/date-picker-standards.mdc`](./.cursor/rules/date-picker-standards.mdc)
- Search UX:
  [`.cursor/rules/search-behaviour.mdc`](./.cursor/rules/search-behaviour.mdc)
- Domain and API-specific business rules:
  [`.cursor/rules/business-logic-api.mdc`](./.cursor/rules/business-logic-api.mdc)
- MSW handler persistence:
  [`.cursor/rules/msw-mock-persistence.mdc`](./.cursor/rules/msw-mock-persistence.mdc)
- Safari-specific intersection observer behavior:
  [`.cursor/rules/intersection-observer-safari.mdc`](./.cursor/rules/intersection-observer-safari.mdc)
- Review or pre-push checks:
  [`.cursor/skills/review-mr/SKILL.md`](./.cursor/skills/review-mr/SKILL.md)
- Ticket creation from Figma or plans:
  [`.cursor/skills/create-tickets/SKILL.md`](./.cursor/skills/create-tickets/SKILL.md),
  [`.cursor/rules/ticket-creation.mdc`](./.cursor/rules/ticket-creation.mdc)

## Practical Defaults

- Prefer public slice APIs over deep imports when the codebase already exposes them.
- For toggle mutations, update list caches and the detail cache. Do not invalidate the currently displayed list query for row-level toggles unless a broader scope truly needs reconciliation.
- If no client-side sort is selected, preserve the incoming server/cache order exactly. Do not apply an implicit default client sort.
- For client-side sorted tables, row-level updates should preserve the current row order unless the active sort uses the changed field. Avoid tie-breakers that reintroduce hidden default-order resorting during unrelated row updates.
- Do not leave generic validation toasts when field-level API errors are available.
- Guard `.map()` calls on API responses with `Array.isArray(...)` when response shape is uncertain.
- Use `DatePickerGridInput` for new admin date/date-range form inputs.
- Search inputs should usually debounce and wait for at least 3 characters before filtering.
- Preserve server or explicit sort order after optimistic list updates.
- **GitLab CI unit tests:** On merge requests, Vitest runs with `--changed` against the MR target branch (e.g. `develop`) via [`scripts/ci-vitest.sh`](./scripts/ci-vitest.sh); push and non-MR pipelines run the full per-app suite. **Pre-push** runs full `pnpm test:unit` after type-check (see `.husky/pre-push`).

## Notes For Future Updates

- If you add a new project convention, prefer updating the relevant file under [`.cursor/rules/`](./.cursor/rules) or [`.cursor/skills/`](./.cursor/skills) and keep this file as a compact index.
- If this file and the implemented codebase disagree, prefer the current codebase behavior and update the docs in the same change when appropriate.
