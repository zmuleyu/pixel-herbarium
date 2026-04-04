# Claude Code Account Continuity

## Goal

Keep development continuity stable when Claude Code work moves between an old account and a new account.

This is a collaboration and tooling constraint, not a product feature for the mobile app.

## Repository Source Of Truth

- `collab/reviews/handoff.md`
- `collab/reviews/review.md`
- `PROGRESS.md`
- current git diff

If chat context is lost during an account switch, the next operator should recover state from these files first.

## Trigger Paths

- Claude Code: `.claude/commands/sync-collab.md`, `.claude/commands/check-collab.md`
- Codex: `docs/codex-task-index.md`
- Shared scripts:
  - `D:\tools\scripts\collab-sync-message.ps1`
  - `D:\tools\scripts\collab-check.ps1`

## Findings From `D:\tools\claude-code-connect-kit`

### Architecture

- The kit is split into `shared`, `node`, and `react`.
- The trusted side reads local Claude login state and launches `claude login`.
- The UI side only consumes a normalized transport contract.

### Local Auth Boundary

- The Node bridge checks `~/.claude/credentials.json` and `~/.claude.json`.
- It returns normalized metadata such as connection state, timestamps, inferred email, inferred subscription type, issues, and suggested actions.
- It must not expose raw token contents.

### Portability Constraint

- Desktop apps may use the Node bridge directly.
- Mobile apps must not read Claude credential files on-device.
- Mobile or React Native surfaces should talk to a trusted desktop companion or local gateway that implements the same transport contract.

### Integration Shape

- Backend or local service mounts `createClaudeAuthRouter()` or calls `getClaudeCodeAuthStatus()` and `launchClaudeCodeLogin()` directly.
- Renderer or web UI uses `ClaudeCodeConnectCard` plus `createFetchClaudeCodeAuthTransport()`.
- Public transport shape should stay stable if reused elsewhere.

## Pixel Herbarium Implications

- Use file-based handoff to bridge old/new Claude accounts during development.
- Do not treat Claude subscription reuse as an in-app mobile login feature.
- If this repo later needs Claude-aware tooling, keep credential access in a trusted desktop-side helper only.
- Any React Native UI should consume normalized status from a trusted transport, never raw local auth files.
- Reuse `claude-code-connect-kit` as a reference for boundaries and transport design, not as a drop-in mobile integration.

## Resume Checklist

1. Read `AGENTS.md`.
2. Read `collab/reviews/handoff.md` and `collab/reviews/review.md`.
3. Read `PROGRESS.md`.
4. Inspect current git diff.
5. Use the repo command files or `D:\tools\scripts\collab-sync-message.ps1` if another Claude/Codex window needs to sync.
