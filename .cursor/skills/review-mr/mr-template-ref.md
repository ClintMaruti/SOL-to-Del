# MR Description Template — Fill Rules

Use `.gitlab/merge_request_templates/Default.md` as the base. Fill each section from the diff and review.

## Template Location

`.gitlab/merge_request_templates/Default.md`

## Fill Rules

### Description

- Summarise what the MR does in 2–4 bullet points
- Based on: changed files, new features, fixes, refactors
- Be specific (e.g. "Add cache invalidation for agencies when agents are created/deleted/toggled" not "Fix cache")

### Ticket Reference

- Extract PCP-XXX from: branch name, commit messages, or diff
- Format: `[PCP-XXX](https://your-jira-or-gitlab.com/browse/PCP-XXX)`
- If not found: `[PCP-XXX](https://your-jira-or-gitlab.com/browse/PCP-XXX)` with a note to replace

### Type of Change

- Mark `[x]` for the primary type inferred from changes:
  - Feature: new functionality, new pages/features
  - Bug fix: fixes an issue
  - Refactor: code improvement, no functional change
  - Documentation: docs only
  - Test: adding/updating tests
  - Chore: build, deps, tooling, config
  - Performance: optimisation
  - Hotfix: critical production fix

### Checklist (Code Quality, Testing, Documentation, Security)

- Leave items as `[ ]` so the author/reviewer can tick them
- Optionally add a short note under a section if the review flagged something

### Screenshots (Frontend Only)

- Include only if UI changes
- Suggest: "Add before/after screenshots for UI changes" if relevant
- Leave table with placeholder URLs if no screenshots yet

### Breaking Changes

- Infer from: API changes, route changes, removed exports, type changes
- If yes: describe what broke and migration steps
- If no: leave unchecked

### Additional Notes

- Notable implementation choices from the review
- Dependencies, deployment notes
- Call out patterns used (e.g. "Invalidates agencies + agency-groups on agency CRUD")

### Reviewer Notes

- Suggest focus areas from the review (e.g. "Confirm cache invalidation for nested entities")
- Any areas that need extra attention

## Slash Commands (keep as-is)

```
/label ~"needs-review"
/assign_reviewer @
```

## Output

Output the filled template as a copyable markdown block so the user can paste it into the GitLab MR description.
