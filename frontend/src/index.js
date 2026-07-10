/**
 * Toneprint Phase 5 — End-to-end test script
 *
 * 1. Stores each correction in Supermemory Local (localhost:6767)
 * 2. For each transfer test request, retrieves corrections via semantic search
 * 3. Assembles generation prompts (with & without memory)
 * 4. Outputs a result table as JSON and readable console table
 *
 * Usage:
 *   node src/index.js            # Full run (requires Supermemory Local)
 *   node src/index.js --dry-run  # Simulated run (no Supermemory needed)
 *
 * Requires:
 *   - Supermemory Local running at localhost:6767 (unless --dry-run)
 *   - SUPERMEMORY_API env var set in .env
 */

const DRY_RUN = process.argv.includes("--dry-run");

require("dotenv").config();
const Supermemory = require("supermemory").default;
const { corrections, transferTests, trainingPairs } = require("./data/pilot_dataset.js");

// ─── Configuration ──────────────────────────────────────────────
const CONTAINER_TAG = "toneprint-pilot-user";
const SUPERMEMORY_PORT = 6767;
const SUPERMEMORY_BASE_URL = `http://localhost:${SUPERMEMORY_PORT}`;
const API_KEY = process.env.SUPERMEMORY_API || process.env.SUPERMEMORY_API_KEY;

if (!API_KEY) {
  console.error("❌ No API key found. Set SUPERMEMORY_API or SUPERMEMORY_API_KEY in .env");
  process.exit(1);
}

// Client is initialized in main() — either via Supermemory.local() or manual config
let client;

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Build the content string for a correction to store in Supermemory.
 * This is what gets embedded and searched against semantically.
 * We include the rule, avoid/prefer patterns, AND the before/after evidence
 * so semantic search can match on both abstract rules and concrete examples.
 */
function buildCorrectionContent(correction) {
  return [
    `[STYLE CORRECTION — ${correction.context.toUpperCase()}]`,
    ``,
    `Rule: ${correction.rule}`,
    ``,
    `Avoid: ${correction.avoid.join("; ")}`,
    ``,
    `Prefer: ${correction.prefer.join("; ")}`,
    ``,
    `Evidence (before): ${correction.evidence.before}`,
    ``,
    `Evidence (after): ${correction.evidence.after}`,
  ].join("\n");
}

/**
 * Build a generation prompt WITH memory (correction injected).
 */
function buildPromptWithMemory(testRequest, retrievedCorrections) {
  const correctionBlocks = retrievedCorrections.map((c, i) => {
    return [
      `--- Correction ${i + 1} ---`,
      `Rule: ${c.rule}`,
      `Avoid: ${c.avoid.join("; ")}`,
      `Prefer: ${c.prefer.join("; ")}`,
      `Evidence (before): ${c.evidence.before}`,
      `Evidence (after): ${c.evidence.after}`,
    ].join("\n");
  });

  return [
    `You are a helpful assistant drafting a message for the user.`,
    ``,
    `The user has previously corrected messages in this context. Here are relevant correction patterns you should apply:`,
    ``,
    ...correctionBlocks,
    ``,
    `Apply these correction patterns to the new message below. Do NOT copy the evidence text — use it to understand the user's style, then generate new content in that style.`,
    ``,
    `USER REQUEST: ${testRequest}`,
  ].join("\n");
}

/**
 * Build a generation prompt WITHOUT memory (baseline).
 */
function buildPromptWithoutMemory(testRequest) {
  return [
    `You are a helpful assistant drafting a message for the user.`,
    ``,
    `USER REQUEST: ${testRequest}`,
  ].join("\n");
}

/**
 * Wait for Supermemory to process a document (memories are extracted async).
 * Poll until the document shows up in search, or timeout.
 */
async function waitForProcessing(delayMs = 2000) {
  console.log(`   ⏳ Waiting ${delayMs}ms for memory processing...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

// ─── Main Pipeline ──────────────────────────────────────────────

async function initializeClient() {
  // Try Supermemory.local() first — it auto-installs and starts the local server
  console.log("🔌 Initializing Supermemory Local...");
  try {
    client = await Supermemory.local({
      apiKey: API_KEY,
      port: SUPERMEMORY_PORT,
      start: true,
      startupTimeout: 60000,
    });
    console.log(`✅ Supermemory Local is running on port ${SUPERMEMORY_PORT}`);
    return true;
  } catch (localErr) {
    console.warn(`⚠️  Supermemory.local() failed: ${localErr.message}`);
    console.log("   Trying direct connection to", SUPERMEMORY_BASE_URL, "...");
  }

  // Fallback: try connecting directly
  client = new Supermemory({
    apiKey: API_KEY,
    baseURL: SUPERMEMORY_BASE_URL,
  });

  try {
    await client.add({ content: "connection test" });
    console.log("✅ Connected to Supermemory Local at", SUPERMEMORY_BASE_URL);
    return true;
  } catch (err) {
    console.error(`❌ Cannot connect to Supermemory Local at ${SUPERMEMORY_BASE_URL}`);
    console.error("   Error:", err.message);
    console.error("   Make sure Supermemory Local is running. Start it with:");
    console.error("     npx supermemory@latest");
    console.error("   Or it will auto-start if the 'supermemory' npm package CLI is available.");
    return false;
  }
}

async function storeCorrections() {
  console.log("\n📦 STEP 1: Storing corrections in Supermemory...\n");

  const stored = [];
  for (const correction of corrections) {
    const content = buildCorrectionContent(correction);

    try {
      const result = await client.add({
        content,
        containerTag: CONTAINER_TAG,
        customId: correction.id,
        metadata: {
          type: "style_correction",
          context: correction.context,
          pairId: correction.pairId,
          rule: correction.rule,
        },
      });

      console.log(`   ✅ Stored: ${correction.id} (${correction.context}) → doc: ${result.id}`);
      stored.push({ correctionId: correction.id, docId: result.id, status: result.status });
      
      // Sleep to prevent triggering concurrent Gemini API rate limits (429) during memory extraction
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`   ❌ Failed to store ${correction.id}:`, err.message);
      stored.push({ correctionId: correction.id, error: err.message });
    }
  }

  return stored;
}

async function retrieveCorrections(testRequest, context) {
  console.log(`\n🔍 Searching for corrections matching: "${testRequest.substring(0, 60)}..."`);
  console.log(`   Context filter: ${context}`);

  try {
    const searchResult = await client.search.memories({
      q: testRequest,
      containerTag: CONTAINER_TAG,
      filters: {
        AND: [
          { key: "context", value: context, filterType: "metadata" },
          { key: "type", value: "style_correction", filterType: "metadata" },
        ],
      },
      limit: 3,
    });

    console.log(`   Found ${searchResult.total} results (${searchResult.timing}ms)`);

    if (searchResult.results.length === 0) {
      console.log("   ⚠️  No matching corrections found.");
      return [];
    }

    // Map results back to our correction objects using metadata
    const matchedCorrections = [];
    for (const result of searchResult.results) {
      const pairId = result.metadata?.pairId;
      const correction = corrections.find((c) => c.pairId === pairId);
      if (correction) {
        matchedCorrections.push({
          ...correction,
          searchScore: result.similarity,
          memoryContent: result.memory,
        });
        console.log(
          `   📎 Matched: ${correction.id} (score: ${result.similarity.toFixed(3)}) — "${correction.rule.substring(0, 60)}..."`
        );
      } else {
        // If we can't match by pairId, still show what was found
        console.log(
          `   📎 Found memory (score: ${result.similarity.toFixed(3)}): "${(result.memory || "").substring(0, 80)}..."`
        );
      }
    }

    return matchedCorrections;
  } catch (err) {
    console.error(`   ❌ Search failed:`, err.message);
    return [];
  }
}

async function runTransferTests() {
  console.log("\n🧪 STEP 2: Running transfer tests...\n");
  console.log("═".repeat(80));

  const results = [];

  for (const test of transferTests) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📋 TEST: ${test.context.toUpperCase()} context`);
    console.log(`   Training pair: ${test.trainingPairId}`);
    console.log(`   Test request: "${test.testRequest}"`);
    console.log(`${"─".repeat(80)}`);

    // Find the training pair
    const trainingPair = trainingPairs.find((p) => p.id === test.trainingPairId);
    // Find the correction used for training
    const trainingCorrection = corrections.find((c) => c.pairId === test.trainingPairId);

    // Retrieve relevant corrections from Supermemory
    const retrievedCorrections = await retrieveCorrections(test.testRequest, test.context);

    // Build prompts
    const promptWithout = buildPromptWithoutMemory(test.testRequest);
    const promptWith =
      retrievedCorrections.length > 0
        ? buildPromptWithMemory(test.testRequest, retrievedCorrections)
        : null;

    // Log prompts
    console.log("\n📝 PROMPT WITHOUT MEMORY:");
    console.log("   " + promptWithout.split("\n").join("\n   "));

    if (promptWith) {
      console.log("\n📝 PROMPT WITH MEMORY:");
      console.log("   " + promptWith.split("\n").join("\n   "));
    } else {
      console.log("\n⚠️  No corrections retrieved — cannot generate with-memory prompt");
    }

    // Build result row
    const row = {
      context: test.context,
      trainingRequest: trainingPair?.request || "N/A",
      trainingScenario: trainingPair?.scenario || "N/A",
      testRequest: test.testRequest,
      testScenario: test.scenario,
      extractedRule: trainingCorrection?.rule || "N/A",
      retrievedCorrections: retrievedCorrections.map((c) => ({
        id: c.id,
        rule: c.rule,
        score: c.searchScore,
      })),
      promptWithoutMemory: promptWithout,
      promptWithMemory: promptWith,
      retrievalSuccess: retrievedCorrections.length > 0,
      correctCorrectionRetrieved: retrievedCorrections.some(
        (c) => c.pairId === test.trainingPairId
      ),
      notes: "",
    };

    // Assess retrieval quality
    if (!row.retrievalSuccess) {
      row.notes = "RETRIEVAL FAILED — no corrections returned for this context.";
    } else if (row.correctCorrectionRetrieved) {
      row.notes = `SUCCESS — retrieved the expected correction from training pair ${test.trainingPairId}`;
    } else {
      row.notes = `PARTIAL — retrieved corrections from same context but not the expected training pair. Retrieved: ${retrievedCorrections.map((c) => c.id).join(", ")}`;
    }

    results.push(row);
  }

  return results;
}

function printResultsTable(results) {
  console.log("\n\n" + "═".repeat(80));
  console.log("📊 RESULTS TABLE");
  console.log("═".repeat(80));

  // Console table - simplified view
  const tableData = results.map((r) => ({
    Context: r.context,
    "Training Scenario": r.trainingScenario,
    "Test Scenario": r.testScenario,
    "Retrieval OK": r.retrievalSuccess ? "✅" : "❌",
    "Correct Match": r.correctCorrectionRetrieved ? "✅" : "❌",
    "# Retrieved": r.retrievedCorrections.length,
    Notes: r.notes.substring(0, 50) + (r.notes.length > 50 ? "..." : ""),
  }));

  console.table(tableData);

  // Detailed per-test output
  for (const r of results) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Context: ${r.context}`);
    console.log(`Training: "${r.trainingRequest.substring(0, 60)}..."`);
    console.log(`Test:     "${r.testRequest}"`);
    console.log(`Rule:     "${r.extractedRule.substring(0, 80)}..."`);
    console.log(`Retrieved corrections:`);
    for (const c of r.retrievedCorrections) {
      console.log(`  - ${c.id} (score: ${c.score?.toFixed(3)}) — "${c.rule.substring(0, 60)}..."`);
    }
    console.log(`Verdict:  ${r.notes}`);
  }

  // Summary stats
  console.log(`\n${"═".repeat(80)}`);
  console.log("SUMMARY");
  console.log(`${"═".repeat(80)}`);
  console.log(`Total tests:            ${results.length}`);
  console.log(`Retrieval success:      ${results.filter((r) => r.retrievalSuccess).length}/${results.length}`);
  console.log(`Correct match:          ${results.filter((r) => r.correctCorrectionRetrieved).length}/${results.length}`);
  console.log(
    `\nNOTE: This script tests the retrieval layer (Supermemory semantic search).`
  );
  console.log(
    `Actual LLM generation (with/without memory) requires an LLM API key (e.g. OpenAI).`
  );
  console.log(
    `The prompts above can be fed to any LLM to complete the end-to-end transfer test.`
  );
}

async function saveResultsJSON(results) {
  const fs = require("fs");
  const path = require("path");
  const outDir = path.join(__dirname, "..", "results");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "transfer_results.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outPath}`);
}

/**
 * Simulate retrieval in dry-run mode — match corrections by context.
 * This mimics what Supermemory would return via semantic search.
 */
function simulateRetrieval(testRequest, context) {
  console.log(`\n🔍 [DRY-RUN] Simulating retrieval for: "${testRequest.substring(0, 60)}..."`);
  console.log(`   Context filter: ${context}`);

  const contextCorrections = corrections.filter((c) => c.context === context);
  const simulated = contextCorrections.map((c) => ({
    ...c,
    searchScore: 0.75 + Math.random() * 0.2, // Simulated score 0.75-0.95
    memoryContent: buildCorrectionContent(c),
  }));

  console.log(`   Found ${simulated.length} corrections (simulated)`);
  for (const c of simulated) {
    console.log(
      `   📎 Matched: ${c.id} (score: ${c.searchScore.toFixed(3)}) — "${c.rule.substring(0, 60)}..."`
    );
  }

  return simulated;
}

/**
 * Run transfer tests — works in both live and dry-run mode.
 */
async function runTransferTestsUnified() {
  console.log("\n🧪 Running transfer tests...\n");
  console.log("═".repeat(80));

  const results = [];

  for (const test of transferTests) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📋 TEST: ${test.context.toUpperCase()} context`);
    console.log(`   Training pair: ${test.trainingPairId}`);
    console.log(`   Test request: "${test.testRequest}"`);
    console.log(`${"─".repeat(80)}`);

    const trainingPair = trainingPairs.find((p) => p.id === test.trainingPairId);
    const trainingCorrection = corrections.find((c) => c.pairId === test.trainingPairId);

    // Retrieve corrections (live or simulated)
    const retrievedCorrections = DRY_RUN
      ? simulateRetrieval(test.testRequest, test.context)
      : await retrieveCorrections(test.testRequest, test.context);

    // Build prompts
    const promptWithout = buildPromptWithoutMemory(test.testRequest);
    const promptWith =
      retrievedCorrections.length > 0
        ? buildPromptWithMemory(test.testRequest, retrievedCorrections)
        : null;

    console.log("\n📝 PROMPT WITHOUT MEMORY:");
    console.log("   " + promptWithout.split("\n").join("\n   "));

    if (promptWith) {
      console.log("\n📝 PROMPT WITH MEMORY:");
      console.log("   " + promptWith.split("\n").join("\n   "));
    }

    const row = {
      context: test.context,
      trainingRequest: trainingPair?.request || "N/A",
      trainingScenario: trainingPair?.scenario || "N/A",
      testRequest: test.testRequest,
      testScenario: test.scenario,
      extractedRule: trainingCorrection?.rule || "N/A",
      retrievedCorrections: retrievedCorrections.map((c) => ({
        id: c.id,
        rule: c.rule,
        score: c.searchScore,
      })),
      promptWithoutMemory: promptWithout,
      promptWithMemory: promptWith,
      retrievalSuccess: retrievedCorrections.length > 0,
      correctCorrectionRetrieved: retrievedCorrections.some(
        (c) => c.pairId === test.trainingPairId
      ),
      mode: DRY_RUN ? "dry-run" : "live",
    };

    if (row.correctCorrectionRetrieved) {
      row.notes = `SUCCESS — retrieved the expected correction from training pair ${test.trainingPairId}`;
    } else if (row.retrievalSuccess) {
      row.notes = `PARTIAL — retrieved corrections from same context but not the expected training pair`;
    } else {
      row.notes = "RETRIEVAL FAILED — no corrections returned for this context.";
    }

    results.push(row);
  }

  return results;
}

// ─── Entry Point ────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         TONEPRINT — Phase 5 Test Runner         ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (DRY_RUN) {
    console.log("🏃 Running in DRY-RUN mode (no Supermemory connection required)\n");
    console.log(`   Dataset: ${trainingPairs.length} training pairs, ${corrections.length} corrections`);
    console.log(`   Tests: ${transferTests.length} transfer tests\n`);

    const results = await runTransferTestsUnified();
    printResultsTable(results);
    await saveResultsJSON(results);
    return;
  }

  // ── Live mode ──
  console.log("🔌 Running in LIVE mode (requires Supermemory Local)\n");

  // 1. Initialize client
  const connected = await initializeClient();
  if (!connected) {
    console.log("\n💡 Tip: Run with --dry-run to test without Supermemory:");
    console.log("   node src/index.js --dry-run\n");
    process.exit(1);
  }

  // 2. Store all corrections
  const storeResults = await storeCorrections();
  const storedCount = storeResults.filter((r) => !r.error).length;
  console.log(`\n   📊 Stored ${storedCount}/${corrections.length} corrections.`);

  if (storedCount === 0) {
    console.error("\n❌ No corrections were stored. Cannot proceed.");
    process.exit(1);
  }

  // 3. Wait for processing
  await waitForProcessing(10000);

  // 4. Run transfer tests
  const results = await runTransferTestsUnified();

  // 5. Output
  printResultsTable(results);
  await saveResultsJSON(results);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});

