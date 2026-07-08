# Storybook

Storybook for `@sol/ui` lives in this workspace and reads colocated stories from `packages/ui/src/components/ui`.

## Scripts

- `pnpm storybook`
- `pnpm storybook:build`

## Runtime

- Use the repo's pinned Node version from the root `package.json` engines field.
- Preview loads the same shared `@sol/ui` styles plus lightweight providers for routing, tooltips, and toasts.

## Conventions

- Write CSF stories with typed `Meta` and `StoryObj`
- Add `tags: ["autodocs"]`
- Keep stories focused on public `@sol/ui` APIs
- Prefer `render` stories for interactive states instead of app bootstrapping
