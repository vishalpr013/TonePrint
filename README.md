# Toneprint

**An AI that learns how you actually write from a single edit and applies that style to messages it has never seen.**

Built for the Supermemory Localhost:6767 Hackathon.

---

## The Problem

Generic AI drafts often sound stiff, apologetic, and verbose. You edit the same patterns out every time, but the assistant does not learn from those edits.

## What Toneprint Does

1. **You edit an AI draft** - Toneprint extracts a structured style correction rule.
2. **The rule is stored** - Supermemory Local stores the correction as semantic memory.
3. **On the next request** - Toneprint retrieves relevant corrections and applies your learned style to a different message in the same context.
4. **Delegate & Dispatch (Human-in-the-Loop)** - Tonal outputs expose action shortcuts to send the message immediately:
   * **Email**: Opens Gmail compose screen directly in browser, prefilling subject and body.
   * **WhatsApp**: Triggers a WhatsApp Web deep-link to prefill and send the message.
   * **Copy**: One-click clipboard copying.

The key claim: **one correction transfers to different scenarios.** Edit a late-submission email, and the system should apply that directness pattern to a different professor message (e.g. asking to switch a presentation slot) without being told to repeat the original wording.

---

## How It Uses Supermemory Local

Each user correction is extracted into a structured rule:

```json
{
  "context": "professor",
  "rule": "Open with the factual situation...",
  "avoid": ["I hope this email finds you well"],
  "prefer": ["State what happened first"],
  "evidence": {
    "before": "verbose draft excerpt",
    "after": "edited user excerpt"
  }
}
```

Toneprint stores that object in Supermemory Local with context metadata. On a new request, it runs semantic search scoped by context and injects both the abstract rule and concrete before/after evidence into the generation prompt.

---

## Locality & Private Mode

All memory and generation stay entirely on your local machine:
* **Memory:** Managed locally by Supermemory Local running at `http://localhost:6767`.
* **LLM Engine:** Local Ollama running through `http://localhost:11434` (using `llama3.2:3b` by default).

No cloud tokens, no external API latency.

---

## Quick Start & Setup Guide

To run Toneprint, you need to set up two background services (Ollama and Supermemory Local) and then launch the Toneprint web interface.

### 1. Set Up Background Services

#### 🅰️ Ollama (Local LLM Engine)
1. Download and install Ollama from [ollama.com](https://ollama.com).
2. Start the Ollama application. It will run in the background as a local service listening on:
   `http://localhost:11434`
3. Download the default Llama 3.2 model by running the following in your terminal:
   ```bash
   ollama pull llama3.2:3b
   ```

#### 🅱️ Supermemory Local (Local Vector Database)
1. Install the Supermemory CLI/Server wrapper on your system:
   ```bash
   # On macOS/Linux/WSL
   curl -fsSL https://supermemory.ai/install | bash
   ```
2. Start the Supermemory server locally. It will bind to port `6767`:
   ```bash
   supermemory-server
   ```
3. Locate your generated API key token:
   * During first boot, the server outputs your key to the terminal.
   * You can also find it inside your local environment config file at: `~/.supermemory/env` or `E:\Supermemory\.supermemory\api-key`.

---

### 2. Install Toneprint Dependencies

Open a new terminal in the `Supermemory/` project root directory:

1. Install the Python backend requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Install the workspace orchestrator:
   ```bash
   npm install
   ```
3. Install the frontend React packages:
   ```bash
   npm install --prefix frontend
   ```

---

### 3. Configure the Environment

Create a `.env` file at the root of the project:
```env
SUPERMEMORY_API=sm_YOUR_LOCAL_TOKEN   # Replace with your Supermemory Local key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

---

### 4. Run the Application

#### 🚀 Start Web Interface (Vite Client + FastAPI Backend)
Start the concurrent dev servers from the root folder:
```bash
npm run dev
```
* The **FastAPI backend** will start on `http://localhost:3001` (hot-reloaded).
* The **Vite React client** will start on `http://localhost:3000`.
* Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 📊 Run CLI Test Harness (Optional)
Evaluate the vector retrieval and matching success of your Supermemory Local data:
```bash
# With local Supermemory server active on port 6767
npm run test-cli

# In simulated offline mode (no Supermemory server active)
npm run test-cli-dry
```

---

## Project Structure

```text
Supermemory/
├── backend/
│   ├── main.py            # FastAPI entry point & API endpoints
│   ├── llm.py             # Ollama local connector & fallback logic
│   ├── pilot_data.py      # Dictionaries for matching fallbacks
│   └── requirements.txt   # Python dependency list
├── frontend/
│   ├── vite.config.js     # Vite configuration (builds to frontend/dist)
│   ├── package.json       # React dependencies and vite client scripts
│   └── src/
│       ├── ui/            # UI components (App.jsx, main.jsx, index.html)
│       └── data/          # pilot_dataset.js
├── docs/                  # Experiment documentation & Phase details
├── package.json           # Master orchestrator script
├── requirements.txt       # Master Python requirement list
└── .env                   # Shared environment credentials
```

---

## Tech Stack

* **Memory Store:** Supermemory Local (`localhost:6767`)
* **LLM Engine:** Local Ollama (`localhost:11434`)
* **Backend:** FastAPI (Python 3) + Uvicorn
* **Frontend:** Vite + React (TypeScript/JS)

---

## License

MIT
