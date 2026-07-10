# Phase 4: Results & Evaluation

## Result Table

| Context | Training Scenario | Test Scenario | Retrieval | Transfer | Key Signal |
|---------|-------------------|---------------|-----------|----------|------------|
| Professor | Late submission | Switch presentation slot | ✅ | ✅ YES | Structure generalized |
| Friend | Cancel birthday | Share promotion news | ✅ | ✅ YES | Register transferred across mood |
| Professional | PTO request | WFH schedule change | ✅ | ✅ YES | Pattern adapted specifics |

## Evaluation Rubric

### 1. Did extraction produce specific, reusable rules?

**8/9 specific, 1/9 borderline.**

**Specific examples:**
- Pair 1: "Open with the factual situation, then state your proposed solution with a specific date, then ask if that works"
- Pair 7: "Add a new concrete data point (a recent accomplishment with a metric) that wasn't in the original application"
- Pair 8: "Proactively name who will cover your work, and end with a specific action item for the manager"

**Borderline:**
- Pair 5: "Convey your personal reaction viscerally and use a punchy comparison" — "viscerally" and "punchy" are subjective

### 2. Transfer success rate

| Outcome | Count | Percentage |
|---------|-------|------------|
| ✅ YES | 3 | 100% |
| ⚠️ PARTIAL | 0 | 0% |
| ❌ NO | 0 | 0% |

**Caveat:** 3-test sample. Encouraging but not statistically meaningful. The 30-pair expansion will stress-test this.

### 3. Recommendation

**→ (a) Proceed as-is.** Extraction + hybrid retrieval works. Expand to 30 pairs for consistency testing next.

**Justification:**
- Extraction produced actionable rules in 8/9 cases
- Hybrid prompt (rule + evidence) produced clean transfer in 3/3 tests
- Evidence grounds the abstract rule, preventing loose interpretation
- The one weak extraction is in a context where corrections are inherently harder to formalize

## Future Case Outline (Do Not Build Yet)

### Hackathon Horizon (~4 days)

**Scaling 9 → 30 pairs:**
- Do rules stay specific as dataset grows, or collapse to generic patterns?
- Does retrieval return the right correction as memory store grows?
- Do conflicting corrections appear across similar contexts?

**Minimal web UI** — one loop:
1. Pick context → see generated draft → edit inline
2. System shows extracted correction ("I learned: ...")
3. Enter new request → see side-by-side: without memory vs. with memory
4. That's it. No settings, no history, no export.

**3-minute demo script:**
1. [0:00–0:30] Show a generic AI draft. Audience groans.
2. [0:30–1:15] Edit it. System shows learned rule.
3. [1:15–2:15] New request, different scenario. Side-by-side generation. The "aha" moment.
4. [2:15–2:45] Repeat for friend context (emotional valence flip).
5. [2:45–3:00] "One correction. One edit. Applied to messages it's never seen. That's Toneprint."

### Beyond-Hackathon Horizon

**Generalization:** Coding agents (learn from reverted changes), task agents (learn from corrected plans), design agents (learn from UI adjustments).

**Scale challenges:** Multi-user containers, correction merging, conflict resolution, TTL-based expiry.

**Honest limitations:** Correction drift, overfitting to small samples, context misclassification, extraction loss for subtle edits, circular self-evaluation.
