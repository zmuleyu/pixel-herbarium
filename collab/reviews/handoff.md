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

## Workstream: Session Sync 2026-04-04

### Freshness
- status: completed
- updated_at: 2026-04-04
- owner: Claude
- repo: D:\projects\Games\pixel-herbarium
- branch: dev
- head_sha: 2528584

### Health
- priority: low
- blocker_count: 0
- failure_class: none
- scope: workspace cleanup, stability commit, i18n bug fix

### Signals
- current_conclusion: workspace clean; 806 tests / 106 suites GREEN; typecheck clean; guide system fully implemented and i18n-complete
- key_files: src/app/guide.tsx; src/i18n/en.json; src/i18n/ja.json; __tests__/screens/GuideScreen.test.tsx; CLAUDE.md; docs/dev/claude-code-account-continuity.md
- validation: npm run typecheck (clean); npm test (806 pass, 0 fail)
- blockers: none — Apple review pending since 2026-04-01 (build 5); Layer 3 & 4 features are post-approval

### Queue
- next_action: await Apple review result; if approved → update rejection-playbook + MEMORY; if rejected → follow rejection-playbook; Layer 3 (permissions/guidance UX) and Layer 4 (watermark editor) start after approval
- do_not_touch: auth, schema, deploy config, release strategy
- feat/in-app-guidance branch: stale (11 commits behind dev divergence point, guide components already in dev — can be deleted)
- sync_trigger: use D:\tools\scripts\collab-sync-message.ps1 -ProjectPath D:\projects\Games\pixel-herbarium -Target Claude -Workstream "Session Sync 2026-04-04"

## Workstream: App Store Review Fix — build 6

### Freshness
- status: awaiting_re_review
- updated_at: 2026-04-04
- owner: Claude
- reviewer: Codex
- repo: D:\projects\Games\pixel-herbarium
- branch: dev
- head_sha: 2a15dc8

### Health
- priority: high
- blocker_count: 0
- failure_class: App Store rejection (Guideline 2.3 + 2.1a)
- scope: safe area insets on 13 screens (12 original + friend/[id].tsx) + EN metadata fix + buildNumber bump

### Context
Apple rejected v1.1.0 build 5 on 2026-04-03 (iPhone 17 Pro Max, iOS 26.4):
1. **Guideline 2.3**: Metadata says "Apple Sign In" but reviewer couldn't find it (Apple Sign In is on Login page; reviewer went to Signup page)
2. **Guideline 2.1(a)**: "Return" buttons didn't function (back button behind Dynamic Island — paddingTop: 32px vs safe area ~59px)

Codex reviewed commit `86556d1` and found 1 blocker:
- `src/app/friend/[id].tsx` was missing `useSafeAreaInsets()` — back button in unsafe top region

Commit `2a15dc8` addresses both the blocker and the EN metadata follow-up:
- `src/app/friend/[id].tsx`: added `useSafeAreaInsets()`, header now uses `paddingTop: insets.top + spacing.sm`
- `docs/launch/aso/app-store-metadata-en.md:73`: removed "Apple Sign In" reference

### Signals
- current_conclusion: all 13 screens (12+friend) now use useSafeAreaInsets(); both JA and EN metadata clean; review-notes clarify Apple Sign In location; buildNumber 5→6
- key_files: src/app/friend/[id].tsx; docs/launch/aso/app-store-metadata-en.md (new in 2a15dc8); all 12 original files from 86556d1
- validation: npm run typecheck (clean); npm test (805 pass, 106 suites, 0 fail)
- blockers: none

### Audit Extension — Claude Confirmed 2026-04-04
- status_gate: **CONFIRMED** — Codex may proceed with patching all 4 candidate pages
- confirmed_by: Claude
- confirmed_at: 2026-04-04
- decision: fix exactly the 4 candidate pages below; do not expand into general UI cleanup
- decision_rationale:
  - footprint: header `paddingTop: spacing.lg` at line 124 — no inset handling ✓ needs fix
  - herbarium: header `paddingVertical: spacing.sm` only — title/recap button unguarded ✓ needs fix
  - map: header `paddingVertical: spacing.sm` at line 298, no inset handling ✓ needs fix
  - profile: container `paddingTop: spacing.xl` at line 149 — no back button but can clip under Dynamic Island ✓ needs fix (lower priority but in scope)
- scope_boundary: stop at these 4 tabs; do not sweep other screens; non-findings below remain excluded
- audit_rules: top-edge interactive controls must not rely on fixed top spacing alone; custom headers near the top edge must use `useSafeAreaInsets()` when layout can enter the unsafe region; routes with custom back controls must keep `router.canGoBack()` guards
- candidate_pages: `src/app/(tabs)/footprint.tsx`; `src/app/(tabs)/herbarium.tsx`; `src/app/(tabs)/map.tsx`; `src/app/(tabs)/profile.tsx`
- current_findings (confirmed):
  - `src/app/(tabs)/footprint.tsx` uses a custom top header with `paddingTop: spacing.lg` and no safe-area handling
  - `src/app/(tabs)/herbarium.tsx` uses a custom top header with only `paddingVertical: spacing.sm`; title and recap button sit at the top edge without explicit inset handling
  - `src/app/(tabs)/map.tsx` uses a custom top toolbar (`paddingVertical: spacing.sm`, no inset) with multiple top-edge controls
  - `src/app/(tabs)/profile.tsx` uses a top-aligned full-screen layout with `paddingTop: spacing.xl` and no safe-area handling; lower priority, patch last
- non_findings (excluded — do not touch):
  - `src/app/(tabs)/home.tsx`, `src/app/(tabs)/checkin.tsx`, and `src/app/(tabs)/settings.tsx` already apply dynamic top padding from `useSafeAreaInsets()`
  - `src/app/invite/[code].tsx` is center-aligned and not part of the top-edge header risk class

### Re-Review Request for Codex
Previous review commit: `86556d1` — status: request_changes (1 blocker)
New commit: `2a15dc8` — blocker fix + EN metadata follow-up

Please re-verify:
1. `src/app/friend/[id].tsx` — confirm `useSafeAreaInsets()` applied, header paddingTop dynamic
2. `docs/launch/aso/app-store-metadata-en.md` — confirm no "Apple Sign In" reference remains
3. Confirm no new regressions (typecheck + test counts unchanged from 86556d1)

If approved, update collab/reviews/review.md status to `approved_with_notes`.

### Queue
- next_action: Codex patches the 4 confirmed candidate tab pages (footprint, herbarium, map, profile) with `useSafeAreaInsets()`, reruns `npm run typecheck` and `npm test`, then requests a final Claude sign-off before EAS Build 6 triggers
- do_not_touch: auth logic, Supabase config, native entitlements
- sync_trigger: use D:\tools\scripts\collab-sync-message.ps1 -ProjectPath D:\projects\Games\pixel-herbarium -Target Claude -Workstream "App Store Review Fix — build 6"

### Execution Update 2026-04-04
- patched_pages: `src/app/(tabs)/footprint.tsx`; `src/app/(tabs)/herbarium.tsx`; `src/app/(tabs)/map.tsx`; `src/app/(tabs)/profile.tsx`
- patch_pattern:
  - footprint/header: `paddingTop: insets.top + spacing.md`
  - herbarium/header: `paddingTop: insets.top + spacing.sm`
  - map/header: `paddingTop: insets.top + spacing.sm`
  - profile/container: replaced fixed `paddingTop: spacing.xl` with dynamic `paddingTop: insets.top + spacing.lg`
- validation_update:
  - `npm run typecheck` clean
  - `npm test` pass; existing React `act(...)` / `react-test-renderer` warnings remain but did not fail the run

### Claude Final Sign-Off 2026-04-04
- status: **APPROVED — EAS Build 6 may proceed**
- signed_off_by: Claude
- signed_off_at: 2026-04-04
- verified_files:
  - footprint: hook at L71 (before any early return), header uses `[styles.header, { paddingTop: insets.top + spacing.md }]` ✓
  - herbarium: hook at L44 (before any early return), header uses `[styles.header, { paddingTop: insets.top + spacing.sm }]` ✓
  - map: hook at L46 (early returns at L112/L121 are both after hook), header uses `[styles.header, { paddingTop: insets.top + spacing.sm }]` ✓
  - profile: hook at L25 (early return at L33 is after hook), container uses `[styles.container, { paddingTop: insets.top + spacing.lg }]` ✓
- coverage_summary: 17 screens total now use `useSafeAreaInsets()` for top-edge layout — 12 original (86556d1) + friend/[id].tsx (2a15dc8) + 4 tabs (current patch)
- residual_note: footprint `styles.header` retains `paddingTop: spacing.lg` as dead-code in StyleSheet; inline override wins — same pattern as all 12 original fixes; not a blocker
- metadata_confirmed: JA metadata clean; EN metadata clean (Apple Sign In removed); review-notes updated ✓
- buildNumber: "6" in app.json ✓
