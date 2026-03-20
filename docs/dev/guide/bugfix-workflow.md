# Bugfix Development Workflow

Standard process for reporting, diagnosing, fixing, and documenting bugs in Pixel Herbarium.

---

## 1. Issue Collection

### From User (video/screenshot/text)
- User sends **screen recording** (MP4) or **screenshot** (PNG/JPG)
- User describes the symptom in text

### Video Analysis (when MP4 provided)
```bash
# Extract frames for Claude analysis
ffmpeg -i "video.mp4" -vf "fps=1/3" -frames:v 8 "frame_%02d.png" -y

# Quick: extract specific timestamps
ffmpeg -i "video.mp4" -ss 2 -frames:v 1 "frame_t2.png" -y
```
See `~/.claude/workflows/analyze-app-video.md` for full workflow.

### Common Visual Patterns

| Visual | Likely Cause |
|--------|-------------|
| Spinner never stops | Auth bootstrap hang, missing redirect, Promise.all blocked |
| White screen / flash | JS crash (check ErrorBoundary), missing loading state |
| Spinner then login | Session null (timeout fallback working correctly) |
| Text shows key name (e.g. `auth.signIn`) | i18n JSON missing that key |
| Layout broken | StyleSheet color/spacing path error |

---

## 2. Severity Classification

| Level | Criteria | Response Time | Fix Method |
|-------|----------|---------------|------------|
| **P0** | App unusable (crash, infinite spinner, can't login) | Immediate | Native build |
| **P1** | Feature broken (can't capture, can't share, data loss) | Same day | OTA preferred, native if needed |
| **P2** | UX issue (wrong text, layout glitch, slow load) | Next session | OTA only |

---

## 3. Diagnosis Checklist

### Startup Chain (P0 spinner issues)
- [ ] `_layout.tsx` bootstrap: does `setLoading(false)` execute?
- [ ] `restoreLanguage()`: does SecureStore resolve?
- [ ] `getSession()`: does Supabase respond?
- [ ] Redirect useEffect: does `segments[0]` match expected value?
- [ ] `index.tsx`: does `<Redirect>` fire?
- [ ] 15s ultimate timeout: does it fire as fallback?

### Navigation Chain (wrong screen / redirect loop)
- [ ] `useSegments()` value at current route?
- [ ] `SecureStore.getItemAsync(ONBOARDING_KEY)` returns expected value?
- [ ] `onAuthStateChange` subscription active?
- [ ] Notification handler conflicting with redirect?

### Data Chain (feature broken)
- [ ] `user?.id` available when hook runs?
- [ ] Supabase query returns expected data?
- [ ] RLS policy allows access?
- [ ] Network connectivity (OfflineBanner showing?)

---

## 4. Fix & Verification

### OTA vs Native Build Decision

```
Is the bug in currently-running code on user's device?
  ├── YES → Does old code block the app entirely?
  │    ├── YES → Native build (OTA can't fix old code)
  │    └── NO  → OTA push (user can still use app while downloading)
  └── NO (new feature, not yet deployed)
       └── OTA push
```

### OTA Push
```bash
CI=1 npx eas update --branch preview --environment preview --message "fix: description"
```
Remind user: **two full cold starts** needed (close → open → close → open).

### Native Build
```bash
npx eas build --profile preview --platform ios --no-wait
```
Monitor: `npx eas build:view <build-id>`

### OTA Safety Check (before push)
- [ ] No new `useState` / `useEffect` / `useRef` / `useMemo` / `useCallback` added to `_layout.tsx`
- [ ] No hooks added/removed in any persistent layout file (`(tabs)/_layout.tsx`, `(auth)/_layout.tsx`)
- [ ] Route components (non-layout) can change hooks freely (fresh mount on navigation)

---

## 5. Documentation

### When to Write a Postmortem
- Any P0 bug
- Any bug that required 2+ fix attempts
- Any bug that affected real users

### Postmortem Location
`docs/postmortems/YYYY-MM-DD-short-description.md`

### Postmortem Template
```markdown
# Postmortem: [Title]

**Date:** YYYY-MM-DD
**Severity:** P0/P1/P2
**Commits:** [list]

## Symptom
[What the user saw]

## Root Cause(s)
[What went wrong in the code]

## Fix
[What was changed]

## Key Takeaways
[Lessons for future development]
```

### Memory Update
After fixing, update relevant memory file:
- Startup bugs → `ph-mobile-dev.md` Section 9
- Auth bugs → `ph-mobile-dev.md` Section 7
- OTA bugs → `ph-mobile-dev.md` Section 5
- New lesson → `~/.claude/lessons.md`
