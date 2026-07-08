# Domain agents (`apps/admin`)

Each agent is a **prompt + scope** for Cursor. Invoke them via **slash commands** in `.cursor/commands/`.

| Agent             | Command                    | Prompt file              |
| ----------------- | -------------------------- | ------------------------ |
| Agency network    | `/agency-agent`            | `agency-network.md`      |
| Platform / shell  | `/platform-agent`          | `platform-shell.md`      |
| Supplier network  | `/supplier-agent`          | `supplier-network.md`    |
| Supplier services | `/supplier-services-agent` | `supplier-services.md`   |
| Destination       | `/destination-agent`       | `destination-network.md` |
| Itinerary         | `/itinerary-agent`         | `itinerary.md`           |

**Usage:** Run the slash command, then describe the task in the same message (or follow-up).

**Maintenance:** When adding or renaming FSD slices, pages, or route configs in a domain, update the matching prompt file in the same change so agents stay aligned with the codebase. [`AGENTS.md`](../../AGENTS.md) indexes these agents for Codex and general task routing.
