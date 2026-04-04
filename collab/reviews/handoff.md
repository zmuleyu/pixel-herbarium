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
- status: awaiting_review
- updated_at: 2026-04-04
- owner: Claude
- reviewer: Codex
- repo: D:\projects\Games\pixel-herbarium
- branch: dev
- head_sha: 86556d1

### Health
- priority: high
- blocker_count: 0
- failure_class: App Store rejection (Guideline 2.3 + 2.1a)
- scope: safe area insets on 12 screens + metadata text fix + review-notes clarification + buildNumber bump

### Context
Apple rejected v1.1.0 build 5 on 2026-04-03 (iPhone 17 Pro Max, iOS 26.4):
1. **Guideline 2.3**: Metadata says "Apple Sign In" but reviewer couldn't find it (Apple Sign In is on Login page; reviewer went to Signup page)
2. **Guideline 2.1(a)**: "Return" buttons didn't function (back button behind Dynamic Island — paddingTop: 32px vs safe area ~59px)

### Signals
- current_conclusion: all 12 screens now use useSafeAreaInsets() for dynamic top padding; metadata no longer names Apple Sign In; review-notes clarify Apple Sign In location; buildNumber 5→6
- key_files: src/app/(auth)/signup.tsx; src/app/(auth)/login.tsx; src/app/privacy.tsx; src/app/guide.tsx; src/app/plant/[id].tsx; src/app/recap.tsx; src/app/checkin-wizard.tsx; src/app/(tabs)/home.tsx; src/app/(tabs)/checkin.tsx; src/app/(tabs)/settings.tsx; src/app/settings.tsx; src/app/onboarding.tsx; docs/launch/aso/app-store-metadata-ja.md; docs/launch/app-store-prep/review-notes.md; app.json; __mocks__/react-native-safe-area-context.js; jest.config.js
- validation: npm run typecheck (clean); npm test (805 pass, 106 suites, 0 fail)
- blockers: none

### Review Request for Codex
Please review commit `86556d1` against the Apple review feedback:
1. Verify useSafeAreaInsets() is correctly applied to all screens with back buttons — no screen should have hardcoded paddingTop for status bar area
2. Verify metadata text no longer references "Apple Sign In"
3. Verify review-notes clearly state Apple Sign In location (Login screen, not Signup)
4. Check that no regressions were introduced (hook call order, early returns, style merging)
5. Confirm buildNumber is "6" in app.json

Write review outcome to: collab/reviews/review.md

### Queue
- next_action: Codex reviews commit 86556d1; if approved → trigger EAS Build for build 6 → resubmit to ASC
- do_not_touch: auth logic, Supabase config, native entitlements
- sync_trigger: use D:\tools\scripts\collab-sync-message.ps1 -ProjectPath D:\projects\Games\pixel-herbarium -Target Codex -Workstream "App Store Review Fix — build 6"
