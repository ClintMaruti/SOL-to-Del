# Pre-Push Check

Run MR checks before pushing. Validates changes and generates an MR description ready to paste into GitLab.

**Follow the workflow in `.cursor/skills/review-mr/SKILL.md`:**

1. Get changes: `git diff origin/staging...HEAD` (or `origin/main` if staging doesn't exist)
2. Run code review using `.cursor/skills/review-mr/checklist.md`
3. Apply project rules from `.cursor/rules/*.mdc`
4. Output: Critical / Suggestions / Nice to have
5. **Generate MR description** – output a copyable block for GitLab using `.gitlab/merge_request_templates/Default.md` and `.cursor/skills/review-mr/mr-template-ref.md`

Treat this as a final validation before creating the MR. Emphasise any issues that should be fixed before push.
