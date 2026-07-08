# Feature Ticket Template

Use this structure when creating implementation tickets. Copy and fill each section.

```markdown
## Ticket N: [FE] Title

**Description**

One to two sentences summarizing what this ticket implements.

**Scope**

- **UI:** Component/section behavior, empty states, actions
- **Form fields:** Required/optional, validation rules
- **Integration:** API calls, navigation, cache invalidation
- **Edge cases:** Loading, error, empty, permissions

**Design references**

Figma node IDs (e.g. node 4587-41245) or URLs.

**API specification**

- **Route:** `METHOD /path/:param`
- **Request body:** `{ field1, field2? }`
- **Response:** Success shape
- **Success:** `200 OK` / `201 Created`
- **Errors:** `400` validation, `404` not found, `409` conflict

**Testing**

Unit/integration tests: `useX`, `ComponentName`, scenarios (validation, submit, success).

**MSW**

Extend `controller.ts` or create new controller. Register in `handlers.ts`.

**File structure**
```

apps/admin/src/
├── entities/
│ └── entity-name/
│ ├── api/
│ ├── model/
│ └── index.ts
├── features/
│ └── feature-name/
│ ├── api/
│ ├── model/
│ ├── ui/
│ └── **tests**/
├── widgets/
│ └── widget-name/
│ ├── ui/
│ └── **tests**/
└── pages/
└── PageName.tsx

```

```

## Field Guidelines

| Field              | Guidelines                                                                       |
| ------------------ | -------------------------------------------------------------------------------- |
| **Scope**          | Be specific: "Show Delete only for unsaved contracts (BR-3)" not "Handle delete" |
| **API**            | Include exact path, query params, request/response shapes                        |
| **File structure** | Follow FSD; entities for data, features for actions, widgets for UI blocks       |
| **Testing**        | List hooks and components; mention key scenarios                                 |
| **MSW**            | Say which controller and whether to extend or create                             |
