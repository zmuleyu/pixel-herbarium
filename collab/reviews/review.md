# Agent Review

## Review Protocol

- This file records review outcomes for cross-agent collaboration.
- Use `build-review.md` only for legacy build-specific review notes.

## Workstream: App Stability Optimization

### Freshness
- reviewer: Claude/Codex sync target
- reviewed_at: 2026-04-02
- repo: D:\projects\Games\pixel-herbarium
- branch: current workspace
- head_sha: workspace-local

### Health
- review_status: approved_with_notes
- blocking_issue_count: 0
- first_blocker: none

### Signals
- scope_seen: stability fixes, write-error handling, guest loading, storage reset, share/stamp flow, focused regression coverage
- verification_seen: npm run typecheck; targeted suites for analytics, nearby discoveries, plant detail, stamps, share sheet, settings/privacy
- residual_risks: existing React test-environment act warnings remain noisy but are not treated as product regressions; the repo worktree is still dirty with many unrelated uncommitted changes, so release packaging needs an explicit staging pass

### Queue
- recommended_next_action: close the workstream and only reopen if a concrete blocker appears
- review_notes: prefer the generic handoff/review files for future sync, keep build-specific files for build/release work only

## Workstream: App Store Review Fix - build 6

### Freshness
- reviewer: Codex
- reviewed_at: 2026-04-04
- repo: D:\projects\Games\pixel-herbarium
- branch: dev
- head_sha: 86556d1

### Health
- review_status: request_changes
- blocking_issue_count: 1
- first_blocker: `src/app/friend/[id].tsx` still renders a custom top-edge back/header row without any safe-area inset handling, so the same Dynamic Island tap-target regression class is still present on a full-screen route

### Findings
- blocker: [`src/app/friend/[id].tsx:51`](D:/projects/Games/pixel-herbarium/src/app/friend/[id].tsx#L51) and [`src/app/friend/[id].tsx:121`](D:/projects/Games/pixel-herbarium/src/app/friend/[id].tsx#L121) still use a plain root container plus header `paddingVertical` for the top row; unlike the 12 touched screens, this route does not use `useSafeAreaInsets()` or any other safe-area wrapper, and its back button remains anchored in the unsafe top region on Dynamic Island devices

### Signals
- scope_seen: inspected the 12 touched screens in `86556d1`, audited other app routes with custom top-edge back/header controls, and checked metadata/review-note docs plus `app.json`
- safe_area_fix_status: the 12 edited screens correctly replaced hardcoded top spacing with `useSafeAreaInsets()` and their inline style merges no longer conflict with static `paddingTop`/`top` definitions
- hook_order_status: [`src/app/plant/[id].tsx:53`](D:/projects/Games/pixel-herbarium/src/app/plant/[id].tsx#L53) calls `useSafeAreaInsets()` before the `loading` and `error || !plant` early returns at [`src/app/plant/[id].tsx:70`](D:/projects/Games/pixel-herbarium/src/app/plant/[id].tsx#L70) and [`src/app/plant/[id].tsx:78`](D:/projects/Games/pixel-herbarium/src/app/plant/[id].tsx#L78)
- metadata_status: Japanese ASC metadata no longer references Apple Sign In in the guest-mode copy around [`docs/launch/aso/app-store-metadata-ja.md:95`](D:/projects/Games/pixel-herbarium/docs/launch/aso/app-store-metadata-ja.md#L95), and review notes now explicitly place Apple Sign In on the Login screen at [`docs/launch/app-store-prep/review-notes.md:44`](D:/projects/Games/pixel-herbarium/docs/launch/app-store-prep/review-notes.md#L44) and [`docs/launch/app-store-prep/review-notes.md:90`](D:/projects/Games/pixel-herbarium/docs/launch/app-store-prep/review-notes.md#L90)
- metadata_follow_up: English metadata still says "Create an account with Apple Sign In" at [`docs/launch/aso/app-store-metadata-en.md:73`](D:/projects/Games/pixel-herbarium/docs/launch/aso/app-store-metadata-en.md#L73); given repo docs point release metadata updates to the Japanese file, I am treating this as a consistency follow-up rather than the blocker for this review
- build_number_status: `app.json` has `ios.buildNumber = "6"` at [`app.json:18`](D:/projects/Games/pixel-herbarium/app.json#L18)
- verification_seen: `npm run typecheck` clean; `npm test` passed with `106` suites / `805` tests
- residual_risks: Jest still emits existing React `act(...)` environment warnings during passing runs; nothing in the logs ties those warnings to this safe-area fix

### Queue
- recommended_next_action: patch `src/app/friend/[id].tsx` to apply safe-area top padding to its custom header/back control, then rerun `npm run typecheck` and `npm test` before resubmission
- review_notes: once the friend herbarium screen is fixed, this review can likely move to approved_with_notes; keep the English metadata string in the follow-up queue unless ASC English localization is confirmed active for this submission
