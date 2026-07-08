# Review Current Branch with Figma

Review the current branch and compare implemented UI with a Figma design.

**I will provide a Figma URL** – extract fileKey and nodeId, then follow `.cursor/skills/review-mr/SKILL.md`:

1. Get changes: `git diff origin/staging...HEAD` (or `origin/main`)
2. Run code review using `.cursor/skills/review-mr/checklist.md`
3. **Figma comparison** – Call `get_design_context` with the provided URL. Compare layout, spacing (6px radius, 8px), colors, and shadcn/ui usage. Flag deviations.
4. Output: Critical / Suggestions / Nice to have, plus **Design Compliance** section
5. Generate MR description from `.gitlab/merge_request_templates/Default.md`

**Expects:** A Figma URL in my message (e.g. `https://figma.com/design/...?node-id=...`)
