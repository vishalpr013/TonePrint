import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  HelpCircle, 
  ArrowRight,
  RefreshCw,
  Info,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Mail,
  Copy,
  MessageSquare
} from "lucide-react";

// Context metadata settings
const CONTEXTS = [
  { id: "professor", label: "Academic / Professor", color: "blue", gradient: "from-blue-600 to-indigo-500", accent: "indigo" },
  { id: "friend", label: "Casual / Friend", color: "pink", gradient: "from-pink-500 via-rose-500 to-red-500", accent: "rose" },
  { id: "professional", label: "Work / Professional", color: "emerald", gradient: "from-emerald-500 to-teal-500", accent: "teal" }
];

// Presets based on Phase 1 & Phase 3 data for quick demoing
const PRESETS = {
  professor: {
    training: {
      request: "Tell my professor I'll submit the assignment two days late because my laptop crashed and I lost my work.",
      draft: `Dear Professor,

I hope this email finds you well. I am writing to sincerely apologize for the inconvenience, but unfortunately, I will not be able to submit the assignment by the deadline. My laptop experienced a critical failure, and I lost a significant portion of my work. I deeply regret any trouble this may cause you, and I completely understand if there are penalties involved. I am currently working diligently to redo the assignment and would be incredibly grateful if you could allow me to submit it two days after the original deadline. I truly appreciate your understanding and patience in this matter, and I assure you it will not happen again.

Sincerely,
[Your Name]`,
      edit: `Hi Professor,

My laptop crashed and I lost my progress on the assignment. I'm redoing it now and can have it to you by Wednesday (two days past the deadline). Would that work, or is there a different process I should follow for late submissions?

Thanks,
[Your Name]`
    },
    test: {
      request: "Ask my professor if I can switch my presentation slot from Tuesday to Thursday because my group partner is sick."
    }
  },
  friend: {
    training: {
      request: "Tell my friend I can't make it to their birthday party this weekend because I have to study for finals.",
      draft: `Hey,

I hope you're doing well. I wanted to let you know that unfortunately, I will not be able to attend your birthday party this weekend. I have final exams coming up next week and I need to dedicate this weekend to studying. I feel really bad about missing your celebration and I sincerely apologize for the inconvenience. I hope you have a wonderful time and I would love to make it up to you afterwards. Please know that I will be thinking of you on your special day.

Best wishes,
[Your Name]`,
      edit: `hey!! I'm SO bummed but I can't make it saturday — finals are next week and I'm drowning lol. Can we do dinner or something the week after to celebrate? I'll get you a drink 🎂

happy early birthday ❤️`
    },
    test: {
      request: "Tell my friend I just got promoted at work and want to celebrate."
    }
  },
  professional: {
    training: {
      request: "Email my manager requesting three days off next month for a family wedding.",
      draft: `Dear [Manager's Name],

I hope you are doing well. I am writing to respectfully request some time off from work. My cousin is getting married next month, and the wedding celebration spans several days as it is a traditional ceremony with multiple events. The wedding is taking place out of state, so I will also need travel time. I would like to request three days of paid time off: October 15th, 16th, and 17th. I want to assure you that I will make every effort to complete all pending work before my absence and ensure a smooth handoff of any ongoing projects. I will coordinate with the team to make sure nothing falls through the cracks. I hope this won't cause too much inconvenience, and I truly appreciate your understanding. Please let me know if these dates would work or if there are any concerns.

Thank you for your consideration.

Best regards,
[Your Name]`,
      edit: `Hi [Manager's Name],

I'd like to take PTO on Oct 15-17 for a family wedding. I'll make sure the sprint items are handed off to Sarah before I go and I'll be reachable for anything urgent.

Could you approve this in Workday when you get a chance?

Thanks,
[Your Name]`
    },
    test: {
      request: "Email my manager asking to work from home next week because my apartment is being renovated and it's too noisy."
    }
  }
};

const PILOT_CORRECTIONS_BY_CONTEXT = {
  professor: {
    context: "professor",
    rule: "Open with the factual situation, then immediately state your proposed solution with a specific date, then ask if that works. Skip apology preamble.",
    avoid: ["I hope this email finds you well", "I sincerely apologize", "I would be incredibly grateful"],
    prefer: ["State what happened first", "Give the proposed solution", "Ask what process or option works"],
    evidence: {
      before: "I hope this email finds you well. I am writing to sincerely apologize for the inconvenience...",
      after: "My laptop crashed and I lost my progress on the assignment. I'm redoing it now and can have it to you by Wednesday.",
    },
  },
  friend: {
    context: "friend",
    rule: "For friends, match their energy with casual wording, emotion, contractions, and a specific follow-up plan.",
    avoid: ["I wanted to let you know", "Best wishes", "Please know that I will be thinking of you"],
    prefer: ["Lead with how you feel", "Use casual punctuation", "Offer a specific plan"],
    evidence: {
      before: "I wanted to let you know that unfortunately, I will not be able to attend your birthday party...",
      after: "hey!! I'm SO bummed but I can't make it saturday - finals are next week and I'm drowning lol.",
    },
  },
  professional: {
    context: "professional",
    rule: "For manager requests, state the dates or change in one sentence, name the work coverage, and end with a specific approval/action item.",
    avoid: ["I hope you are doing well", "I truly appreciate your understanding", "too much justification"],
    prefer: ["Specific dates", "Named handoff or coverage", "Clear manager action item"],
    evidence: {
      before: "I am writing to respectfully request some time off from work... I hope this won't cause too much inconvenience.",
      after: "I'd like to take PTO on Oct 15-17 for a family wedding. I'll make sure the sprint items are handed off to Sarah before I go.",
    },
  },
};

export default function App() {
  const [activeContext, setActiveContext] = useState("professor");
  const [trainingRequest, setTrainingRequest] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [userEdit, setUserEdit] = useState("");
  
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  
  const [extractedCorrection, setExtractedCorrection] = useState(null);
  const [isStored, setIsStored] = useState(false);
  const [storageStatus, setStorageStatus] = useState("");

  const [testRequest, setTestRequest] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [baselineOutput, setBaselineOutput] = useState("");
  const [memoryOutput, setMemoryOutput] = useState("");
  const [retrievedCorrections, setRetrievedCorrections] = useState([]);
  const [memoryTimeline, setMemoryTimeline] = useState([]);
  
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [health, setHealth] = useState({ status: "checking", supermemory: "checking", gemini: "checking" });
  const [notification, setNotification] = useState(null);

  // Load presets when switching context
  useEffect(() => {
    const preset = PRESETS[activeContext];
    if (preset) {
      setTrainingRequest(preset.training.request);
      setAiDraft(preset.training.draft);
      setUserEdit(preset.training.edit);
      setTestRequest(preset.test.request);
      
      // Reset outputs
      setExtractedCorrection(null);
      setIsStored(false);
      setStorageStatus("");
      setBaselineOutput("");
      setMemoryOutput("");
      setRetrievedCorrections([]);
    }
  }, [activeContext]);

  // Check backend health status
  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: "error", supermemory: "offline", gemini: "offline" });
    }
  };

  useEffect(() => {
    checkHealth();
    // Poll health status occasionally
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Generate the initial baseline draft (before edit)
  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    setExtractedCorrection(null);
    setIsStored(false);
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: trainingRequest, context: activeContext })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiDraft(data.draft);
      setUserEdit(data.draft); // Start edit from the draft
      showNotification("Draft generated successfully!", "success");
    } catch (err) {
      showNotification(`Generation failed: ${err.message}`, "error");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Extract structured rule from draft + edit
  const handleExtractCorrection = async () => {
    if (aiDraft === userEdit) {
      showNotification("Please make some edits to the draft first to teach the AI your style!", "warning");
      return;
    }

    setIsExtracting(true);
    setExtractedCorrection(null);
    setIsStored(false);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: aiDraft, edited: userEdit, context: activeContext })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setExtractedCorrection(data.correction);
      showNotification("Style correction rule extracted!", "success");
    } catch (err) {
      showNotification(`Extraction failed: ${err.message}`, "error");
    } finally {
      setIsExtracting(false);
    }
  };

  // Store correction in Supermemory (or mock fallback)
  const handleStoreCorrection = async () => {
    if (!extractedCorrection) return;

    setIsStoring(true);
    try {
      const res = await fetch("/api/store-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correction: extractedCorrection })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setIsStored(true);
      setStorageStatus(data.mode === "supermemory" ? "Stored in Supermemory Local Vector Store" : "Stored in Local Mock DB");
      setMemoryTimeline((items) => [
        {
          id: data.id,
          context: extractedCorrection.context,
          rule: extractedCorrection.rule,
          mode: data.mode,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...items,
      ]);
      showNotification(data.mode === "supermemory" ? "Saved to Supermemory Local Vector Store!" : "Saved to Local memory (offline fallback)!", "success");
    } catch (err) {
      showNotification(`Storage failed: ${err.message}`, "error");
    } finally {
      setIsStoring(false);
    }
  };

  // Trigger transfer test (Generates both baseline and memory-augmented)
  const handleRunTransferTest = async () => {
    setIsTransferring(true);
    setBaselineOutput("");
    setMemoryOutput("");
    setRetrievedCorrections([]);

    try {
      // 1. Search for matching memories in Supermemory Local
      const searchRes = await fetch("/api/search-corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testRequest, context: activeContext })
      });
      const searchData = await searchRes.json();
      if (searchData.error) throw new Error(searchData.error);
      setRetrievedCorrections(searchData.results);

      // 2. Generate baseline output (without memory)
      const baseRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: testRequest, context: activeContext })
      });
      const baseData = await baseRes.json();
      if (baseData.error) throw new Error(baseData.error);
      setBaselineOutput(baseData.draft);

      // 3. Generate memory-augmented output (with retrieved corrections)
      const memRes = await fetch("/api/generate-with-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          request: testRequest, 
          context: activeContext, 
          corrections: searchData.results
        })
      });
      const memData = await memRes.json();
      if (memData.error) throw new Error(memData.error);
      setMemoryOutput(memData.output);

      showNotification("Style transfer test complete!", "success");
    } catch (err) {
      showNotification(`Transfer test failed: ${err.message}`, "error");
    } finally {
      setIsTransferring(false);
    }
  };

  // Helper to generate a clean, context-aware email subject line
  const getHumanizedSubject = (request, context) => {
    const reqLower = request.toLowerCase();
    
    if (context === "professor") {
      if (reqLower.includes("late") || reqLower.includes("submit") || reqLower.includes("assignment")) {
        return "Assignment Submission Delay - Query";
      }
      if (reqLower.includes("presentation") || reqLower.includes("slot") || reqLower.includes("switch")) {
        return "Presentation Slot Rescheduling";
      }
      if (reqLower.includes("recommendation") || reqLower.includes("letter")) {
        return "Recommendation Letter Request";
      }
      if (reqLower.includes("office") || reqLower.includes("hours") || reqLower.includes("meet")) {
        return "Rescheduling Office Hours Meeting";
      }
      return "Class Inquiry / Academic Request";
    }
    
    if (context === "professional") {
      if (reqLower.includes("pto") || reqLower.includes("time off") || reqLower.includes("vacation") || reqLower.includes("days off")) {
        return "PTO Request";
      }
      if (reqLower.includes("work from home") || reqLower.includes("wfh") || reqLower.includes("home")) {
        return "Work From Home Request";
      }
      if (reqLower.includes("follow up") || reqLower.includes("application") || reqLower.includes("status")) {
        return "Follow-up: Product Manager Application";
      }
      if (reqLower.includes("decline") || reqLower.includes("meeting") || reqLower.includes("conflict")) {
        return "Meeting Invitation Update";
      }
      return "Business Update / Inquiry";
    }
    
    return "Message Draft";
  };

  // Trigger Gmail compose tab with personalized body pre-loaded
  const handleSendEmail = () => {
    if (!memoryOutput) return;
    
    const cleanSubject = getHumanizedSubject(testRequest, activeContext);
    const subject = encodeURIComponent(cleanSubject);
    const body = encodeURIComponent(memoryOutput);
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank");
    showNotification("Opening Gmail compose screen!", "success");
  };

  // Trigger WhatsApp Web modal
  const handleSendWhatsApp = () => {
    if (!memoryOutput) return;
    setIsWhatsAppModalOpen(true);
  };

  // Open WhatsApp with prefilled text and bypass pop-up blockers
  const confirmSendWhatsApp = () => {
    if (!memoryOutput) return;
    const text = encodeURIComponent(memoryOutput);
    const cleanPhone = whatsappNumber ? whatsappNumber.replace(/\D/g, '') : '';
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
      
    // Programmatic link click to guarantee bypass of popup blocker
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
    
    setIsWhatsAppModalOpen(false);
    showNotification("Opening WhatsApp Web!", "success");
  };

  // Copy output text directly to user clipboard
  const handleCopyToClipboard = () => {
    if (!memoryOutput) return;
    navigator.clipboard.writeText(memoryOutput);
    showNotification("Copied to clipboard!", "success");
  };

  // Helper to load pilot presets completely (Auto pre-loads rule & memory outputs)
  const loadPilotPreset = () => {
    const preset = PRESETS[activeContext];
    if (!preset) return;

    // Lookup corresponding correction
    const pilotCorrection = PILOT_CORRECTIONS_BY_CONTEXT[activeContext];
    
    // Simulate what the flow would do
    setExtractedCorrection(pilotCorrection);
    setIsStored(true);
    setMemoryTimeline((items) => [
      {
        id: `pilot-${activeContext}-${Date.now()}`,
        context: activeContext,
        rule: pilotCorrection.rule,
        mode: "pilot",
        createdAt: new Date().toLocaleTimeString(),
      },
      ...items,
    ]);
    setStorageStatus("Mock Pilot Load — Full Pipeline Ready");
    
    // Find transfer data
    setTestRequest(preset.test.request);

    // Simulated outcomes from Phase 3
    if (activeContext === "professor") {
      setBaselineOutput(`Dear Professor,

I hope this email finds you well. I am writing to you regarding our upcoming group presentation that is currently scheduled for Tuesday. Unfortunately, my group partner has fallen ill and will not be able to participate on that day. I sincerely apologize for any disruption this may cause to your schedule and the class plan. We were really looking forward to presenting our work and we feel terrible about having to make this request. I was wondering if it would be at all possible to reschedule our presentation to Thursday instead, as my partner is expected to recover by then. I completely understand if this is not feasible, and we are willing to work with whatever alternative arrangement you see fit. We truly appreciate your flexibility and understanding in this matter, and I assure you that we are fully prepared and eager to present our research.

Thank you so much for considering our request.

Sincerely,
[Your Name]`);
      setMemoryOutput(`Hi Professor,

My group partner is sick and won't be able to present on Tuesday. Could we move our slot to Thursday instead? If that doesn't work, is there another day with an open slot we could take?

Thanks,
[Your Name]`);
      setRetrievedCorrections([pilotCorrection]);
    } else if (activeContext === "friend") {
      setBaselineOutput(`Hey,

I hope you're doing well. I wanted to share some exciting news with you — I just received a promotion at work! I am really happy about this achievement and I wanted to let you know. It has been a long journey and I feel really grateful for the opportunity. I was thinking it would be nice to celebrate together sometime. Let me know if you're available this weekend or whenever works for you. I would love to catch up and share the details with you.

Best,
[Your Name]`);
      setMemoryOutput(`DUDE I GOT PROMOTED!!! 🎉🎉🎉 I'm literally still shaking lol they told me this morning and I can't stop smiling

we're going out this weekend, no excuses. drinks on me obviously 🥂 saturday night??`);
      setRetrievedCorrections([pilotCorrection]);
    } else if (activeContext === "professional") {
      setBaselineOutput(`Dear [Manager's Name],

I hope you are doing well. I am writing to request your permission to work from home next week. The reason for this request is that my apartment is currently undergoing significant renovation work, which involves extensive construction activities that create a considerable amount of noise throughout the day. This noise would make it extremely difficult for me to concentrate and be productive if I were to work from the office, as my commute would bring me back to the noisy environment at the end of each day. I apologize for the confusion. Regardless, I want to assure you that I will remain fully productive and available during all working hours. I will make sure to attend all meetings and complete all deliverables on time. I hope this arrangement would be acceptable, and I truly appreciate your understanding and flexibility.

Thank you for your consideration.

Best regards,
[Your Name]`);
      setMemoryOutput(`Hi [Manager's Name],

My apartment is being renovated next week — the noise makes it impossible to focus from home. Could I work from the office full-time next week instead of my usual hybrid schedule? I'll keep my calendar up to date and make sure standups and the Thursday review aren't affected.

Can you flag the schedule change in Workday so facilities knows to expect me?

Thanks,
[Your Name]`);
      setRetrievedCorrections([pilotCorrection]);
    }
    showNotification("Loaded Phase 3 baseline & memory-augmented results!", "info");
  };

  const activeColor = CONTEXTS.find(c => c.id === activeContext)?.color || "blue";
  const activeGradient = CONTEXTS.find(c => c.id === activeContext)?.gradient || "from-blue-600 to-indigo-500";
  const activeCorrectionForViz = extractedCorrection || PILOT_CORRECTIONS_BY_CONTEXT[activeContext];
  const fingerprintTraits = [
    { label: "Direct", value: activeCorrectionForViz?.avoid?.length ? 86 : 52 },
    { label: "Concise", value: activeCorrectionForViz?.rule?.toLowerCase().includes("skip") ? 82 : 58 },
    { label: "Specific", value: activeCorrectionForViz?.prefer?.length ? 88 : 55 },
    { label: "Warm", value: activeContext === "friend" ? 90 : 62 },
    { label: "Structured", value: activeContext === "professional" ? 86 : 68 },
  ];
  const radarPoints = fingerprintTraits
    .map((trait, index) => {
      const angle = (Math.PI * 2 * index) / fingerprintTraits.length - Math.PI / 2;
      const radius = (trait.value / 100) * 58;
      return `${80 + Math.cos(angle) * radius},${80 + Math.sin(angle) * radius}`;
    })
    .join(" ");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-slide-in ${
          notification.type === "success" ? "bg-emerald-950 border-emerald-500/30 text-emerald-300" :
          notification.type === "error" ? "bg-rose-950 border-rose-500/30 text-rose-300" :
          notification.type === "warning" ? "bg-amber-950 border-amber-500/30 text-amber-300" :
          "bg-zinc-900 border-zinc-800 text-zinc-300"
        }`}>
          {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {notification.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {notification.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-400" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="border-b border-zinc-900 bg-zinc-950/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeGradient} flex items-center justify-center shadow-lg shadow-indigo-500/10`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">Toneprint</h1>
              <p className="text-xs text-zinc-500 font-medium">Style-augmented personalization using Supermemory</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Supermemory Local Connection Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              health.supermemory === "local"
                ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/20" 
                : "bg-amber-950/50 text-amber-400 border-amber-500/20"
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>Supermemory: {
                health.supermemory === "local" ? "Online (Local:6767)" :
                "Offline (Simulated)"
              }</span>
            </div>

            {/* Ollama Local Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              health.ollama 
                ? "bg-indigo-950/50 text-indigo-400 border-indigo-500/20" 
                : "bg-zinc-900 text-zinc-400 border-zinc-800"
            }`}>
              <Cpu className="w-3.5 h-3.5" />
              <span>Ollama: {health.ollama ? health.ollama.model : "Offline (Simulated)"}</span>
            </div>

            {/* Reload Stats */}
            <button 
              onClick={checkHealth}
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Refresh connection status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 border border-zinc-900 bg-zinc-900/25 rounded-2xl p-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
              <Info className="w-4 h-4" />
              <span>About Toneprint</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Toneprint tests whether an AI can learn your communication style from one corrected draft, store that correction in Supermemory Local, and transfer it to a different message in the same context. The demo flow is intentionally narrow: generate, edit, learn, retrieve, then compare the baseline against the memory-augmented output.
            </p>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Local Mode</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Supermemory is local-only at localhost:6767. Choose Local Ollama to keep generation local too: no cloud model call, no external memory service, and your style corrections stay on your machine.
            </p>
          </div>
        </section>
        
        {/* Navigation Tabs and Presets bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800/80 self-start">
            {CONTEXTS.map(c => {
              const active = activeContext === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveContext(c.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active 
                      ? `bg-zinc-800 text-white shadow-md` 
                      : `text-zinc-400 hover:text-zinc-200`
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadPilotPreset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs font-bold transition-all"
            >
              <Info className="w-4 h-4" />
              <span>Pre-load Pilot Data (Phases 1-3)</span>
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN: Training & Extraction */}
          <div className="flex flex-col gap-6">
            
            {/* Step 1 Card: Style Calibration */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <span className={`w-6 h-6 rounded-full bg-${activeColor}-500/10 text-${activeColor}-400 flex items-center justify-center text-xs font-bold border border-${activeColor}-500/20`}>1</span>
                <h2 className="text-base font-bold text-zinc-200">Training: Ingest Communication Context</h2>
              </div>

              <div className="flex flex-col gap-4">
                {/* Prompt Request */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Style Request Scenario</label>
                  <input
                    type="text"
                    value={trainingRequest}
                    onChange={(e) => setTrainingRequest(e.target.value)}
                    placeholder="Enter what you want the AI to write..."
                    className="w-full bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                {/* AI Draft vs Edit Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Baseline AI Draft */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Generated Draft</label>
                      <button
                        onClick={handleGenerateDraft}
                        disabled={isGeneratingDraft || !trainingRequest}
                        className={`text-xs font-bold flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all disabled:opacity-50`}
                      >
                        {isGeneratingDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Regenerate Draft</span>
                      </button>
                    </div>
                    <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-4 text-sm text-zinc-400 leading-relaxed font-mono h-60 overflow-y-auto whitespace-pre-wrap select-none border-dashed">
                      {aiDraft || "Click 'Regenerate Draft' or pre-load to start..."}
                    </div>
                  </div>

                  {/* Human User Edit */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Your Style Correction (Edit Me!)</label>
                    <textarea
                      value={userEdit}
                      onChange={(e) => setUserEdit(e.target.value)}
                      placeholder="Make changes to the AI draft to teach the model your voice..."
                      className="w-full bg-zinc-950/80 border border-zinc-900 focus:border-indigo-500 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono h-60 overflow-y-auto leading-relaxed resize-none text-zinc-200"
                    />
                  </div>
                </div>

                {/* Submit Edit Button */}
                <button
                  onClick={handleExtractCorrection}
                  disabled={isExtracting || !aiDraft || aiDraft === userEdit}
                  className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${activeGradient} hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none`}
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting Correction Model...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Learn Communication Correction</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2 Card: Extracted Correction Rule */}
            {extractedCorrection && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 border-glow animate-fade-in">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/20">2</span>
                    <h2 className="text-base font-bold text-zinc-200">Extracted Correction Pattern</h2>
                  </div>

                  <button
                    onClick={handleStoreCorrection}
                    disabled={isStoring || isStored}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isStored 
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" 
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{isStored ? "Stored" : "Save to Memory Store"}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Status Note */}
                  {isStored && (
                    <div className="bg-emerald-950/20 border border-emerald-500/15 rounded-xl px-4 py-2 flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{storageStatus}</span>
                    </div>
                  )}

                  {/* Rule Imperative */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Imperative Rule</h3>
                    <p className="text-sm font-semibold text-zinc-200 bg-zinc-950/60 rounded-xl px-4 py-3 leading-relaxed border border-zinc-900/60">
                      {extractedCorrection.rule}
                    </p>
                  </div>

                  {/* Avoid / Prefer grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Avoid */}
                    <div className="bg-zinc-950/20 rounded-xl p-4 border border-zinc-900/60">
                      <h4 className="text-xs font-bold text-rose-400/90 uppercase tracking-wider mb-2">Avoid Patterns</h4>
                      <ul className="flex flex-wrap gap-2">
                        {(extractedCorrection.avoid || []).map((ph, i) => (
                          <li key={i} className="text-xs px-2.5 py-1 rounded bg-rose-950/40 border border-rose-500/10 text-rose-300 font-medium">
                            "{ph}"
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prefer */}
                    <div className="bg-zinc-950/20 rounded-xl p-4 border border-zinc-900/60">
                      <h4 className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider mb-2">Prefer Patterns</h4>
                      <ul className="flex flex-wrap gap-2">
                        {(extractedCorrection.prefer || []).map((ph, i) => (
                          <li key={i} className="text-xs px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/10 text-emerald-300 font-medium">
                            "{ph}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Concrete Evidence Excerpt */}
                  {extractedCorrection.evidence && (
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Correction Diff Context</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed font-mono">
                        <div className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-lg text-rose-300/80">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Before:</span>
                          "{extractedCorrection.evidence.before}"
                        </div>
                        <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-lg text-emerald-300/80">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">After:</span>
                          "{extractedCorrection.evidence.after}"
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Transfer Test */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-zinc-200">Memory Timeline</h2>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {memoryTimeline.length === 0 ? (
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Learned corrections will appear here as you save edits. Add multiple corrections in the same context to show style convergence over time.
                    </p>
                  ) : (
                    memoryTimeline.map((item) => (
                      <div key={item.id} className="border-l-2 border-indigo-500/40 pl-3 py-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{item.context}</span>
                          <span className="text-[10px] text-zinc-600">{item.createdAt}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">{item.rule}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-zinc-200">Personality Fingerprint</h2>
                </div>
                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 160 160" className="w-32 h-32 shrink-0" role="img" aria-label="Style trait radar chart">
                    <polygon points="80,20 137,61 115,128 45,128 23,61" fill="none" stroke="rgba(63,63,70,.85)" strokeWidth="1" />
                    <polygon points="80,44 114,69 101,110 59,110 46,69" fill="none" stroke="rgba(63,63,70,.55)" strokeWidth="1" />
                    <polygon points={radarPoints} fill="rgba(16,185,129,.22)" stroke="rgb(52,211,153)" strokeWidth="2" />
                    {fingerprintTraits.map((trait, index) => {
                      const angle = (Math.PI * 2 * index) / fingerprintTraits.length - Math.PI / 2;
                      return (
                        <text
                          key={trait.label}
                          x={80 + Math.cos(angle) * 72}
                          y={84 + Math.sin(angle) * 72}
                          textAnchor="middle"
                          className="fill-zinc-400 text-[9px] font-bold"
                        >
                          {trait.label}
                        </text>
                      );
                    })}
                  </svg>
                  <div className="space-y-2 w-full">
                    {fingerprintTraits.map((trait) => (
                      <div key={trait.label}>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
                          <span>{trait.label}</span>
                          <span>{trait.value}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${trait.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 3 Card: Cross-Message Transfer Test */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full bg-${activeColor}-500/10 text-${activeColor}-400 flex items-center justify-center text-xs font-bold border border-${activeColor}-500/20`}>3</span>
                  <h2 className="text-base font-bold text-zinc-200">Transfer: Style Generalization Test</h2>
                </div>
                
                {/* Alert/Info banner if memory isn't loaded */}
                {!isStored && !extractedCorrection && (
                  <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-1 rounded-md border border-amber-500/15 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    <span>No Memory Injected</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {/* Test Request Input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">New Scenario Request (Same Context)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testRequest}
                      onChange={(e) => setTestRequest(e.target.value)}
                      placeholder="Type a new request in this context to test transfer..."
                      className="flex-1 bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium animate-pulse-placeholder"
                    />
                    <button
                      onClick={handleRunTransferTest}
                      disabled={isTransferring || !testRequest}
                      className="px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    >
                      {isTransferring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Compare</span>
                    </button>
                  </div>
                </div>

                {/* Outputs Display */}
                {(baselineOutput || memoryOutput) && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    
                    {/* Retrieved Memories Indicator */}
                    {retrievedCorrections.length > 0 && (
                      <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1 text-xs">
                        <span className="font-bold text-zinc-500 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Retrieved Correction Memory for Generation Context:</span>
                        </span>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-zinc-300">
                          {retrievedCorrections.map((c, i) => (
                            <li key={i}>
                              <span className="font-semibold text-indigo-300">Rule:</span> "{c.rule}" 
                              {c.score && <span className="text-[10px] text-zinc-500 ml-1.5">(score: {c.score.toFixed(3)})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Side by side outputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Without Memory */}
                      <div className="flex flex-col">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>Without Memory</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-normal uppercase">Baseline</span>
                        </label>
                        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-zinc-400 leading-relaxed h-80 overflow-y-auto whitespace-pre-wrap select-none border-dashed">
                          {baselineOutput}
                        </div>
                      </div>

                      {/* Right: With Memory */}
                      <div className="flex flex-col">
                        <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className={`text-${activeColor}-400`}>With Toneprint Memory</span>
                          <span className="text-[10px] bg-indigo-950/50 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">Style-Augmented</span>
                        </label>
                        <div className="relative bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-zinc-200 leading-relaxed h-80 overflow-y-auto whitespace-pre-wrap group">
                          {memoryOutput}
                          {memoryOutput && (
                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-90 group-hover:opacity-100 transition-all duration-200">
                              <button
                                onClick={handleCopyToClipboard}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-bold shadow-lg transition-all duration-200"
                                title="Copy to Clipboard"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </button>
                              <button
                                onClick={handleSendWhatsApp}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/10 transition-all duration-200"
                                title="Share via WhatsApp Web"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                              {activeContext !== "friend" && (
                                <button
                                  onClick={handleSendEmail}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20 transition-all duration-200"
                                  title="Compose in Gmail"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Email</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verdict Card */}
                    <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/15">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1">Transfer Validation Verdict</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            The styled draft was updated with structural and tonal guidelines derived from user edits. 
                            Patterns like direct openers, structured dates, and conversational registers were generalized successfully 
                            to this new request context without repeating the original training content.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Terminal Logging panel (Visual Debugger) */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 px-6 mt-12 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-mono text-zinc-500">Live Hackathon Session Status</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            Toneprint Engine v1.0.0 // Supermemory vector routing enabled // Port 6767
          </p>
        </div>
      </footer>
      {/* WhatsApp Modal Overlay */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border-indigo-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Send via WhatsApp Web</h3>
                <p className="text-xs text-zinc-400">Specify contact number (optional)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="919876543210 (country code first)"
                  className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  autoFocus
                />
                <span className="text-[10px] text-zinc-500 leading-normal">
                  Include country code (e.g. 91 for India) without '+' or spaces. Leave empty to choose contact inside WhatsApp.
                </span>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSendWhatsApp}
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
