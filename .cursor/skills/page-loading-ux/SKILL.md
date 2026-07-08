---
name: page-loading-ux
description: >-
  Apply admin app loading UX when adding routes, detail pages, or data-fetching
  screens: avoid stacked spinners, coordinate Suspense with auth, prefer skeletons.
  Use when implementing new pages, lazy routes, or refactoring loading states.
---

# Page loading UX

Read and follow the project rule (authoritative detail and examples):

**`.cursor/rules/page-loading-ux.mdc`**

Summary:

- **Auth** owns the fullscreen loader; **Suspense** fallbacks must not duplicate it (see `SmartPageSkeleton` in `route-builder.tsx`).
- **Data loading** on detail/heavy pages: prefer **skeleton components** (`*DetailSkeleton`, `Skeleton` / `SkeletonCard`) inside layout, not a second full-page `PageLoader`.
- Reuse existing list/table skeleton patterns where applicable.

If the rule and codebase disagree, follow the **current implementation** in `route-builder.tsx` and existing detail pages, then update the rule if needed.
