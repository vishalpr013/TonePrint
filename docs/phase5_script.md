# Phase 5: Node.js Test Script

## Purpose

A runnable Node.js script that:
1. Stores each correction object in Supermemory Local (localhost:6767)
2. Retrieves corrections via semantic search scoped by context metadata
3. Assembles generation prompts (with & without memory)
4. Outputs results as both JSON and readable console table

## Files

- [`src/index.js`](../src/index.js) — Main test runner
- [`src/data/pilot_dataset.js`](../src/data/pilot_dataset.js) — Training pairs, corrections, test requests

## Usage

```bash
# Dry-run mode (no Supermemory needed — simulates retrieval)
node src/index.js --dry-run

# Live mode (requires Supermemory Local on port 6767)
node src/index.js
```

## How It Works

### 1. Store Corrections

Each correction is stored as a document in Supermemory with:
- **content:** The full correction text (rule + avoid + prefer + evidence) — this is what gets embedded for semantic search
- **containerTag:** `toneprint-pilot-user` — scopes memory to a single user
- **customId:** `correction-{context}-{n}` — prevents duplicates on re-run
- **metadata:** `{ type: "style_correction", context: "professor|friend|professional", pairId: "...", rule: "..." }`

### 2. Retrieve Corrections

For each transfer test, we search Supermemory with:
- **query:** The new test request (e.g., "Ask my professor if I can switch my presentation slot...")
- **containerTag:** Same user container
- **filters:** `AND[type=style_correction, context=professor]` — metadata filtering ensures we only retrieve corrections from the right context
- **limit:** 3 — top-3 most semantically relevant corrections

### 3. Assemble Prompts

Two prompts are generated for each test:

**Without memory (baseline):**
```
You are a helpful assistant drafting a message for the user.
USER REQUEST: {request}
```

**With memory (correction injected):**
```
You are a helpful assistant drafting a message for the user.

The user has previously corrected messages in this context.
Here are relevant correction patterns you should apply:

--- Correction 1 ---
Rule: {rule}
Avoid: {avoid list}
Prefer: {prefer list}
Evidence (before): {before}
Evidence (after): {after}

Apply these correction patterns to the new message below.
Do NOT copy the evidence text — use it to understand the user's style.

USER REQUEST: {request}
```

### 4. Output

- **Console table** with retrieval success, correct match, and verdict per test
- **Detailed per-test breakdown** with all retrieved corrections and scores
- **JSON file** saved to `results/transfer_results.json`

## Error Handling

- **Supermemory not running:** Detects ECONNREFUSED, prints clear instructions, suggests `--dry-run`
- **No API key:** Checks for both `SUPERMEMORY_API` and `SUPERMEMORY_API_KEY` env vars
- **No matching corrections:** Warns but continues (useful for testing edge cases)
- **Auto-start:** Attempts `Supermemory.local()` which installs and starts the server automatically

## Dry-Run Mode

When run with `--dry-run`, the script:
- Skips Supermemory connection entirely
- Simulates retrieval by filtering corrections by context from the local dataset
- Generates the same prompts and result table
- Useful for testing the pipeline without infrastructure dependencies
