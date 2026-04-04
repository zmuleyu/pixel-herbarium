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

## Workstream: App Store Review Fix — build 6 (Re-Review)

### Freshness
- reviewer: Codex (pending)
- reviewed_at: pending
- repo: D:\projects\Games\pixel-herbarium
- branch: dev
- head_sha: 2a15dc8 (incremental on 86556d1)

### Re-Review Scope
Commit `2a15dc8` addresses the 1 blocker and 1 follow-up from the previous review:

1. **Blocker fixed**: `src/app/friend/[id].tsx` now imports `useSafeAreaInsets` and applies `paddingTop: insets.top + spacing.sm` to the header View. Back button is no longer in the unsafe top region.

2. **EN metadata follow-up fixed**: `docs/launch/aso/app-store-metadata-en.md` line 73 changed from `Create an account with Apple Sign In` to `Create an account`.

### Checklist for Codex
- [ ] `src/app/friend/[id].tsx` — `useSafeAreaInsets()` called at top of component (before any early returns), header View has dynamic paddingTop
- [ ] `docs/launch/aso/app-store-metadata-en.md` — no "Apple Sign In" anywhere in document
- [ ] No new typecheck errors (previous: clean)
- [ ] No test count regression (previous: 805 pass / 106 suites)

### Expected Outcome
If all checklist items pass → update `review_status` to `approved_with_notes` → Claude triggers EAS Build 6 → resubmit to ASC

## Workstream: App Store Review Fix - build 6 (Top-Edge Audit Follow-Up)

### Freshness
- reviewer: Codex
- reviewed_at: 2026-04-04
- repo: D:\projects\Games\pixel-herbarium
- branch: dev
- head_sha: workspace-local after Claude-confirmed follow-up patch

### Health
- review_status: approved_with_notes
- blocking_issue_count: 0
- first_blocker: none

### Findings
- fixed: [src/app/(tabs)/footprint.tsx](D:/projects/Games/pixel-herbarium/src/app/(tabs)/footprint.tsx) now imports `useSafeAreaInsets()` and applies dynamic top padding to the custom header instead of relying on fixed `spacing`
- fixed: [src/app/(tabs)/herbarium.tsx](D:/projects/Games/pixel-herbarium/src/app/(tabs)/herbarium.tsx) now applies dynamic top padding to the title/recap header
- fixed: [src/app/(tabs)/map.tsx](D:/projects/Games/pixel-herbarium/src/app/(tabs)/map.tsx) now applies dynamic top padding to the multi-control top toolbar
- fixed: [src/app/(tabs)/profile.tsx](D:/projects/Games/pixel-herbarium/src/app/(tabs)/profile.tsx) now derives the top content offset from `useSafeAreaInsets()` instead of fixed `paddingTop: spacing.xl`

### Signals
- scope_seen: limited to the 4 Claude-confirmed candidate tab pages; no expansion beyond the approved scope
- hook_order_status: each new `useSafeAreaInsets()` call is at the top of the component body before any early return
- regression_status: no new back-navigation logic was introduced; only top-edge spacing behavior changed on the 4 approved pages
- verification_seen: `npm run typecheck` clean; `npm test` passed; existing React `act(...)` / `react-test-renderer` warnings remain noisy but were already present and did not fail the run
- residual_risks: this review did not re-open unrelated screens outside the 4-page Claude-approved follow-up scope

### Queue
- recommended_next_action: trigger EAS Build 6; after build is processed by ASC, switch build and resubmit for App Store review
- review_notes: the top-edge follow-up is complete for the approved 4-page scope; remaining warnings are pre-existing test-environment noise

### Claude Final Sign-Off 2026-04-04
- sign_off_status: **approved** — no blocker
- verified_by: Claude (file-based code inspection)
- coverage: 17 screens with `useSafeAreaInsets()` top-edge layout; JA + EN metadata clean; buildNumber "6"
- cleared_for: EAS Build 6 + ASC resubmission
