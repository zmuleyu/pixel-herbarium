# Icon Style Guide — 花図鉑

## App Icon

- **Concept**: Open herbarium journal with botanical sakura + pixel leaf accents
- **Source SVG**: `assets/icon.svg`
- **Export script**: `tools/export-icons.mjs`
- **Background**: Cream gradient `#f8f6f3` → `#ede9e3`
- **Brand text**: 「花図鉑」in serif, `#D4537E`
- **Size-adaptive**: ≥40pt full; 29pt no text; 16pt flower only

## Tab Bar Icons

- **ViewBox**: `0 0 24 24`
- **Stroke width**: 1.5px (outline), 1.0px (detail lines)
- **Stroke cap/join**: round
- **Color model**: `currentColor` for structural; inline `#f5d5d0` / `#9fb69f` / `#d4a645` for decorative fills
- **Focused state**: Structural shapes get 10% fill of `color` prop
- **Source**: `src/components/TabBarIcon.tsx`

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `brand.accent` | `#D4537E` | Icon text, CTAs, watermark borders |
| `brand.dark` | `#A05070` | Pressed states |
| UI colors | (unchanged) | Backgrounds, cards, seasonal themes |

## Adding New Icons

1. Follow 24×24 viewBox, 1.5px stroke, round caps
2. Use `currentColor` for structural paths
3. Add decorative fills from the palette: `#f5d5d0` (pink), `#c1e8d8` (mint), `#d4a645` (gold)
4. Export component in `TabBarIcon.tsx` with `focused`/`color`/`size` props
