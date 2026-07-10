ROLE:
You are a senior AI systems engineer specializing in memory architectures 
and retrieval-augmented personalization. You have deep hands-on experience 
with vector/semantic memory systems (Supermemory, Mem0, Zep-style tools), 
prompt engineering for structured extraction, and designing rigorous 
evaluation harnesses for "does this system actually learn" claims — not 
just demo-friendly outputs. You are skeptical by default: your job is to 
find out if this architecture works, not to make it look like it works.

CONTEXT:
I'm building "Toneprint" for a 5-day hackathon (Supermemory Local — 
localhost:6767). The core claim is: a system that learns communication 
corrections from one edited message and transfers that learning to a 
DIFFERENT, semantically related message — not just describing an edit, 
but generalizing from it.

Before any UI, React code, or product polish, I need to validate the 
core loop with a small experiment. Do not build anything beyond this 
experiment until I say so.

TASK — build this in order, stopping for my review between phases:

PHASE 1: 9-pair pilot dataset (3 pairs each: professor, friend, 
professional/work contexts)
- For each pair, write: 
  1. A training request (e.g. "tell my professor I'll submit late")
  2. An AI-generated draft (simulate what a generic LLM would produce — 
     slightly stiff, apologetic, verbose)
  3. A manual edit of that draft (how a real person would actually 
     tighten/adjust it)
- Keep these realistic, not caricatures. Vary the correction types 
  across pairs (tone, structure, specific phrases, length) so we're not 
  just testing one pattern.

PHASE 2: Correction extraction
- Design an extraction prompt that takes (original draft, edited version) 
  and outputs a STRUCTURED correction object, not prose. Schema:
  {
    context: string,
    rule: string,              // concise, reusable instruction
    avoid: string[],           // phrases/patterns to avoid
    prefer: string[],          // phrases/patterns to prefer
    evidence: { before: string, after: string }
  }
- Run this on all 9 pairs. Show me the raw outputs before doing anything else.

PHASE 3: Cross-message transfer test (the real pass/fail condition)
- For each of the 3 contexts, take the correction extracted from ONE 
  pair and design a NEW test request in the same context but a 
  DIFFERENT scenario (e.g. if training was about a late assignment, 
  test on requesting a meeting or asking about grades — not another 
  delay message).
- For each test request, generate TWO outputs:
  a) without memory (no correction injected)
  b) with memory (retrieved correction — both the "rule" and the 
     "evidence" before/after — injected into the generation prompt)
- Do NOT just inject the rule alone — test the hybrid: rule + concrete 
  before/after evidence together in the prompt.

PHASE 4: Result table
Produce a table with exactly these columns:
context | training_request | ai_draft | user_edit | extracted_correction 
| new_test_request | output_without_memory | output_with_memory | 
transfer_success (yes/no/partial) | notes

For transfer_success, judge strictly: does the "with memory" output 
apply the LEARNED pattern to genuinely new content, not just repeat 
similar wording? Be honest — mark "no" or "partial" if it's ambiguous. 
Do not round up to make the experiment look successful.

PHASE 5: Node.js test script
Write a runnable Node.js script that:
- Stores each correction object in Supermemory Local (localhost:6767) 
  using containerTag = single user container, metadata = { type: 
  "style_correction", context, ... }
- On a new test request, does semantic search scoped by context metadata 
  to retrieve top-k relevant corrections
- Assembles the generation prompt with both rule + evidence from 
  retrieved corrections
- Runs both the "without memory" and "with memory" generation calls
- Outputs the result table above as JSON and as a readable console table
- Include clear error handling (Supermemory Local not running, no 
  matching corrections found, etc.)

EVALUATION RUBRIC — tell me explicitly at the end:
1. Did extraction (Phase 2) produce specific, reusable rules, or vague 
   generic ones? Give examples of both if mixed.
2. What % of the 9 transfer tests (Phase 3) counted as "yes" transfer 
   success vs. "partial" vs. "no"?
3. Based on 1 and 2, recommend ONE of:
   a) Proceed as-is — extraction + hybrid retrieval works, expand to 
      30 pairs for consistency testing next.
   b) Keep hybrid storage but rely more on raw diff/evidence retrieval 
      and less on the LLM-generated "rule" — extraction is too lossy.
   c) Architecture needs rework — explain specifically what failed and why.

FUTURE CASE — outline this at the end, but do not build any of it yet:
Assuming the pilot passes (rubric outcome "a" or a workable version of 
"b"), lay out the concrete next-step plan across two horizons:

1. Hackathon horizon (remaining ~4 days):
   - What changes when going from 9 pairs to 30 pairs (consistency 
     testing — do rules stay specific, does retrieval stay accurate 
     as the memory store grows, does noise/conflicting corrections 
     appear across similar contexts)
   - What the minimal web UI needs to expose to make the correction 
     loop demoable live (ingest samples, pick context, generate, edit, 
     regenerate, visibly show "correction learned" between the two 
     generations)
   - What the demo script should show, in order, to prove transfer 
     live on stage in under 3 minutes
   - What NOT to build (any feature that doesn't directly support 
     proving the transfer claim)

2. Beyond-hackathon horizon (if this became a real product):
   - How correction memory could generalize beyond writing style to 
     other agent contexts (e.g. coding agents learning from reverted 
     changes, task agents learning from corrected plans) — note this 
     as a stated future direction, not something to build now
   - What would need to change architecturally to support multiple 
     users, larger memory stores, and conflict resolution when 
     corrections contradict each other over time
   - What the honest limitations of this approach are at scale (e.g. 
     correction drift, overfitting to a small sample, context 
     misclassification) so I can speak to weaknesses if judges ask

CONSTRAINTS:
- Do not write any React/UI code in this pass.
- Do not assume success — if results are weak, say so plainly and 
  recommend the pivot from the rubric above.
- Keep the 9-pair pilot lightweight — this should take a focused hour, 
  not an exhaustive dataset. We expand to 30 pairs only after this passes.
- The "Future Case" section is planning only — explicitly do not 
  implement any of it in this pass.

Start with Phase 1 and show me the 9 pairs before moving to Phase 2.