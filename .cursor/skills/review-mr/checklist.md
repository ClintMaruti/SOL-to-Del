# MR Review Checklist

Use this checklist when reviewing changes. Reference `.cursor/rules/*.mdc` for details.

## Architecture (FSD)

- [ ] Layer hierarchy respected (app → pages → widgets → features → entities → shared)
- [ ] No circular or forbidden imports (e.g. features importing from pages)
- [ ] Public API pattern: prefer importing from slice root (`@/entities/agent`), not deep paths
- [ ] Entity types in `model/types.ts`; API hooks in `api/`

## Cache & State (tanstack-query-cache.mdc)

- [ ] Mutations invalidate relevant list queries (`invalidateQueries({ queryKey: ['entity'] })`)
- [ ] Parent list invalidated when child changes (e.g. agents → agencies, suppliers → supplier-head-offices)
- [ ] Optimistic updates paired with invalidation for reconciliation
- [ ] New items visible in lists without manual refresh

## Form State (form-state-modals.mdc)

- [ ] Form reset when modal closes (`reset()`, `resetMutation()`, clear errors)
- [ ] No pre-filled data from previously edited record in create modals
- [ ] Unsaved changes flow: `scheduleNavigateAfterSave` after successful save
- [ ] Edit modals use latest server data (e.g. `useAgent(id)`)

## Validation & Errors (validation-error-handling.mdc)

- [ ] Field-level errors from API (getValidationErrors, toFormErrors), not generic "One or more errors occurred!"
- [ ] No raw backend validation strings (PascalCase) shown to user
- [ ] Coordinate validation (e.g. Lat/Long in pairs)
- [ ] `Array.isArray(data) ? data : []` before `.map()` on API responses

## Search (search-behaviour.mdc)

- [ ] Min 3 characters before filtering
- [ ] Debounce on search input
- [ ] Search not persisted to URL unless intentional
- [ ] Clear button on search fields

## UI & Components

- [ ] shadcn/ui components used (no raw Tailwind div/button for UI)
- [ ] Form UI: 6px radius (`rounded-[6px]`), 8px spacing (`gap-2`, `space-y-2`)
- [ ] i18n: user-facing text via `useTranslation`/`i18n.t`, no hardcoded strings (see `.cursor/rules/i18n.mdc`)

## Business Logic (business-logic-api.mdc)

- [ ] Correct HTTP methods (DELETE for soft delete, not PUT)
- [ ] Domain rules enforced (e.g. Country disabled when creating child destination)

## MSW (msw-mock-persistence.mdc)

- [ ] Stateful handlers use `let mockData` for CRUD persistence

## Spy Scroll (intersection-observer-safari.mdc)

- [ ] rootMargin in pixels, not percentages (Safari)
- [ ] Last section highlighted when scrolled to bottom

## Testing

- [ ] Tests in `__tests__/` at feature/widget/entity root
- [ ] Unit tests for hooks/utils; integration for components
- [ ] E2E in `e2e/tests/*.spec.ts`
- [ ] No `waitForTimeout` in E2E; use Playwright assertions
