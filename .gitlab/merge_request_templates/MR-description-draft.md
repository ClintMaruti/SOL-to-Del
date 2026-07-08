## Description

This MR implements the **Supplier Head Office detail page** (view and update) and related behaviour:

- **Detail page** – Route `/database/destinations/supplier-head-offices/:headOfficeId` shows a form with:
  - **General Information** – name, status (Active toggle)
  - **Contacts & Address** – contact and address fields
  - **Suppliers** – table of suppliers assigned to this head office (sortable via `AdminTable`), with Email column using `CopyableCell` / `CopyableCellGroup`
- **Loading / error / not found** – Spinner while loading; error handling; "Head office not found" with "Back to Head Offices" when the head office does not exist.
- **Form actions** – Cancel (with unsaved-changes blocker) and Save; Active toggle for the head office.
- **Suppliers actions** – Edit (navigate to supplier), Active toggle per supplier, **Delete** (remove supplier from this head office). Delete opens a confirmation dialog ("Delete supplier from Head Office") and, when confirmed, reassigns the supplier to another head office if one exists; otherwise shows a toast error. After delete, the head office suppliers list refetches and updates.
- **MSW & API** – GET/PATCH for head office and PATCH for supplier (for reassignment) added/updated so list and detail stay in sync.
- **Tests** – Integration tests for `SupplierHeadOfficeDetailPage` and `useHeadOfficeDetailPage`; E2E tests for the edit head office flow (navigation, sections, Cancel/Save, Active toggle, Suppliers table, Delete dialog, not-found). TypeScript and lint fixes in hook tests (mock casts, unused variables).

## Ticket Reference

[PCP-431](https://your-jira-or-gitlab.com/browse/PCP-431)

## Type of Change

<!-- Mark the appropriate option with [x] -->

- [x] 🚀 Feature (new functionality)
- [ ] 🐛 Bug fix (fixes an issue)
- [ ] 🔧 Refactor (code improvement, no functional change)
- [ ] 📚 Documentation (docs only)
- [ ] 🧪 Test (adding/updating tests)
- [ ] 🔨 Chore (build, deps, tooling)
- [ ] ⚡ Performance (optimization)
- [ ] 🚨 Hotfix (critical production fix)

## Checklist

<!-- Ensure all items are completed before requesting review -->

### Code Quality

- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] No commented-out code or debug statements
- [x] Error handling implemented appropriately

### Testing

- [x] Unit tests added/updated
- [x] Integration tests added/updated (if applicable)
- [x] Manual testing completed locally
- [x] All existing tests pass

### Documentation

- [x] Code comments added where necessary
- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Changelog entry added (if applicable)

### Security

- [x] No secrets/credentials in code
- [x] Input validation implemented
- [x] No SQL injection vulnerabilities
- [x] Authentication/authorization verified (if applicable)

## Screenshots (Frontend Only)

<!-- Add screenshots for UI changes -->

| Before             | After        |
| ------------------ | ------------ |
| _(N/A – new page)_ | _(optional)_ |

## Breaking Changes

<!-- List any breaking changes and migration steps -->

- [ ] This MR contains breaking changes

**If yes, describe the breaking changes:**

<!-- Describe breaking changes here -->

**Migration Steps:**

<!-- Provide migration steps here -->

## Additional Notes

- Delete supplier flow: if another head office exists, the supplier is reassigned to it; if not, user sees an error toast and delete does not proceed.
- `useToggleSupplierHeadOfficeStatus` invalidates both the head office list and the single head office query so the detail page stays in sync after toggling Active.

## Reviewer Notes

- Confirm Suppliers table (AdminTable, CopyableCell for email, Delete confirmation dialog) matches design and UX expectations.
- Confirm MSW handlers for GET/PATCH head office and PATCH supplier align with API contract.

---

/label ~"needs-review"
/assign_reviewer @
