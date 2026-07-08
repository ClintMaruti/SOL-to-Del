---
name: review-mr
description: Reviews merge request changes on the current branch, optionally compares with Figma designs, and generates an MR description from the project template. Use when the user asks to review current branch, pre-push check, or review my MR.
---

# MR Review

Reviews code changes on the current branch against project standards, optionally compares with Figma when a URL is provided, and generates an MR description for GitLab.

## When to Use

- User says "Review current branch", "Review my MR", "Pre-push check"
- User is about to push and wants validation before creating the MR
- User provides a Figma URL for design comparison (e.g. "Review current branch and compare with [Figma URL]")

## Workflow

### 1. Get Changes

Determine the base branch (develop) and run:

```bash
git diff origin/develop...HEAD --name-only
git diff origin/develop...HEAD
```

### 2. Run Code Review

Apply the checklist from [checklist.md](checklist.md). Key project rules:

- **FSD** – Layer hierarchy (app → pages → widgets → features → entities → shared)
- **TanStack Query** – Cache invalidation after mutations, optimistic + reconciliation
- **Form state** – Reset on modal close, unsaved changes flow
- **Validation** – Field-level errors, `Array.isArray` guards
- **Search** – Min 3 chars, debounce, no unintended URL persistence
- **shadcn/ui** – Use components, not raw Tailwind for UI
- **Form UI** – 6px radius, 8px spacing between form fields

Reference: `.cursor/rules/*.mdc`, `.cursor/skills/feature-slice-design/SKILL.md`

### 3. Optional Figma Comparison

If user provides a Figma URL (e.g. `figma.com/design/...?node-id=...`):

1. Call Figma MCP `get_design_context` with fileKey and nodeId
2. Compare implemented UI to design: layout, spacing, colors, components
3. Flag deviations (e.g. wrong radius, spacing, missing shadcn/ui usage)

### 4. Output Format

**Review section:**

```markdown
## Critical (must fix)

- [Item]

## Suggestions (consider)

- [Item]

## Nice to have

- [Item]
```

**MR Description:**

Generate from the project template. See [mr-template-ref.md](mr-template-ref.md) for fill rules. Output a ready-to-paste block the user can copy into GitLab.

### 5. Ticket Reference

Extract PCP-XXX from branch name, commit messages, or diff. Use placeholder if not found.

## Examples

**User:** "Review current branch"

**Agent:** Runs git diff, reviews against checklist, outputs review + MR description.

**User:** "Pre-push check — generate MR description"

**Agent:** Same as above; emphasises MR description for copy-paste.

**User:** "Review current branch. Figma: https://figma.com/design/abc123/Page?node-id=1-2"

**Agent:** Reviews code, fetches Figma design, compares UI, outputs review + design compliance notes + MR description.
