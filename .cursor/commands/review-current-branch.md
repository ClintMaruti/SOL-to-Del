# Review Current Branch

Review the changes on the current branch against project standards and generate an MR description.

**Follow the workflow in `.cursor/skills/review-mr/SKILL.md`:**

1. Get changes: `git diff origin/staging...HEAD` (or `origin/main` if staging doesn't exist)
2. Run code review using `.cursor/skills/review-mr/checklist.md`
3. Apply project rules from `.cursor/rules/*.mdc`
4. Output: Critical / Suggestions / Nice to have
5. Generate MR description from `.gitlab/merge_request_templates/Default.md` using rules in `.cursor/skills/review-mr/mr-template-ref.md`

**If I provide a Figma URL** in this message, also fetch the design via Figma MCP and compare UI for design compliance.
