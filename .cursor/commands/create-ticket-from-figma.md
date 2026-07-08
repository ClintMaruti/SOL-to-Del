# Create Ticket From Figma

Create a feature ticket from one or more Figma design(s).

**Follow the workflow in `.cursor/skills/create-tickets/SKILL.md`:**

1. **Fetch design(s)** – Call Figma MCP `get_design_context` for each provided Figma URL. Extract fileKey and nodeId from URLs (e.g. `figma.com/design/:fileKey/...?node-id=:nodeId`; convert `-` to `:` in nodeId).
2. **Extract from design** – Layout, components, text labels, form fields, states (empty, filled, error), interactions (buttons, modals, tables).
3. **Generate ticket** – Fill all sections using `.cursor/skills/create-tickets/ticket-template.md`: Title, Description, Scope (from design), Design references (node IDs/URLs), API spec (infer or placeholder), Testing, MSW, File structure. Use shadcn/ui component mapping per `.cursor/rules/figma-mcp.instructions.mdc`.
4. **Align with project** – FSD structure; reference `supplier-head-office`, `supplier-services`, `create-supplier-head-office` for patterns.

**Input:** One or more Figma URLs in the message.

**Output:** A complete ticket block ready to paste into Jira or GitLab.

---

Example:

```
Create ticket from:
https://figma.com/design/abc123/Page?node-id=4587-41245
https://figma.com/design/abc123/Page?node-id=4587-47855
```
