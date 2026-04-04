# Agent Review Template

Use this file to record the review decision for the active workstream only. Keep the review focused on the current state, current diff, and the next direct action.

## Sync Protocol

- source_of_truth: `collab/reviews/build-review.md`
- companion_handoff: `collab/reviews/build-handoff.md`
- chat_contract: review should reference the current workspace and avoid full-history recap
- issue_limit: record blocking issues first; if strong governance is active, keep only the first real blocker

## Workstream Review Template

### `<workstream>`

#### Freshness

- reviewer: `<Claude Code | Codex | name>`
- reviewed_at: `<YYYY-MM-DD HH:mm TZ>`
- repo: `D:\projects\Games\pixel-herbarium`
- branch: `<branch>`
- head_sha: `<sha>`

#### Health

- review_status: `<approved | approved_with_notes | blocked>`
- blocking_issue_count: `<0+>`
- first_blocker:
  - file: `<path or none>`
  - line: `<line or none>`
  - message: `<message or none>`

#### Signals

- scope_seen:
  - `<what was reviewed>`
- verification_seen:
  - `<command, run id, or evidence>`
- residual_risks:
  - `<none>` or `<remaining non-blocking risk>`

#### Queue

- recommended_next_action:
  - `<single direct next step>`
- review_notes:
  - no strategy restart
  - no full-history recap
  - prefer current diff over chat summary if they disagree
