# Godogen Architecture Analysis: 6 Transferable LLM Pipeline Patterns

> Source: [htdt/godogen](https://github.com/htdt/godogen) — Claude Code skills that build complete Godot 4 games
> Article: [Claude Code 一键生成完整的 Godot 游戏](https://mp.weixin.qq.com/s/evq-RZDsOmp8OOM-SbO7Ng)
> Analysis date: 2026-03-21
> Purpose: Extract universal patterns from Godogen for future LLM pipeline projects

---

## Part 1: Architecture Overview

### What Godogen Does

Godogen is an autonomous game development pipeline. Input: a text prompt ("a 3D snowboarding game with procedural terrain and tricks"). Output: a complete, playable Godot 4 project with organized scenes, readable scripts, and generated assets.

It is NOT a code generator. It is a multi-stage pipeline that performs the full creative and engineering process — architecture, art direction, code, visual testing — orchestrated by AI.

### The 7-Stage Pipeline

```
[1] Visual Target ─── Generate reference screenshot (what the game should look like)
        │
[2] Decomposition ─── Break game into a minimal task DAG (PLAN.md)
        │
[3] Scaffold ──────── Design architecture + produce compilable Godot skeleton (STRUCTURE.md)
        │
[4] Asset Planning ── Decide what assets to generate within budget (ASSETS.md)
        │                 (conditional: only runs when budget is provided)
[5] Asset Generation ─ Generate 2D images (Gemini) + 3D models (Tripo3D)
        │
[6] Task Execution ── For each task: code → compile → screenshot → VQA → fix
        │
[7] Presentation ──── Generate a 30-second gameplay video
```

### 4 Core Design Philosophies

**1. Not one big prompt — staged, progressive loading.**
Each stage has its own instruction file loaded only when that stage begins. The orchestrator reads `visual-target.md` during stage 1, `decomposer.md` during stage 2, etc. This keeps the context window focused.

**2. Document-driven, not conversation-driven.**
Stages communicate through structured documents (PLAN.md, STRUCTURE.md, ASSETS.md, MEMORY.md), not through conversation history. The task executor runs in a forked context and reads only the documents it needs.

**3. Visual verification closes the loop.**
Every task is tested by capturing actual screenshots from the running game and analyzing them with a vision model. This catches bugs invisible to text analysis: z-fighting, floating objects, broken physics.

**4. Minimal task decomposition.**
Counter-intuitively, the decomposer aggressively bundles routine features (movement, UI, spawning) and only isolates genuine technical risks (procedural generation, custom physics). Fewer task boundaries = fewer integration bugs.

### Implementation: Two Claude Code Skills

| Skill | Role | Context | Thread |
|-------|------|---------|--------|
| `godogen` | Orchestrator — plans pipeline, manages PLAN.md DAG, dispatches tasks | Main | Main |
| `godot-task` | Executor — implements one task, captures screenshots, runs VQA | `context: fork` | Isolated per task |

The `context: fork` mechanism is critical: each task gets a fresh context window with zero accumulated state from previous tasks.

---

## Part 2: Six Transferable Patterns

### P1. Dual-Skill Orchestrator-Executor Architecture

#### Principle

Separate planning/coordination from execution. The orchestrator manages the big picture (what to do next, what failed, when to replan). The executor focuses on one task with a clean mind.

#### Godogen Implementation

**Orchestrator (`godogen/SKILL.md`):**
- Reads PLAN.md, finds next ready task (pending + all dependencies done)
- Marks task as `in_progress`, dispatches to executor via `Skill(skill="godot-task")`
- Receives structured report: screenshot paths + VQA verdict + failure details
- Decides: mark done, replan, or escalate
- Git commits after each task: `git add . && git commit -m "Task N done"`

**Executor (`godot-task/SKILL.md`):**
- Runs with `context: fork` — completely isolated context window
- Reads only: task block from PLAN.md + STRUCTURE.md + ASSETS.md + MEMORY.md
- Executes 11-step workflow: analyze → import assets → generate scenes → generate scripts → validate → fix errors → test harness → capture screenshots → verify visually → VQA → store final evidence
- Reports back with structured format: screenshot path + frame descriptions + VQA report

**Key Design Decisions:**
- No fixed iteration limit on the executor — "use judgment" rather than hard caps
- Stop signal: "I'm making the same kind of fix repeatedly without convergence"
- 3-round VQA limit — if still failing, the problem is upstream (architecture, not parameters)
- Executor writes discoveries to MEMORY.md for future tasks to read

#### Universal Abstraction

**Orchestrator-Worker with Context Isolation** — analogous to Kubernetes controller + pod, or a CI/CD pipeline runner.

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│  - Manages task DAG (dependency-aware scheduling)       │
│  - Tracks state (pending → in_progress → done/failed)   │
│  - Makes meta-decisions (replan / escalate / accept)     │
│  - Commits artifacts after each completed task           │
└─────────────┬──────────────┬──────────────┬─────────────┘
              │              │              │
         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
         │ WORKER  │   │ WORKER  │   │ WORKER  │
         │ Task 1  │   │ Task 2  │   │ Task 3  │
         │ (fork)  │   │ (fork)  │   │ (fork)  │
         └─────────┘   └─────────┘   └─────────┘
         Fresh ctx      Fresh ctx      Fresh ctx
```

#### Mapping to Existing Infrastructure

| Godogen | Current Equivalent | Gap |
|---------|--------------------|-----|
| godogen orchestrator | `subagent-driven-dev` skill | No DAG traversal; no state tracking in PLAN.md |
| godot-task (fork) | `Agent` tool with subagent | Same mechanism — `context: fork` |
| Structured reports | Agent result messages | Less structured; no standardized format |
| Git commit per task | auto-checkpoint hook (60s debounce) | Already exists, similar pattern |

**Key Difference:** Godogen runs strictly serial (DAG order). Current infrastructure favors parallel dispatch. Serial DAG is better when tasks have dependencies and integration risks.

#### Application Scenarios

- Any multi-step LLM pipeline where steps can fail independently
- Long-running autonomous tasks that need resume capability
- Pipelines where different steps need different domain knowledge loaded

---

### P2. Progressive Domain Knowledge Loading

#### Principle

Domain knowledge is essential for LLM quality but expensive in context tokens. Load knowledge in tiers: always-visible index → on-demand full reference.

#### Godogen Implementation

**Three tiers of Godot API knowledge:**

| Tier | File | Content | Token Cost | When Loaded |
|------|------|---------|------------|-------------|
| 1 | `_common.md` | ~128 common classes, one-line descriptions | ~3K tokens | Always loaded |
| 2 | `_other.md` | ~730 remaining classes, one-line descriptions | ~8K tokens | When class not found in tier 1 |
| 3 | `{ClassName}.md` | Full API reference for one class | ~500 tokens each | On-demand per class |

**Progressive skill loading:**
```
gdscript.md (26KB)        ← Loaded before writing any code
quirks.md                  ← Loaded before writing any code
scene-generation.md        ← Loaded only when targets include .tscn
script-generation.md       ← Loaded only when targets include .gd
capture.md                 ← Loaded before capturing screenshots
visual-qa.md               ← Loaded when reference.png exists
```

The executor's SKILL.md explicitly states: "Load progressively — read each file when its phase begins, not upfront."

**Bootstrap mechanism:**
```bash
# Sparse git clone of Godot source → extract only doc/classes/ → convert XML → Markdown
bash ${CLAUDE_SKILL_DIR}/tools/ensure_doc_api.sh
```

#### Context Window Economics

| Strategy | Token Cost | Coverage |
|----------|-----------|----------|
| Load all 850 classes fully | ~400K tokens | 100% but context blown |
| Tier 1 index only | ~3K tokens | Can find any class name |
| Tier 1 + one lookup | ~3.5K tokens | Full detail for the class needed |
| Load everything upfront | Impossible | Context overflow |

The insight: **an index that costs 3K tokens gives you navigability over 400K tokens of knowledge.** The LLM reads the index, identifies what it needs, and loads only that.

#### Universal Abstraction

**Knowledge Tiered Loading** — a pattern for any domain where the full reference exceeds context capacity.

```
┌─────────────────────────────────┐
│  Tier 0: Embedded in Skill.md   │  Always present (~1K)
│  (core rules, critical gotchas) │
├─────────────────────────────────┤
│  Tier 1: Index / Summary         │  Always present (~3K)
│  (one-line per concept)          │
├─────────────────────────────────┤
│  Tier 2: Category Index          │  Loaded on demand (~8K)
│  (broader but still summaries)   │
├─────────────────────────────────┤
│  Tier 3: Full Reference          │  Loaded per-item (~500 each)
│  (complete API / spec / doc)     │
└─────────────────────────────────┘
```

#### Mapping to Existing Infrastructure

| Godogen | Current Equivalent |
|---------|--------------------|
| `_common.md` index | `lessons.md` index (~40 lines) injected at session start |
| `{Class}.md` on-demand | `lessons/{topic}.md` read when needed |
| Progressive skill sub-files | `pretool-context` hooks inject rules by CWD (5min throttle) |
| `ensure_doc_api.sh` bootstrap | No equivalent — docs are manually written |

**Insight for improvement:** Current lessons system already follows this pattern! Could extend it with auto-generated API indexes for frequently used but context-heavy references (e.g., Supabase schema, Expo API).

#### Application Scenarios

- Private API documentation (company-internal APIs that LLMs don't know)
- Framework references that exceed context (React Native 850+ components, Supabase 50+ tables)
- Legal/regulatory knowledge bases (domain-specific, large, infrequently updated)

---

### P3. Document Protocol Communication

#### Principle

Pipeline stages communicate through versioned, structured documents with clear schemas — not through conversation history. This makes the pipeline resumable, inspectable, and debuggable.

#### Godogen Implementation

**Five protocol documents:**

| Document | Written By | Read By | Schema |
|----------|-----------|---------|--------|
| `reference.png` | Visual Target stage | All stages | Image — the "north star" |
| `PLAN.md` | Decomposer | Orchestrator + Executor | Task blocks with Status/Targets/Goal/Requirements/Verify fields |
| `STRUCTURE.md` | Scaffold | Executor | Scene hierarchy, script responsibilities, signal flow, physics layers |
| `ASSETS.md` | Asset Planner | Asset Generator + Executor | Art direction + manifest with sizes, file paths, cost |
| `MEMORY.md` | Executor (incremental) | Future Executor tasks | Discoveries, workarounds, quirks, debugging insights |

**Resume mechanism (from godogen/SKILL.md):**
```
Check if PLAN.md exists (resume check)
├── If yes: read PLAN.md, STRUCTURE.md, MEMORY.md → skip to task execution
└── If no: continue with fresh pipeline
```

**Task block schema in PLAN.md:**
```markdown
## N. {Task Name}
- **Status:** pending | in_progress | done | done (partial) | skipped
- **Depends on:** Task 1, Task 3  ← DAG dependency links (enables topological traversal)
- **Targets:** scenes/main.tscn, scripts/player_controller.gd
- **Assets needed:** hero_sprite.png, terrain_texture.png  ← consumed by asset planner
- **Goal:** ...
- **Requirements:** ...
- **Verify:** ...
```

#### Three Advantages

1. **Resumability** — If the pipeline crashes, restart and read PLAN.md. Tasks marked `done` are skipped. No lost progress.

2. **Auditability** — Every intermediate artifact is a file you can read and inspect. "Why did the executor make this choice?" → read STRUCTURE.md and ASSETS.md that it consumed.

3. **Decoupling** — The executor (context:fork) doesn't need conversation history. It reads 4 documents and has complete context. This is why fork works — documents replace memory.

#### Universal Abstraction

**Document-Driven Pipeline Protocol** — stages produce and consume named documents with known schemas.

```
Stage A ──writes──► DOC_1 ──reads──► Stage B ──writes──► DOC_2 ──reads──► Stage C
                       │                                      │
                       ▼                                      ▼
                  [inspectable]                          [inspectable]
                  [resumable]                            [resumable]
```

Design rules:
- Each document has exactly one writer (or one writer per section)
- Readers never modify documents they don't own
- State changes go through the orchestrator (e.g., PLAN.md status updates)
- Documents use structured formats (Markdown with consistent headings, not free-form prose)

#### Mapping to Existing Infrastructure

| Godogen | Current Equivalent | Gap |
|---------|--------------------|-----|
| PLAN.md (task DAG) | PROGRESS.md + TodoWrite | PROGRESS.md is flat checkboxes; no dependency graph, no structured fields |
| STRUCTURE.md (architecture) | Spec documents in `docs/superpowers/specs/` | Similar but not consumed by automated pipelines |
| ASSETS.md (resource manifest) | — | No equivalent |
| MEMORY.md (project memory) | Auto memory system (`~/.claude/...memory/`) | Already richer; cross-project scope |
| Resume check | "Read PROGRESS.md + git log" convention | Manual; Godogen's is automated |

**Highest-value gap:** Upgrading PROGRESS.md from flat checkboxes to a structured task protocol with status/targets/verify fields. This would enable automated orchestration.

#### Application Scenarios

- Any pipeline spanning multiple Claude Code sessions
- Multi-agent coordination (scrapling pipelines, data processing)
- Projects where "what happened and why" needs to be auditable

---

### P4. Independent Visual QA Loop

#### Principle

The agent that writes code is biased toward its own output. Use a separate model that only sees the visual result (screenshots), not the code, to evaluate quality. This breaks confirmation bias.

#### Godogen Implementation

**Architecture:**
```
Code Agent (Claude) ──writes code──► Godot Engine ──renders──► Screenshots
                                                                    │
                                                                    ▼
                                            QA Agent (Gemini Flash) ──evaluates──► Verdict
                                            (sees ONLY screenshots + reference image)
                                                                    │
                                                                    ▼
                                                        pass / fail / warning
                                                                    │
                                                              ┌─────┴─────┐
                                                              │           │
                                                           [pass]     [fail]
                                                              │           │
                                                           Move on   Fix & retry
                                                                     (max 3 rounds)
```

**Two evaluation modes:**

| Mode | When | Input | Example |
|------|------|-------|---------|
| Static | No meaningful motion (terrain, UI, decoration) | reference.png + 1 game screenshot | "Does the terrain match the reference style?" |
| Dynamic | Motion, animation, physics | reference.png + frames at 2 FPS cadence | "Is the character moving smoothly? Any physics explosions?" |

**What VQA checks (from visual-qa.md):**
- Visual defects: z-fighting, texture stretching, clipping, floating objects
- Rendering bugs: missing textures (magenta), culling errors, lighting leaks
- Implementation shortcuts: grid-like placement (should be organic), uniform scaling
- Motion anomalies: stuck entities, jitter, sliding animations, physics explosions

**Structured output:**
```markdown
# VQA Report
**Verdict:** pass | fail | warning
**Reference match:** [assessment]
**Goal assessment:** [assessment]

## Issues
### Issue 1
- **Severity:** major | minor | note
- **Description:** ...
- **Location:** ...
```

**Failure escalation:**
- Fixable issues (placement, scale, materials) → executor fixes, recaptures, re-runs VQA
- Unfixable issues (wrong assets, wrong approach) → executor stops, reports to orchestrator
- Max 3 fix-and-rerun cycles → then escalate upstream

#### The Key Insight

From the HN discussion:
> "The core problem is Claude Code can't see what it produced — code compiles, but assets float, paths don't connect, layout is a mess."

Code analysis alone cannot catch spatial, visual, and physical bugs. You need an evaluator that looks at the rendered result, like a human QA tester would.

The separation of models is deliberate: **the evaluator (Gemini Flash) has no access to the code and no investment in the implementation.** It only answers: "Does this look right?"

#### Universal Abstraction

**Independent Verification Loop** — a pattern where the quality check is performed by a different agent/model than the one that produced the work.

```
Producer Agent ──produces──► Artifact ──renders/deploys──► Observable Output
                                                                │
                                                                ▼
                                                    Verifier Agent (independent)
                                                    - Different model (avoids bias)
                                                    - Sees only output, not source
                                                    - Structured verdict
                                                                │
                                                         ┌──────┴──────┐
                                                      [pass]        [fail]
                                                         │              │
                                                      Done         Fix cycle
                                                                   (bounded)
```

Design rules:
- Verifier and producer must be different agents (ideally different models)
- Verifier sees rendered output, not source code/configuration
- Verdicts are structured (pass/fail/warning + severity + details)
- Fix cycles are bounded (3 rounds, then escalate)
- "Unfixable from here" is a valid verdict — not every problem is local

#### Mapping to Existing Infrastructure

| Godogen | Current Equivalent | Gap |
|---------|--------------------|-----|
| Gemini Flash VQA | `frontend-design-reviewer` agent | Reviewer is human-facing; VQA is machine-to-machine in pipeline |
| Screenshot capture | Playwright `browser_take_screenshot` | Available |
| Reference image comparison | — | No "visual north star" concept |
| Structured verdicts | — | Reviewer output is prose, not structured verdicts |
| Automated fix cycle | — | Manual: reviewer reports → human decides → human asks fix |

**Highest-value opportunity:** Automating the `frontend-design-reviewer` into a pipeline step. After writing frontend code → Playwright screenshot → Gemini Flash comparison against design reference → structured verdict → auto-fix cycle.

#### Application Scenarios

- Frontend page/component generation with design fidelity checks
- Email template generation (render + screenshot + verify layout)
- Data visualization generation (chart looks correct? axes labeled?)
- Mobile app screen generation (Expo screenshot → compare to Figma mock)

---

### P5. Domain Knowledge Compensation Strategy

#### Principle

When LLMs have insufficient training data for a niche technology, compensate with hand-crafted, expert-level reference material injected into the context. Write for experts, not tutorials.

#### Godogen Implementation

**Three knowledge artifacts:**

**1. Hand-written language reference (`gdscript.md`, 26KB):**
- Written for an expert who needs precise answers, not a beginner tutorial
- Covers traps specific to code generators:
  - `:=` type inference fails on `instantiate()` (returns Variant)
  - `abs()` and `clamp()` are polymorphic — need explicit typing
  - Lambda captures: by reference for collections, by value for primitives
- Encodes game development patterns in GDScript idiom: state machines, spawning, camera rigs, tween chains

**2. Auto-converted API docs (`doc_api/`, from XML):**
- Bootstrap script does sparse git clone of Godot repo (only `doc/classes/`)
- Converter transforms each XML class definition → compact Markdown
- Properties, methods, signals, constants, enums with descriptions trimmed to first sentences
- Token-efficient: full detail but minimal prose

**3. Engine quirks database (`quirks.md`):**
- `_ready()` doesn't fire during scene builder's `_initialize()`
- `MultiMeshInstance3D` loses mesh reference after pack-and-save (serialization bug)
- Collision state can't change inside collision callbacks (needs deferred)
- Camera2D has no `current` property — must call `make_current()` after entering tree

Each quirk represents a debugging session that would cost a human developer hours.

**4. Build-time vs runtime separation:**
The most subtle teaching: which APIs work when.

| Phase | Available | NOT Available |
|-------|-----------|---------------|
| Scene builder (headless) | Node creation, property setting, `owner` chain, `set_script()` | `@onready`, `preload()`, signals, `look_at()`, `_ready()` |
| Runtime script | Full Godot lifecycle, signals, input, physics | — |

The LLM's instinct is to write one script that does everything. The reference system teaches it to separate build-time and runtime code.

**Skill authoring principle (from CLAUDE.md):**
> "When writing skills: don't give obvious guidance. The agent is a highly capable LLM — handholding only pollutes the context."

This means: encode traps and non-obvious behaviors, not basic syntax.

#### Universal Abstraction

**Domain Knowledge Compensation System** — three-layer approach for niche technologies.

```
Layer 1: Precision Reference
- Hand-written by domain expert
- Focus on traps, edge cases, non-obvious behaviors
- Written for expert LLM, not human beginner
- Example: "`:=` fails with instantiate() because..."

Layer 2: Auto-Generated API Index
- Script-converted from official source (XML, JSON, YAML)
- Compact, token-efficient format
- Covers breadth (all 850 classes) vs Layer 1's depth
- Example: bootstrap.sh → sparse clone → convert → markdown

Layer 3: Experiential Quirks Database
- Accumulated from real debugging sessions
- "Documentation says X but engine actually does Y"
- Each entry saves hours of debugging time
- Example: "Camera2D.current doesn't exist, use make_current()"
```

Design rules:
- Write for experts, not tutorials — the LLM already knows programming
- Focus on where the niche tech DIFFERS from common languages (GDScript vs Python)
- Auto-generate breadth, hand-write depth
- Quirks are gold — every encoded quirk prevents a debugging spiral

#### Mapping to Existing Infrastructure

| Godogen | Current Equivalent |
|---------|--------------------|
| gdscript.md (hand-written spec) | Skill-specific instructions (e.g., `ph/SKILL.md` design constraints) |
| doc_api/ (auto-generated) | No auto-generated API references |
| quirks.md | `lessons/{topic}.md` (129 entries across 13 topics) |
| Build-time/runtime separation | pretool-context direction files (web/app/tool) |

**Key difference:** Godogen's knowledge is systematically authored as a complete reference. Current lessons are experientially accumulated. Both are valid — but for a new pipeline targeting a niche technology, the systematic approach is more reliable.

**Actionable insight:** When building a pipeline for a new domain, invest upfront in Layer 1 (precision reference) and Layer 2 (auto-generated API index). Layer 3 (quirks) will accumulate naturally during development.

#### Application Scenarios

- Supabase Edge Functions (niche: Deno + Supabase-specific APIs)
- Expo SDK (large API surface, many platform-specific gotchas)
- Private/internal APIs (zero LLM training data)
- Regulatory compliance (domain-specific terminology and rules)

---

### P6. Budget-Aware Resource Allocation

#### Principle

When external API calls have monetary costs, treat resource allocation as an optimization problem: maximize output quality per unit of cost.

#### Godogen Implementation

**Cost table (from HN discussion + asset-planner.md):**

| Resource | Cost (total) | Quality Range |
|----------|-------------|---------------|
| 2D image (1K) | $0.07 | Standard |
| 2D image (2K) | $0.10 | High |
| 2D image (4K) | $0.15 | Maximum |
| 3D model (medium) | ~$0.37 | 7c image + 30c GLB |
| 3D model (high) | ~$0.47 | 7c image + 40c GLB |
| 3D model (ultra) | ~$0.67 | 7c image + 60c GLB |
| Gemini Flash VQA | ~$0.00 | Essentially free at scale |
| Full game generation | $5-8 | LLM ($1-3) + Assets ($3) |

**Optimization rules:**
1. **Prioritize by visual impact:** Hero character > background shrub. Spend on what the player sees most.
2. **Match resolution to display size:** Don't generate 4K texture for a 32px sprite — all that detail becomes noise at small scale.
3. **Use free resources liberally:** VQA (Gemini Flash) is nearly free → run it on every task. Procedural particles are free → prefer them over generated assets.
4. **Budget-aware planning:** Asset planner reads architecture, then decides what to generate within the user's budget constraint.

**Implementation in the pipeline:**
- User can provide an optional budget with their prompt
- Asset planner stage reads STRUCTURE.md to understand what the game needs
- Plans assets with explicit cost estimates per item
- Prioritizes by visual impact within the budget ceiling
- Asset manifest (ASSETS.md) includes per-item cost and justification

#### Universal Abstraction

**Budget-Aware Resource Optimization** — allocate limited resources (money, tokens, API calls) to maximize output quality.

```
Input: Task requirements + Resource budget
                │
                ▼
    ┌──────────────────────┐
    │  Resource Planner     │
    │  - Enumerate needs    │
    │  - Estimate costs     │
    │  - Rank by impact     │
    │  - Allocate budget    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Tiered Execution     │
    │  - High-impact first  │
    │  - Quality tiers      │
    │  - Free > cheap > $   │
    │  - Skip low-impact    │
    └──────────────────────┘
```

Design rules:
- Make costs explicit and visible (not hidden in API calls)
- High-impact items get quality investment; low-impact items get minimum viable quality
- Free alternatives first (built-in features, cached results, procedural generation)
- Budget ceiling prevents runaway costs

#### Mapping to Existing Infrastructure

| Godogen | Current Equivalent |
|---------|--------------------|
| Asset cost table | Token estimation (`token-estimation.md`) |
| Quality tiers (1K/2K/4K) | Model tiers (Haiku/Sonnet/Opus by task) |
| Budget-aware asset planning | Ad-hoc: "use Haiku for exploration" |
| Cost tracking per item | No per-item cost tracking |

**Already applying this pattern:** Model selection (Opus for architecture, Sonnet for default, Haiku for exploration) is the same optimization — tiered quality/cost. The gap is making costs explicit and trackable.

#### Application Scenarios

- Image generation pipelines (matching resolution to use case)
- LLM API call budgeting (Opus for critical decisions, Haiku for routine)
- Data collection (full scrape vs sample vs cached, by data value)
- Testing (full E2E suite vs smoke tests vs type checks, by risk)

---

## Part 3: Infrastructure Mapping Matrix

### What You Already Have vs What Godogen Adds

| Godogen Component | Your Current Equivalent | Status | Gap |
|-------------------|------------------------|--------|-----|
| Orchestrator skill | Feedback docs: `feedback-subagent-driven-dev.md` + `dispatching-parallel-agents` skill | Partial | No DAG traversal; no structured task state management |
| Executor (context:fork) | `Agent` tool with subagent types | Complete | Same mechanism |
| PLAN.md (task DAG) | `TodoWrite` + `PROGRESS.md` | Partial | Flat checkboxes; no dependencies; no structured fields (Targets/Verify) |
| STRUCTURE.md (architecture) | Spec docs in `docs/superpowers/specs/` | Partial | Not consumed by automated pipelines |
| MEMORY.md (project memory) | Auto memory system | Complete+ | Your system is richer (cross-project, typed, indexed) |
| Progressive knowledge loading | `pretool-context` hooks + `lessons.md` index | Complete | Already implementing tiered loading |
| Visual QA (Gemini Flash) | Playwright + `frontend-design-reviewer` | Partial | Missing automated pipeline integration; missing structured verdicts |
| Asset generation | — | N/A | Different domain |
| Budget optimization | Model tiers + `token-estimation.md` | Partial | Implicit; not tracked per-item |
| Resume mechanism | "Read PROGRESS.md + git log" convention | Manual | Godogen's is automated via PLAN.md status check |
| Git commit per task | auto-checkpoint hook (60s debounce) | Complete | Already exists |

### Unique Strengths You Have That Godogen Doesn't

| Your Feature | Why It Matters |
|-------------|----------------|
| Cross-project memory system | Godogen MEMORY.md is per-project; yours spans all projects |
| 13-topic lessons database | Broader experiential knowledge than a single-domain quirks file |
| MCP tool ecosystem (113+ tools) | Godogen has no MCP; only shell commands + Python scripts |
| Multi-model strategy (Opus/Sonnet/Haiku) | Godogen uses only Claude (Opus for code, Gemini for VQA/images) |
| Hooks system (pretool/posttool) | Automated context injection; Godogen relies on manual skill loading |
| Cron + agent-logs infrastructure | Godogen has no scheduled execution; only interactive or Telegram-bridged |

---

## Part 4: Application Scenario Matrix

### Which Patterns for Which Domain?

| Scenario | P1 Dual-Skill | P2 Progressive Load | P3 Doc Protocol | P4 Visual QA | P5 Domain Knowledge | P6 Budget | Complexity |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Frontend page generation** | Required | Optional | Required | Required | Optional | Optional | Medium |
| **Crawler pipeline automation** | Required | Optional | Required | — | Required | Optional | Low-Medium |
| **Mobile module generation** | Required | Required | Required | Required | Required | Optional | High |
| **Test case auto-generation** | Required | — | Required | Optional | — | — | Low |
| **Document/content pipeline** | Required | — | Required | — | — | Required | Low |
| **Design system enforcement** | Optional | Required | — | Required | Required | — | Medium |

### Minimum Viable Pattern Combinations

**Simplest pipeline (2 patterns):** P1 (Dual-Skill) + P3 (Doc Protocol)
- Orchestrator dispatches tasks; documents enable resume and audit
- Sufficient for: test generation, content pipelines, simple automations

**Visual pipeline (3 patterns):** P1 + P3 + P4 (Visual QA)
- Adds screenshot-based verification loop
- Sufficient for: frontend generation, email templates, data visualizations

**Full autonomous pipeline (5+ patterns):** P1 + P2 + P3 + P4 + P5
- Progressive knowledge loading + domain compensation
- Sufficient for: mobile module generation, complex multi-technology pipelines

---

## Appendix A: Key Files in htdt/godogen

| File | Size | Purpose |
|------|------|---------|
| `PROJECT.md` | 20KB | Complete architecture documentation |
| `skills/godogen/SKILL.md` | 4KB | Orchestrator skill definition |
| `skills/godot-task/SKILL.md` | 6KB | Executor skill definition |
| `skills/godot-task/gdscript.md` | 26KB | Hand-written GDScript language reference |
| `skills/godot-task/scene-generation.md` | 9KB | Headless scene builder patterns |
| `skills/godogen/decomposer.md` | 10KB | Task decomposition instructions |
| `skills/godogen/scaffold.md` | 10KB | Architecture design instructions |
| `skills/godogen/asset-gen.md` | 9KB | Asset generation tooling |
| `skills/godogen/visual-target.md` | 1KB | Visual Target stage driver (reference.png generation) |
| `skills/godogen/asset-planner.md` | 7KB | Budget-aware asset planning |
| `skills/godot-task/quirks.md` | 6KB | Engine quirks database |
| `skills/godot-task/visual-qa.md` | 3KB | VQA integration instructions |
| `skills/godot-task/capture.md` | 3KB | Screenshot/video capture |

## Appendix B: Terminology Mapping

| Godogen Term | General Term | Description |
|-------------|-------------|-------------|
| Visual Target | Reference Artifact | The "north star" that anchors all downstream decisions |
| Decomposer | Task Planner | Breaks goal into minimal task DAG |
| Scaffold | Architecture Generator | Produces compilable skeleton + documentation |
| context: fork | Context Isolation | Each task gets fresh LLM context |
| VQA | Independent Verification | Output evaluated by different agent than producer |
| MEMORY.md | Shared Discovery Log | Cross-task learning persistence |
| Depends on (PLAN.md field) | Task Dependency Declaration | DAG links enabling topological traversal of tasks |
| quirks.md | Experiential Knowledge Base | Undocumented behaviors learned through debugging |
