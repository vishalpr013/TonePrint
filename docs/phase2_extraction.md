# Phase 2: Correction Extraction

## Purpose

Design a prompt that takes (original draft, edited version) and outputs a **structured correction object** — not prose, not vague advice, but a mechanically actionable rule with concrete avoid/prefer patterns and before/after evidence.

## Extraction Schema

```json
{
  "context": "professor | friend | professional",
  "rule": "concise, imperative instruction — must be specific enough to act on",
  "avoid": ["specific phrases/patterns to avoid"],
  "prefer": ["specific phrases/patterns to prefer"],
  "evidence": {
    "before": "representative excerpt from the original",
    "after": "corresponding excerpt from the edit"
  }
}
```

## Prompt Design

Key guardrails in the extraction prompt:

1. **"Pick the MOST IMPACTFUL correction"** — prevents laundry-list outputs that try to capture every edit
2. **BAD/GOOD examples for the `rule` field** — steers away from vague instructions like "Make the email shorter"
3. **BAD/GOOD examples for `avoid`/`prefer`** — demands concrete phrases, not abstract adjectives
4. **Evidence constraint** — "pick the single best before/after pair" keeps it focused

## Results: Quality Assessment

| Pair | Context | Rule Specificity | Notes |
|------|---------|-----------------|-------|
| 1 | Professor | ✅ Specific | 3-step structure: fact → solution with date → ask about process |
| 2 | Professor | ✅ Specific | Concrete: name course/grade/project instead of generic flattery |
| 3 | Professor | ✅ Specific | Quantified: "under 5 sentences", "propose 2-3 alternative times" |
| 4 | Friend | ✅ Specific | Captures register shift: lowercase, emoji, contractions, emotion-first |
| 5 | Friend | ⚠️ Mixed | "Convey reaction viscerally" is slightly vague — avoid/prefer lists compensate |
| 6 | Friend | ✅ Specific | Clear: ask → logistics → bribe → no-pressure out |
| 7 | Professional | ✅ Specific | Concrete: add a new metric-backed accomplishment, reference job ID |
| 8 | Professional | ✅ Specific | Actionable: name the coverage person, give manager a specific action item |
| 9 | Professional | ✅ Specific | Clear: state conflict without apologizing, offer specific async channel |

**Summary:** 8/9 specific, 1/9 borderline. The borderline case (Pair 5) is in the friend context where corrections are about *voice* rather than *structure* — this may be a structural limitation of rule-based extraction for idiosyncratic style.

## Cross-Context Observations

- **Professor:** All 3 rules share a meta-pattern ("front-load information, drop ceremony") but are distinct enough for different scenarios
- **Friend:** Rules capture register, not structure — emoji, lowercase, humor, directness
- **Professional:** Rules focus on replacing vague deference with specific action items and data

## Full Outputs

All 9 extraction outputs are in [`src/data/pilot_dataset.js`](../src/data/pilot_dataset.js) as the `corrections` array.
