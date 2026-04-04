# Agent Handoff

## Sync Protocol

- This file is the cross-agent source of truth for the active PH workstream.
- Keep each workstream section short and evidence-based.
- Use `build-handoff.md` only for legacy build-specific transfer notes.

## Workstream: App Stability Optimization

### Freshness
- status: completed
- updated_at: 2026-04-02
- owner: Codex
- repo: D:\projects\Games\pixel-herbarium
- branch: current workspace
- head_sha: workspace-local

### Health
- priority: high
- blocker_count: 0
- failure_class: stabilized with dirty-worktree follow-up
- scope: error handling, guest loading, settings storage reset, stamp/share flow, regression tests

### Signals
- current_conclusion: no blocking stability issue remains after the focused remediation pass
- key_files: src/hooks/usePlantDetail.ts; src/hooks/useNearbyDiscoveries.ts; src/components/ShareSheet.tsx; src/components/stamps/GestureStampOverlay.tsx; src/utils/app-storage.ts
- validation: npm run typecheck; focused Jest coverage for plant detail, nearby discoveries, share sheet, stamp overlay, analytics, settings/privacy flows
- blockers: worktree still contains many pre-existing uncommitted business changes and generated artifacts, so future commits should be scoped carefully

### Queue
- next_action: keep this workstream closed unless a concrete blocker is found in a fresh review; before any commit or PR, separate collab-toolkit files from unrelated business changes
- do_not_touch: auth, schema, deploy config, release strategy
- sync_trigger: use D:\tools\scripts\collab-sync-message.ps1 -ProjectPath D:\projects\Games\pixel-herbarium -Target Claude -Workstream "App Stability Optimization"

## Workstream: Claude Code Account Continuity

### Freshness
- status: completed
- updated_at: 2026-04-04
- owner: Codex
- repo: D:\projects\Games\pixel-herbarium
- branch: current workspace
- head_sha: workspace-local

### Health
- priority: medium
- blocker_count: 0
- failure_class: context loss across old/new Claude Code account switches
- scope: repo-local sync workflow, trigger files, and desktop-bridge constraints derived from D:\tools and claude-code-connect-kit

### Signals
- current_conclusion: this repo now follows the D:\tools collab sync pattern for old/new Claude account handoff, and the connect-kit findings are documented as desktop-only auth-boundary guidance
- key_files: AGENTS.md; CLAUDE.md; docs/dev/claude-code-account-continuity.md; .claude/commands/sync-collab.md; .claude/commands/check-collab.md; docs/codex-task-index.md
- validation: powershell -File D:\tools\scripts\collab-check.ps1 -ProjectPath D:\projects\Games\pixel-herbarium
- blockers: none

### Queue
- next_action: on the next account switch, recover from handoff.md/review.md/PROGRESS.md/current git diff first; reuse the new continuity doc only as supporting guidance
- do_not_touch: mobile auth flow, production secrets, embedded credential access in app runtime
- sync_trigger: use D:\tools\scripts\collab-sync-message.ps1 -ProjectPath D:\projects\Games\pixel-herbarium -Target Claude -Workstream "Claude Code Account Continuity"
