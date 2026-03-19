# Pixel Herbarium — Documentation Index

> **docs/ = Single Source of Truth** for all project knowledge.
> Claude session startup: read this file + `../CLAUDE.md` + `../PROGRESS.md`

---

## Quick Access

| Need | Document |
|------|----------|
| What is PH? | [product-spec.md](product-spec.md) |
| Visual rules | [design-system.md](design-system.md) |
| Competitor matrix | [competitive-insights.md](competitive-insights.md) |
| Current progress | [../PROGRESS.md](../PROGRESS.md) |
| Tech stack & directory | [development-status.md](development-status.md) |

---

## Living Documents (frequently updated)

### Product & Design
- `product-spec.md` — Core loop, rarity system, FOMO rules, sharing formats
- `design-system.md` — Colors, typography, Adult Kawaii definition
- `competitive-insights.md` — Competitor matrix, monitoring setup, scrapling integration

### Feature Specs & Plans
- `superpowers/specs/` — 12 design specs (YYYY-MM-DD format)
- `superpowers/plans/` — 7 implementation plans

### App Store & Marketing
- `app-store-prep/` — Compliance checklist, privacy policy, terms, screenshots (8 files)
- `aso/` — Metadata (ja/en), keywords, promotional copy for LINE/X/checkin (6 files)

### Development
- `dev-guide/bugfix-workflow.md` — Bug triage and fix process
- `dev-guide/spring-flower-identification.md` — Botanical data validation reference
- `development-status.md` — Architecture overview, directory structure
- `postmortems/` — Incident retrospectives

### Operations
- `ops/line-oa-setup.md` — LINE Official Account channel configuration
- `ops/testflight-guide.md` — TestFlight distribution setup

---

## Research Archive (read-only, consult as needed)

### Competitor Deep Dives (`research/competitor/`, 6 files)
- `flowery-app-deep-analysis.md` — FLOWERY plant photo sharing app
- `cross-competitor-ui-analysis.md` — Multi-app UI/UX comparison
- `market-validation-deep-dive.md` — Market validation + GPS + data flywheel
- `sakura-navi-gps-stamp-deep-dive.md` — GPS stamp card mechanism
- `sakura-navi-myspot-calendar-deep-dive.md` — MY SPOT + calendar
- `weathernews-sakura-crowdsourcing-deep-dive.md` — Crowdsourcing data flywheel

### Market & Audience (`research/market/`, 3 files)
- `adult-kawaii-japan-app-analysis.md` — Adult Kawaii visual style validation
- `japan-audience-analysis.md` — Japan market TAM/SAM/SOM
- `japan-research-plan.md` — Multi-platform user research framework

### Platform Search Strategies (`research/platform/`, 7 files)
- `instagram-hashtag-research.md` — Instagram seasonal hashtag matrix
- `x-hanami-research.md` — X/Twitter search syntax & seasonal calendar
- `line-hanami-research.md` — LINE OpenChat/VOOM/Blog research
- `line-analysis-layer1.md` — LINE data accessibility map
- `line-analysis-layer2.md` — LINE competitor signal extraction
- `line-analysis-layer3.md` — LINE pattern recognition & insights
- `youtube-hanami-research.md` — YouTube comment mining guide

### Data Collection (`research/data/`, 4 files)
- `sakura-sources-guide.md` — Sakura spot data sources (compliance guide)
- `spot-crawl-guide.md` — Weathernews 1400-spot crawl procedure
- `user-review-collection-guide.md` — 10-platform review collection SOP
- `line-data-collection-technical.md` — LINE data pipeline technical plan

### Design Reference (`research/design/`, 2 files)
- `photo-stamp-design-v2.md` — Stamp watermark editor interaction design
- `cherry-blossom-ui-design-resources.md` — Cherry blossom UI resource collection

### Launch Preparation (`research/launch/`, 1 file)
- `localization-checklist.md` — Full Japan market localization checklist

---

## External Data Sources

| System | What it stores | How to access |
|--------|---------------|---------------|
| Claude Memory | Design constraints, mobile dev rules, CI config | Auto-injected per session |
| scrapling-mcp | Competitor reviews, market signals, trend data | `scrapling` MCP tools |
| Supabase | Flower spot data (100 spots), user data | `supabase` MCP / dashboard |
| Codemagic | E2E test results, screenshots | Dashboard / artifacts |

### Scrapling Data Flow

```
scrapling cron (automated)
├── ph-daily  → App Store reviews + snapshots → data.db
├── ph-weekly → Trend keywords + Twitter     → data.db
└── ph-enrichment → Signal classification    → data.db

MCP tools (on-demand from Claude sessions)
├── ph_health_check       → Quick status
├── appstore_reviews       → Latest reviews
├── trend_summary          → Keyword trends
└── ph_export_content_pack → Export to JSON/MD

Manual export (for deep analysis)
└── ph_export → docs/research/data/latest-export-YYYY-MM.md
```

---

## Memory ↔ Docs Boundary

| Memory (auto-injected) | Docs (authority) | Purpose |
|------------------------|------------------|---------|
| `pixel-herbarium-spec.md` | `product-spec.md` | Memory = cheat sheet, Docs = full spec |
| `ph-mobile-dev.md` | `dev-guide/` | Memory = trap rules, Docs = procedures |
| `ph-codemagic-setup.md` | N/A | CI secrets, memory-only |
| `pretool-context` | `design-system.md` | pretool = guardrails, Docs = explanation |

**Rules:**
1. Memory never exceeds 250 lines — extract detail to docs/, keep pointers
2. Memory stores "how to apply" rules; docs stores "what" and "why"
3. No duplicate data tables — reference by path instead
4. Postmortem lessons → memory; full incident records → `docs/postmortems/`

---

*Last updated: 2026-03-19*
