# Phase 3: Cross-Message Transfer Test

## Purpose

The real pass/fail condition: does a correction extracted from ONE message transfer to a DIFFERENT, semantically related message in the same context?

## Test Design

For each context, we:
1. Selected ONE correction from Phase 2
2. Designed a NEW test request in the same context but a **completely different scenario**
3. Generated TWO outputs: without memory (baseline) and with memory (rule + evidence injected)

### Deliberately Different Scenarios

| Context | Training Scenario | Test Scenario | Why Different |
|---------|-------------------|---------------|---------------|
| Professor | Late submission (apology situation) | Switch presentation slot (scheduling request) | Different message type, different emotional stakes |
| Friend | Cancel birthday (bad news) | Got promoted (good news) | Emotional valence flip — tests if register transfers across mood |
| Professional | PTO request (time off) | WFH request (schedule change) | Different approval type, different logistics |

## Generation Prompt Template (With Memory)

The prompt injects **both** the abstract rule AND the concrete before/after evidence:

```
You are a helpful assistant drafting a message for the user.

The user has previously corrected messages in this context. Here is a relevant
correction pattern you should apply:

CORRECTION RULE: {{rule}}
PATTERNS TO AVOID: {{avoid_list}}
PATTERNS TO PREFER: {{prefer_list}}
EVIDENCE OF THIS PREFERENCE:
  Before: {{evidence.before}}
  After: {{evidence.after}}

Apply this correction pattern to the new message below. Do NOT copy the evidence
text — use it to understand the user's style, then generate new content in that style.

USER REQUEST: {{new_test_request}}
```

## Results

### Test 1: Professor — ✅ YES

**Training:** Late submission → **Test:** Switch presentation slot

The 3-step pattern (fact → solution → ask about process) transferred cleanly:
- Before: 120+ words, "I hope this finds you well", "I sincerely apologize"
- After: 40 words, "My group partner is sick... Could we move our slot to Thursday?"

### Test 2: Friend — ✅ YES (Strongest Signal)

**Training:** Cancel birthday (negative) → **Test:** Share promotion (positive)

The casual register transferred across emotional valence:
- Before: 80 words, "I wanted to share some exciting news", "Best,"
- After: 35 words, "DUDE I GOT PROMOTED!!! 🎉🎉🎉 ... drinks on me obviously 🥂"

**Key insight:** The model didn't mimic the sad tone from the training correction — it applied the *structural pattern* (casual register, emoji, emotion-first, concrete plan) to positive content.

### Test 3: Professional — ✅ YES

**Training:** PTO request → **Test:** WFH schedule change

The pattern adapted intelligently:
- "Handoff to Sarah" became "keep my calendar up to date" (no coverage person needed for WFH)
- "Approve in Workday" became "flag the schedule change in Workday"

**Bonus finding:** The structured correction actually prevented a logical confusion that tripped up the baseline (the baseline got tangled on "noisy at home → work from home??").

## Summary

| Context | Transfer Success | Key Signal |
|---------|-----------------|------------|
| Professor | ✅ YES | Structure (fact→solution→ask) generalized |
| Friend | ✅ YES | Register transferred across emotional valence |
| Professional | ✅ YES | Pattern adapted specifics intelligently |

**3/3 transfer tests passed.** All showed genuinely new content — no evidence phrases copied.
