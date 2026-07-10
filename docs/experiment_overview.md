# Toneprint Experiment — Overview

## Goal

Validate whether a system that learns communication corrections from one edited message can transfer that learning to a **different, semantically related message** — not just describing an edit, but generalizing from it.

## Architecture

```
User Request → AI Draft → User Edits Draft
                              ↓
                    Extraction Prompt
                              ↓
                    Structured Correction
                    { context, rule, avoid[], prefer[], evidence }
                              ↓
                    Store in Supermemory Local
                    (containerTag = user, metadata = context)
                              ↓
              ─── New Request in Same Context ───
                              ↓
                    Semantic Search (Supermemory)
                    → Retrieve top-k corrections
                              ↓
                    Inject rule + evidence into prompt
                              ↓
                    Generate with memory applied
```

## Phases

| Phase | What | Status | Docs |
|-------|------|--------|------|
| 1 | 9-pair pilot dataset (3 contexts × 3 pairs) | ✅ Done | [phase1_dataset.md](phase1_dataset.md) |
| 2 | Correction extraction prompt + 9 structured outputs | ✅ Done | [phase2_extraction.md](phase2_extraction.md) |
| 3 | Cross-message transfer test (3 tests, 1 per context) | ✅ Done | [phase3_transfer.md](phase3_transfer.md) |
| 4 | Result table + evaluation rubric + future case | ✅ Done | [phase4_results.md](phase4_results.md) |
| 5 | Node.js test script with Supermemory integration | ✅ Done | [phase5_script.md](phase5_script.md) |

## Key Findings

1. **Extraction works:** 8/9 corrections produced specific, reusable rules (not vague "be concise" advice)
2. **Transfer works:** 3/3 tests showed the learned pattern applied to genuinely new content
3. **Emotional valence transfer:** The strongest signal — a friend-context correction trained on a cancelation (negative) transferred perfectly to a celebration (positive). The model applied the *structure* without mimicking the *mood*.
4. **Structural corrections aid reasoning:** In the professional test, the memory-injected prompt prevented a logical confusion that tripped up the baseline.

## Recommendation

**Proceed as-is (rubric outcome "a").** Extraction + hybrid retrieval works. Expand to 30 pairs for consistency testing, then build the minimal demo UI.
