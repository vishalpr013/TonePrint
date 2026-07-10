# Phase 1: 9-Pair Pilot Dataset

## Purpose

Create a realistic, varied dataset of 9 training pairs (3 per context) to test whether the correction extraction + transfer pipeline works. Each pair contains:

1. **Training request** — what the user asked the AI to write
2. **AI draft** — a simulated generic-LLM output (slightly stiff, apologetic, verbose)
3. **User edit** — how a real person would actually revise it

## Design Decisions

- **AI drafts are realistically bad, not cartoonishly bad** — they mimic real LLM patterns (excessive hedging, "I hope this finds you well", over-apologizing) rather than being obviously terrible
- **Correction types are deliberately varied across pairs** so we're not just testing one pattern:

| Pair | Context | Scenario | Correction Type |
|------|---------|----------|-----------------|
| 1 | Professor | Late submission | Cut apology, increase directness |
| 2 | Professor | Rec letter | Remove filler, add specific details |
| 3 | Professor | Reschedule | Shorten, remove over-explanation |
| 4 | Friend | Cancel birthday | Shift to casual register, add warmth |
| 5 | Friend | Recommend show | Add personality/enthusiasm |
| 6 | Friend | Help moving | Be direct about the ask, add humor |
| 7 | Professional | Job follow-up | Tighten structure, add value prop |
| 8 | Professional | Time off | Remove over-justification, state facts |
| 9 | Professional | Decline meeting | Don't over-apologize, offer alternative |

## Contexts

- **Professor:** Emails to academic faculty — respectful but not groveling
- **Friend:** Casual messages — emoji, lowercase, personality
- **Professional:** Work communications — efficient, action-oriented

## Full Dataset

The complete dataset is in [`src/data/pilot_dataset.js`](../src/data/pilot_dataset.js) as structured JS objects.

### Example (Pair 1 — Professor / Late Submission)

**Request:** "Tell my professor I'll submit the assignment two days late because my laptop crashed and I lost my work."

**AI Draft (before):**
> Dear Professor,
> I hope this email finds you well. I am writing to sincerely apologize for the inconvenience, but unfortunately, I will not be able to submit the assignment by the deadline. My laptop experienced a critical failure, and I lost a significant portion of my work. I deeply regret any trouble this may cause you...

**User Edit (after):**
> Hi Professor,
> My laptop crashed and I lost my progress on the assignment. I'm redoing it now and can have it to you by Wednesday (two days past the deadline). Would that work, or is there a different process I should follow for late submissions?
> Thanks, [Your Name]

**What changed:** Cut 130 words to 50. Removed all apology preamble. Added a specific make-up date. Asked about process instead of begging for forgiveness.
