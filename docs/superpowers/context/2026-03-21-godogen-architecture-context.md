# Context: Godogen Architecture Pattern Extraction

**What we're building:** A reference analysis of 6 transferable LLM pipeline patterns extracted from the Godogen project (htdt/godogen), for future application to non-game domains.

**Locked decisions:**
- Analysis scope: 6 patterns (Dual-Skill, Progressive Loading, Doc Protocol, Visual QA, Domain Knowledge, Budget Optimization)
- Deliverable: Spec document with Godogen implementation details + universal abstractions + infrastructure mapping
- Target domain: Unspecified — analysis stays generic for now
- Each pattern includes: principle, implementation details, universal abstraction, mapping to existing Claude Code infrastructure, application scenarios

**Non-goals / constraints:**
- Not building a Godot game (no Godot installed, no GDScript experience)
- Not implementing any pipeline yet (analysis-only phase)
- Not creating a Godogen fork or clone
- Not targeting a specific domain — future sessions will specialize

**Resolved edge cases:**
- "相同游戏" → clarified as "extract pipeline patterns, not build a game"
- Depth vs breadth → user chose full 6-pattern analysis over selective deep-dive
- Template/skeleton → not included; user chose analysis-only over analysis+template

**Key findings for future work:**
- Highest-value gaps in current infrastructure: automated VQA loop, structured PLAN.md with DAG dependencies
- Already strong: memory system, progressive loading (lessons index), context:fork mechanism
- When building a new pipeline: invest in Layer 1 (precision reference) + Layer 2 (auto-generated API index) upfront

**Evidence tags:**
- [EVIDENCE] All Godogen architecture details — read from source repo
- [EVIDENCE] Current infrastructure mapping — verified against MEMORY.md + CLAUDE.md
- [INFERRED] Application scenario matrix — based on pattern properties, not tested
- [ASSUMED] Pattern transferability across domains — theoretical, needs validation

## Transition Checklist
- [x] Scope: Single system (architecture analysis, no multi-system decomposition needed)
- [x] Evidence: Key decisions tagged [EVIDENCE] / [INFERRED] / [ASSUMED]
- [x] Anti-pattern: Identified 1 risk — "pattern transferability across domains" is assumed, not validated
