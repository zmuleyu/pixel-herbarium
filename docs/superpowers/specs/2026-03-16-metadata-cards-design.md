# Plant Detail Metadata Cards — Design Spec

**Date**: 2026-03-16
**Status**: Approved
**Scope**: `plant/[id].tsx` — style-only change, 3 sections

## Summary

Wrap the three metadata sections (hanakotoba, bloom calendar, prefectures) in card
containers matching the existing `lockedCard` visual style. This creates a unified
card-based information architecture on the plant detail page, complementing the
gradient hero area added in the previous feature.

## Motivation

- **UI reference**: Xiaohongshu insect identification app — structured info cards
- **Visual consistency**: `lockedCard` already uses white + border + rounded corners;
  metadata sections currently float without containers, creating a visual gap
- **Adult Kawaii alignment**: Card containers add warmth and structure without heaviness

## Design

### New style: `metadataCard`

```typescript
metadataCard: {
  width: '100%',
  backgroundColor: colors.white,    // #ffffff
  borderRadius: borderRadius.md,    // 12
  borderWidth: 1,
  borderColor: colors.border,       // #e8e6e1
  padding: spacing.lg,              // 24
  marginBottom: spacing.md,         // 16
},
```

Derived from `lockedCard` but without `alignItems: 'center'` or `gap` — metadata
content is left-aligned and uses its own internal spacing.

### JSX changes

Replace `styles.section` with `styles.metadataCard` in 3 places:

1. **Hanakotoba section** (line ~139): `<View style={styles.section}>` → `<View style={styles.metadataCard}>`
2. **Bloom calendar section** (line ~150): same replacement
3. **Prefectures section** (line ~175): same replacement

### Not changed

- `sectionLabel` style — retained as card header text
- `lockedCard` — already styled, no modification needed
- `discRow` / discovery section — uses `styles.section` but child rows already have
  their own card styling; keeping `styles.section` here is correct
- `styles.section` — not deleted, still used by discovery history
- All text styles, font sizes, colors, spacing within each section
- No logic changes, no data flow changes, no new imports

### Interaction with gradient hero

The gradient hero area (posterArea) sits above these cards. Visual flow:
gradient card → divider → metadata cards → locked card (if applicable) → discovery rows.
All cards share the same `borderRadius.md` (12px) and `colors.border` edge treatment.

## Files Changed

| File | Action | Lines (est.) |
|------|--------|--------------|
| `src/app/plant/[id].tsx` | **Modified** | ~10 lines changed |

## Testing

No new tests required. This is a pure visual change (CSS-only, no logic).
Existing 193 tests should continue to pass unchanged.

Visual verification on device:
- [ ] Hanakotoba section has white card background with rounded corners
- [ ] Bloom calendar grid renders correctly inside card (no layout break from padding)
- [ ] Prefecture chips wrap correctly inside card
- [ ] Cards have consistent spacing between each other (16px)
- [ ] Visual alignment with lockedCard below (same border, radius, width)
- [ ] Text readability maintained on white card background
