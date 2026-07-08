---
name: create-tickets
description: Creates feature tickets from Figma designs. Fetches design context via Figma MCP, extracts layout/components/fields, and outputs CPS SOL–formatted tickets. Use when the user provides Figma URLs and asks to create a ticket.
---

# Creating Feature Tickets From Figma

Creates implementation-ready tickets from Figma design(s). Fetches design context, extracts UI details, and outputs tickets following the CPS SOL format with FSD alignment.

## When to Use

- User provides Figma URL(s) and asks to create a ticket
- User says "create ticket from this design" with a Figma link

## Ticket Format

Each ticket MUST include:

| Section               | Required      | Content                                         |
| --------------------- | ------------- | ----------------------------------------------- |
| **Title**             | Yes           | `[FE] Short descriptive name`                   |
| **Description**       | Yes           | 1–2 sentence summary                            |
| **Scope**             | Yes           | Bullet list of UI, validation, API integration  |
| **Design references** | If available  | Figma node IDs or URLs                          |
| **API specification** | Yes           | Route, method, request/response, errors         |
| **Testing**           | Yes           | Hooks, components, scenarios to test            |
| **MSW**               | If API        | Controller/handler to add or extend             |
| **File structure**    | Yes           | FSD layout (entities, features, widgets, pages) |
| **Business rules**    | If applicable | BR-1, BR-2, etc.                                |

## Workflow

### From Figma Design(s)

1. **Parse URLs** – Extract fileKey and nodeId from each Figma URL. Convert node-id hyphens to colons (e.g. `1-2` → `1:2`).
2. **Fetch design** – Call Figma MCP `get_design_context` for each node. Capture layout, components, text, form fields, states (empty, filled, error), and interactions.
3. **Map to shadcn/ui** – Per `.cursor/rules/figma-mcp.instructions.mdc`: map design elements to shadcn components (Card, Button, Dialog, Input, Table, etc.); never use raw Tailwind for UI.
4. **Generate ticket** – Fill [ticket-template.md](ticket-template.md):
   - **Scope**: From design (empty state, table columns, modal fields, actions)
   - **Design references**: Include node IDs and URLs
   - **API spec**: Infer from form fields and actions, or use placeholders
   - **File structure**: FSD layout based on design (entity, feature, widget)
5. **Reference patterns** – Use `supplier-head-office`, `supplier-services`, `create-supplier-head-office` for similar screens

## Project Conventions

- **FSD**: Entities (`supplier-contract`, `supplier-contract-closeout`); features (`attach-supplier-contract`, `edit-supplier-contract`); widgets (`supplier-contracts-list`, `supplier-contract-form`)
- **Naming**: `useSupplierContracts`, `SupplierContractsList`, `AttachContractModal`, `useCreateSupplierContract`
- **MSW**: Controllers in `packages/api-client/src/msw/controllers/`; register routes in `handlers.ts`
- **Tests**: `__tests__/` at feature/widget/entity root; hook tests + component integration
- **shadcn/ui**: Dialog, Input, Button, Table, DatePicker; no raw Tailwind for UI components

## Output

- **Single design** → One ticket with all sections filled
- **Multiple designs** → One ticket per design, or combined if same feature; note dependencies

## Reference

- Ticket template: [ticket-template.md](ticket-template.md)
- FSD rules: `.cursor/skills/feature-slice-design/SKILL.md`
- Figma → shadcn mapping: `.cursor/rules/figma-mcp.instructions.mdc`
