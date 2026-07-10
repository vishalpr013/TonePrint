# LLM adapter for Toneprint in Python.
# Runs text generation and rule extraction strictly via Local Ollama,
# falling back to high-fidelity pilot dataset mocks if Ollama is not running.

import os
import json
import urllib.request
import urllib.error
from pilot_data import training_pairs, corrections

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b")

print(f"Ollama local provider active ({OLLAMA_MODEL} at {OLLAMA_BASE_URL})")

def generate_with_ollama(prompt: str) -> str:
    url = f"{OLLAMA_BASE_URL}/api/generate"
    data = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }
    req_body = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=req_body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("response", "").strip()
    except urllib.error.URLError as e:
        raise Exception(f"Ollama request failed: {e.reason}")
    except Exception as e:
        raise Exception(f"Ollama request failed: {str(e)}")

def fallback_draft(request: str, context: str) -> str:
    print(f"[Ollama Offline Fallback] Generating baseline draft for request: \"{request}\"")
    match = None
    for p in training_pairs:
        if p["context"] == context and request.lower().split()[0] in p["request"].lower():
            match = p
            break
            
    if match:
        return match["aiDraft"]
        
    if context == "friend":
        return f"Hello,\n\nI hope you are doing well. I am writing to you in response to your request: \"{request}\". I wanted to apologize for any inconvenience, and please let me know if you need anything else.\n\nBest,\n[Your Name]"
        
    return f"Dear recipient,\n\nI hope this email finds you well. I am writing to you in response to your request: \"{request}\". I wanted to apologize for any inconvenience, and please let me know if you need anything else.\n\nBest regards,\n[Your Name]"

def generate_draft(request: str, context: str) -> str:
    fmt = "chat/text message" if context == "friend" else "email/message"
    filler = (
        'open with stiff chat filler like "Hello, I hope you are doing well" or "Greetings, I wanted to reach out to you"'
        if context == "friend" else
        'open with stiff email filler like "I hope this email finds you well"'
    )
    
    prompt = f"""You are a typical, slightly stiff, apologetic, and verbose AI writer.
Draft the baseline {fmt} based on the user request.
Keep it typical of generic LLM writing: {filler}, be overly polite, explain too much, and apologize excessively if there's a conflict.

CRITICAL INSTRUCTION: Output ONLY the final drafted message text. Do NOT include any chat assistant introduction, conversational remarks, preambles, quotes wrapping the draft, or follow-up sentences (e.g. do NOT say "Here is a draft"). Just output the raw draft text.

Context: {context}
User request: {request}

Draft:"""

    try:
        return generate_with_ollama(prompt)
    except Exception as e:
        print(f"Ollama draft generation failed ({str(e)}). Using offline demo fallback.")
        return fallback_draft(request, context)

def fallback_correction(original: str, edited: str, context: str) -> dict:
    print(f"[Ollama Offline Fallback] Simulating correction extraction for {context} edit")
    match = None
    for c in corrections:
        if c["context"] == context:
            match = c
            break
            
    if match:
        return match
        
    return {
        "context": context,
        "rule": "Write directly and skip formal preambles like apology intro sentences.",
        "avoid": ["I hope this email finds you well", "I apologize for any inconvenience"],
        "prefer": ["State the purpose in the first sentence", "Be direct"],
        "evidence": {
            "before": original[:100] + "...",
            "after": edited[:100] + "..."
        }
    }

def extract_correction(original: str, edited: str, context: str) -> dict:
    prompt = f"""You are a communication style analyzer. You will be given two versions of a message:
- ORIGINAL: an AI-generated draft
- EDITED: the human's revised version

Your job is to extract a SINGLE, reusable correction rule that captures the most important pattern the human applied when editing the draft.

Output ONLY valid JSON matching this exact schema:
{{
  "context": "{context}",
  "rule": "concise, imperative instruction for future messages - e.g., 'Open with factual situation immediately, skip apologies'",
  "avoid": ["phrases or habits from ORIGINAL to avoid"],
  "prefer": ["phrases or structures from EDITED to prefer"],
  "evidence": {{
    "before": "representative short excerpt from ORIGINAL that was changed",
    "after": "corresponding short excerpt from EDITED"
  }}
}}

Rules:
1. "rule" must be specific and actionable, not "be concise".
2. "avoid" and "prefer" must contain concrete phrases/patterns.
3. Excerpts in "evidence" should be 1-2 sentences.
4. Return ONLY the raw JSON. Do not wrap in markdown codeblocks.

ORIGINAL:
{original}

EDITED:
{edited}"""

    try:
        text = generate_with_ollama(prompt)
        clean_text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Ollama correction extraction failed ({str(e)}). Using offline demo fallback.")
        return fallback_correction(original, edited, context)

def fallback_memory_output(request: str, context: str) -> str:
    print(f"[Ollama Offline Fallback] Simulating memory-augmented generation for: \"{request}\"")
    if context == "professor" and "presentation slot" in request:
        return "Hi Professor,\n\nMy group partner is sick and won't be able to present on Tuesday. Could we move our slot to Thursday instead? If that doesn't work, is there another day with an open slot we could take?\n\nThanks,\n[Your Name]"
    if context == "friend" and "promoted" in request:
        return "DUDE I GOT PROMOTED!!! I'm literally still shaking lol they told me this morning and I can't stop smiling\n\nwe're going out this weekend, no excuses. drinks on me obviously. saturday night??"
    if context == "professional" and "work from home" in request:
        return "Hi [Manager's Name],\n\nMy apartment is being renovated next week, and the noise will make it hard to focus. Could I work from home somewhere quieter next week instead of coming in? I'll keep my calendar up to date and make sure standups and the Thursday review aren't affected.\n\nCould you approve the schedule change when you get a chance?\n\nThanks,\n[Your Name]"
        
    return f"Hi,\n\nI need to talk to you about: {request}. Let me know if we can coordinate.\n\nThanks,\n[Your Name]"

def generate_with_memory(request: str, context: str, retrieved_corrections: list) -> str:
    blocks = []
    for i, c in enumerate(retrieved_corrections):
        blocks.append(f"""--- Correction {i + 1} ---
Rule: {c.get('rule', '')}
Avoid: {'; '.join(c.get('avoid', []))}
Prefer: {'; '.join(c.get('prefer', []))}
Evidence (before): {c.get('evidence', {}).get('before', '')}
Evidence (after): {c.get('evidence', {}).get('after', '')}""")
    correction_blocks = "\n\n".join(blocks)
    
    prompt = f"""You are a style-personalizer writing on behalf of the user. 
The user has previously corrected messages in this context. Here are relevant correction patterns you must apply to match the user's style:

{correction_blocks}

Apply these correction patterns to write the new message based on the request below. Do NOT copy the evidence text verbatim — use it to understand the user's voice, then write new content in that voice.

CRITICAL INSTRUCTION: Output ONLY the final personalized message text. Do NOT include any chat assistant preambles, explanations, remarks, quotes wrapping the text, or follow-up remarks (e.g. do NOT write "Here is the revised message:"). Just output the raw personalized text directly.

USER REQUEST: {request}

Personalized Message:"""

    try:
        return generate_with_ollama(prompt)
    except Exception as e:
        print(f"Ollama memory generation failed ({str(e)}). Using offline demo fallback.")
        return fallback_memory_output(request, context)
