# Postmortem: Infinite Loading Spinner on Cold Start

**Date:** 2026-03-18
**Severity:** P0 (App unusable)
**Resolution:** 4 commits, 1 native build, 3 OTA pushes
**Commits:** `0926773` → `9f32f5f` → `2a7bafd` → `cc08250`
**Build:** `0054cdeb` (preview, iOS)

---

## Symptom

App cold start shows a green loading spinner that never disappears. User cannot access any screen. Affects both online and offline scenarios.

## Timeline

| Round | Fix | Why It Didn't Work |
|-------|-----|--------------------|
| 1 | `withTimeout(getSession(), 8000)` | Only fixed offline/slow-network hang. Online with valid session still stuck. |
| 2 | `segments.length === 0` redirect condition | Expo Router 55 may return `['index']` or `['']` for root `/`, not `[]`. Condition never matched. |
| 3 | `<Redirect>` in index.tsx + restoreLanguage timeout + broader redirect condition + 15s ultimate timeout | All five layers working together — problem fully resolved. |
| - | Native build `0054cdeb` | Eliminated OTA two-restart chicken-and-egg problem. |

## Root Causes (5 layers)

### 1. `index.tsx` was a dead end
`src/app/index.tsx` rendered only `<ActivityIndicator>` with zero navigation logic. It relied entirely on `_layout.tsx`'s redirect useEffect to move the user away. If that redirect didn't fire, the user was stuck forever.

**Fix:** Replace spinner with `<Redirect href="/(tabs)/discover" />` from expo-router.

### 2. `restoreLanguage()` had no timeout
`src/i18n/index.ts:restoreLanguage()` calls `SecureStore.getItemAsync()` which can hang indefinitely. The `.catch(() => {})` wrapper only handles rejection, not hanging. Since it's in `Promise.all`, a hang blocks `setLoading(false)` forever.

**Fix:** `withTimeout(restoreLanguage().catch(() => {}), 3000, undefined)`

### 3. `getSession()` hangs on weak/offline network
`supabase.auth.getSession()` neither resolves nor rejects when the network is unavailable.

**Fix:** `withTimeout(supabase.auth.getSession(), 8000, { data: { session: null }, error: null })`

### 4. Redirect condition too narrow
`segments.length === 0` only matches one of several possible representations of the root route `/` in Expo Router. Depending on version and timing, `useSegments()` may return `[]`, `['']`, or `['index']`.

**Fix:** `!segments[0] || segments[0] === 'index'` covers all variants.

### 5. No ultimate safety net
If ALL promises hang (SecureStore + Supabase + i18n), no fallback existed.

**Fix:** `setTimeout(() => setLoading(false), 15000)` in the bootstrap useEffect — force the app to become usable after 15 seconds no matter what.

## Final Architecture: `_layout.tsx` Bootstrap

```
Cold Start
  │
  ├── loading = true → show <ActivityIndicator>
  │
  ├── Promise.all([
  │     withTimeout(restoreLanguage(), 3s),    ← Layer 2
  │     withTimeout(getSession(), 8s),          ← Layer 3
  │   ])
  │   └── .then() → setLoading(false)
  │
  ├── setTimeout(setLoading(false), 15s)       ← Layer 5 (ultimate)
  │
  ├── loading = false → render <Slot>
  │   └── index.tsx → <Redirect to discover>   ← Layer 1
  │
  └── redirect useEffect
      └── !segments[0] || 'index' → discover   ← Layer 4
      └── !session → login
      └── !onboarding → onboarding
```

## OTA vs Native Build Lesson

OTA updates require **two full cold starts** to apply:
1. First start: downloads update in background, continues running old code
2. Second start: applies downloaded update

If the old code has a blocking bug (like this spinner), the user is stuck on broken code while the fix downloads. **Solution: push a native build** to bypass the OTA transition period entirely.

## Key Takeaways

1. **Root index must self-navigate** — never rely on parent layout to rescue a dead-end child route
2. **Every promise in `Promise.all` needs its own timeout** — `.catch()` prevents rejection, not hanging
3. **`useSegments()` return value is not stable** across Expo Router versions — use broad matching
4. **Bootstrap needs an ultimate safety net** — `setTimeout(() => setLoading(false), N)` ensures the app always becomes usable
5. **OTA can't fix old code** — when old code has a blocking bug, a native build is the only immediate fix
