# Agent Handoff Template

Use this file as the source of truth for agent-to-agent build or app work. Keep each workstream section compact. Prefer file paths, commands, run ids, and sha values over long prose.

## Sync Protocol

- source_of_truth: `collab/reviews/build-handoff.md`
- companion_review: `collab/reviews/build-review.md`
- chat_contract: point to files and current git diff; do not restate the full handoff in chat
- section_limit: 10-20 lines per workstream

## Workstream Template

### `<workstream>`

#### Freshness

- status: `<in_progress | awaiting_review | completed>`
- updated_at: `<YYYY-MM-DD HH:mm TZ>`
- owner: `<Codex | Claude Code | name>`
- repo: `D:\projects\Games\pixel-herbarium`
- branch: `<branch>`
- head_sha: `<sha>`

#### Health

- priority: `<P0 | P1 | P2>`
- blocker_count: `<0+>`
- failure_class:
  - `<class>`
- scope:
  - `<what this workstream covers>`

#### Signals

- current_conclusion: `<one concise summary line>`
- key_files:
  - `<path>`
- validation:
  - `<command or evidence>`
- blockers:
  - `<none>` or `<blocking item>`

#### Queue

- next_action:
  1. `<next step>`
- do_not_touch:
  - `<constraint>`
- claude_trigger:
  ```text
  Please sync with the latest work in the current workspace.
  Read:
  - collab/reviews/build-handoff.md
  - collab/reviews/build-review.md
  - PROGRESS.md
  - current uncommitted git diff
  Task:
  - confirm current status
  - confirm whether any blocking issue remains
  - do not reopen implementation unless you find a concrete blocker
  ```
