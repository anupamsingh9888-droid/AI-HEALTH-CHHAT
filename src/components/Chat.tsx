import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Paperclip,
  Send,
  Info,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Activity,
  Moon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "./ui";
import { Avatar } from "./Shell";
import { api, ChatMessage } from "../api/client";

interface FormattedMsg {
  id: string;
  from: "ai" | "me";
  text: string;
  model?: string;
  error?: boolean;
}

const defaultSuggestions = [
  "Is my activity level healthy?",
  "How can I improve my sleep?",
  "Is 6.5 hours enough sleep?",
  "What is a good evening wind-down routine?",
  "What are some good exercises for beginners?",
];

export default function Chat() {
  const [msgs, setMsgs] = useState<FormattedMsg[]>([]);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>(defaultSuggestions);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [showHealthContext, setShowHealthContext] = useState(false);
  const [metrics, setMetrics] = useState({
    sleep_avg_hours: 6.7,
    sleep_goal_hours: 8.0,
    daily_steps: 8420,
    steps_goal: 10000,
    active_minutes_week: 195,
    strength_days_week: 2,
    water_liters_day: 2.1,
    weight_kg: 62.4,
  });
  const [metricsSaved, setMetricsSaved] = useState(false);

  const end = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  // Load chat history & metrics on mount
  useEffect(() => {
    let mounted = true;

    // Load metrics
    api.health.getMetrics()
      .then((m) => {
        if (mounted && m) setMetrics(m);
      })
      .catch(() => {});

    // Load chat history
    api.chat.history()
      .then((history) => {
        if (!mounted) return;
        if (history && history.length > 0) {
          const formatted: FormattedMsg[] = history.map((m: ChatMessage) => ({
            id: m.id,
            from: m.role === "assistant" ? "ai" : "me",
            text: m.content,
          }));
          setMsgs(formatted);
          const lastAi = [...history].reverse().find((h) => h.role === "assistant");
          if (lastAi?.suggestions && lastAi.suggestions.length > 0) {
            setActiveSuggestions(lastAi.suggestions);
          }
        } else {
          // Clean initial greeting from Maya
          setMsgs([
            {
              id: "init-welcome",
              from: "ai",
              text: "Hello! I'm Maya, your personal AI Health Companion powered by Gemini. I can help assess your sleep duration, evening wind-down routines, activity levels, beginner exercises, and nutrition using your available health data.\n\nWhat question is on your mind today?",
            },
          ]);
        }
      })
      .catch((err) => {
        console.warn("Notice loading history:", err.message);
        if (mounted) {
          setMsgs([
            {
              id: "init-welcome-local",
              from: "ai",
              text: "Hello! I'm Maya, your personal AI Health Companion powered by Gemini. How can I support your health and wellness goals today?",
            },
          ]);
        }
      });

    return () => {
      mounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const send = async (userQuestion: string) => {
    if (!userQuestion.trim() || typing) return;
    const cleanQuestion = userQuestion.trim();
    const tempUserMsgId = `user-${Date.now()}`;

    // Append user message immediately
    setMsgs((prev) => [
      ...prev,
      {
        id: tempUserMsgId,
        from: "me",
        text: cleanQuestion,
      },
    ]);
    setText("");
    setTyping(true);

    try {
      // Send directly to backend Gemini endpoint
      const response = await api.chat.send(cleanQuestion, true);

      // Render actual Gemini response text
      setMsgs((prev) => [
        ...prev,
        {
          id: response.id || `ai-${Date.now()}`,
          from: "ai",
          text: response.content,
          model: (response as any).model || "Gemini",
        },
      ]);

      if (response.suggestions && response.suggestions.length > 0) {
        setActiveSuggestions(response.suggestions);
      }
    } catch (err: any) {
      console.error("[Chat UI] Generation failed:", err.message);
      // Explicit error card — never substitute generic wellness advice
      setMsgs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          from: "ai",
          text: `Maya encountered a connection error with Gemini: ${err.message || "Request timed out"}. Please check your connection and tap retry.`,
          error: true,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.chat.clear();
    } catch {
      // Ignore
    }
    setMsgs([
      {
        id: `welcome-${Date.now()}`,
        from: "ai",
        text: "Conversation cleared. What would you like to ask or explore?",
      },
    ]);
    setActiveSuggestions(defaultSuggestions);
  };

  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const toggleSpeech = async (msgId: string, speechText: string) => {
    if (playingId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setAudioLoadingId(msgId);

    try {
      // Request audio via Gemini TTS endpoint
      const ttsData = await api.chat.tts(speechText);
      if (ttsData.audio_base64) {
        const audioSrc = `data:${ttsData.mime_type || "audio/wav"};base64,${ttsData.audio_base64}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => {
          fallbackBrowserSpeech(speechText, msgId);
        };
        await audio.play();
        setPlayingId(msgId);
      } else {
        fallbackBrowserSpeech(speechText, msgId);
      }
    } catch (err: any) {
      console.warn("Gemini TTS fallback to browser SpeechSynthesis:", err.message);
      fallbackBrowserSpeech(speechText, msgId);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const fallbackBrowserSpeech = (speechText: string, msgId: string) => {
    if (!("speechSynthesis" in window)) {
      setPlayingId(null);
      return;
    }
    const clean = speechText.replace(/[*#_`•]/g, " ").slice(0, 350);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingId(msgId);
  };

  const saveMetrics = async () => {
    try {
      await api.health.updateMetrics(metrics);
      setMetricsSaved(true);
      setTimeout(() => setMetricsSaved(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Render markdown text cleanly (paragraphs, bold, and list items)
  const renderMessageContent = (content: string) => {
    const paragraphs = content.split(/\n\s*\n/);
    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n");
      const isList = lines.every((line) => /^\s*([*•\-]|\d+\.)\s+/.test(line));

      if (isList) {
        return (
          <ul key={pIdx} className="my-2 space-y-1.5 pl-1">
            {lines.map((line, lIdx) => {
              const cleanItem = line.replace(/^\s*([*•\-]|\d+\.)\s+/, "");
              return (
                <li key={lIdx} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet" />
                  <span>{renderFormattedInline(cleanItem)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p key={pIdx} className={pIdx > 0 ? "mt-2.5" : ""}>
          {lines.map((l, lIdx) => (
            <React.Fragment key={lIdx}>
              {renderFormattedInline(l)}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-bold text-navy">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      <PageHeader
        title="Maya — AI Health Companion"
        sub="Contextual, evidence-based wellness guidance powered by Gemini."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHealthContext((v) => !v)}
              className="flex h-10 items-center gap-2 rounded-2xl border border-powder bg-white px-3.5 text-xs font-bold text-ink-soft hover:text-navy"
            >
              <Activity size={14} className="text-turq" />
              <span>Personal Context</span>
              {showHealthContext ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={handleClearHistory}
              className="flex h-10 items-center gap-2 rounded-2xl border border-powder bg-white px-3.5 text-xs font-bold text-ink-soft hover:text-navy"
              title="Clear conversation history"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        }
      />

      {/* Expandable Health Context Drawer */}
      {showHealthContext && (
        <div className="mb-4 rounded-3xl border border-powder/70 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-powder/50 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-turq" />
              <h3 className="text-sm font-bold text-navy">Maya's Active Grounded Health Data</h3>
            </div>
            <div className="flex items-center gap-2">
              {metricsSaved && <span className="text-xs font-bold text-turq">Saved to context!</span>}
              <button
                onClick={saveMetrics}
                className="rounded-xl bg-sky px-3 py-1 text-xs font-bold text-navy hover:bg-powder transition"
              >
                Sync Metrics
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-powder/50 bg-ivory/60 p-3">
              <span className="text-[11px] font-semibold text-ink-soft">Average Sleep</span>
              <div className="mt-1 flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={metrics.sleep_avg_hours}
                  onChange={(e) => setMetrics({ ...metrics, sleep_avg_hours: parseFloat(e.target.value) || 0 })}
                  className="w-16 rounded border border-powder/80 bg-white px-1.5 py-0.5 text-sm font-bold tabular-nums text-navy"
                />
                <span className="text-xs text-ink-soft">hrs (6h 42m)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-powder/50 bg-ivory/60 p-3">
              <span className="text-[11px] font-semibold text-ink-soft">Sleep Goal</span>
              <div className="mt-1 flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={metrics.sleep_goal_hours}
                  onChange={(e) => setMetrics({ ...metrics, sleep_goal_hours: parseFloat(e.target.value) || 0 })}
                  className="w-16 rounded border border-powder/80 bg-white px-1.5 py-0.5 text-sm font-bold tabular-nums text-navy"
                />
                <span className="text-xs text-ink-soft">hours</span>
              </div>
            </div>

            <div className="rounded-2xl border border-powder/50 bg-ivory/60 p-3">
              <span className="text-[11px] font-semibold text-ink-soft">Daily Steps</span>
              <div className="mt-1 flex items-baseline gap-1">
                <input
                  type="number"
                  step="100"
                  value={metrics.daily_steps}
                  onChange={(e) => setMetrics({ ...metrics, daily_steps: parseInt(e.target.value) || 0 })}
                  className="w-20 rounded border border-powder/80 bg-white px-1.5 py-0.5 text-sm font-bold tabular-nums text-navy"
                />
                <span className="text-xs text-ink-soft">steps</span>
              </div>
            </div>

            <div className="rounded-2xl border border-powder/50 bg-ivory/60 p-3">
              <span className="text-[11px] font-semibold text-ink-soft">Active Minutes</span>
              <div className="mt-1 flex items-baseline gap-1">
                <input
                  type="number"
                  value={metrics.active_minutes_week}
                  onChange={(e) => setMetrics({ ...metrics, active_minutes_week: parseInt(e.target.value) || 0 })}
                  className="w-16 rounded border border-powder/80 bg-white px-1.5 py-0.5 text-sm font-bold tabular-nums text-navy"
                />
                <span className="text-xs text-ink-soft">min/wk</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-soft">
            Maya references these ground-truth metrics when evaluating questions about your activity, sleep sufficiency, and recovery.
          </p>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-col overflow-hidden rounded-3xl border border-powder/60 bg-white shadow-soft">
        {/* Status Bar */}
        <div className="flex items-center justify-between border-b border-powder/60 bg-linear-to-r from-sky/70 to-lav/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl grad text-white shadow-sm">
              <Bot size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-navy">Maya</p>
                <span className="text-[11px] font-bold text-violet">AI Health Companion</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <span className="size-2 rounded-full bg-turq" />
                Active · Powered by Google Gemini
              </p>
            </div>
          </div>
          <Sparkles className="text-violet" size={18} />
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-ivory/50 px-4 py-6 sm:px-6">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`fade-in flex items-start gap-3 ${m.from === "me" ? "flex-row-reverse" : ""}`}
            >
              {m.from === "me" ? (
                <Avatar size={32} />
              ) : (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-lav text-violet shadow-xs">
                  <Bot size={16} />
                </span>
              )}

              <div className={`group flex flex-col ${m.from === "me" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`rounded-3xl px-5 py-4 text-sm leading-relaxed ${
                    m.from === "me"
                      ? "rounded-tr-md grad text-white shadow-sm"
                      : m.error
                      ? "rounded-tl-md border border-red-200 bg-red-50 text-red-900"
                      : "rounded-tl-md border border-powder/60 bg-white text-navy shadow-xs"
                  }`}
                >
                  {m.error ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                      <div>
                        <p className="font-semibold">{m.text}</p>
                        <button
                          onClick={() => {
                            const lastUser = [...msgs].reverse().find((msg) => msg.from === "me");
                            if (lastUser) send(lastUser.text);
                          }}
                          className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-800 hover:bg-red-200"
                        >
                          <RotateCcw size={12} /> Retry Question
                        </button>
                      </div>
                    </div>
                  ) : (
                    renderMessageContent(m.text)
                  )}
                </div>

                {/* Assistant controls: Voice play & copy */}
                {m.from === "ai" && !m.error && (
                  <div className="mt-1 flex items-center gap-2 pl-2 text-[11px] text-ink-soft">
                    {m.model && (
                      <span className="text-[10px] font-bold text-violet/75">
                        {m.model}
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <button
                      onClick={() => toggleSpeech(m.id, m.text)}
                      disabled={audioLoadingId === m.id}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-sky/60 hover:text-navy transition"
                      title={playingId === m.id ? "Stop reading" : "Read aloud with voice"}
                    >
                      {audioLoadingId === m.id ? (
                        <span className="animate-spin text-violet">●</span>
                      ) : playingId === m.id ? (
                        <>
                          <VolumeX size={13} className="text-violet" />
                          <span className="font-semibold text-violet">Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      onClick={() => copyToClipboard(m.id, m.text)}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-sky/60 hover:text-navy transition"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={12} className="text-turq" />
                          <span className="text-turq font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-center gap-2 pl-11 text-xs font-semibold text-ink-soft" aria-label="Maya is typing">
              <span className="grid size-5 place-items-center rounded-full bg-lav/60 text-violet">
                <Bot size={12} />
              </span>
              <span>Maya is thinking...</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-violet"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={end} />
        </div>

        {/* Input Bar & Suggestion Chips */}
        <div className="border-t border-powder/60 bg-white p-4">
          {/* Quick Intent Chips */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {activeSuggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={typing}
                onClick={() => send(s)}
                className="h-8 shrink-0 rounded-full border border-powder bg-sky/40 px-3.5 text-xs font-bold text-navy transition hover:border-accent hover:bg-sky disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-center gap-2 rounded-full border border-powder bg-ivory p-1.5 pl-3 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15"
          >
            <input
              value={text}
              disabled={typing}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about sleep, activity, evening routines, nutrition, or your data…"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-ink-soft/60 disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!text.trim() || typing}
              className="grid size-11 place-items-center rounded-full grad text-white transition hover:brightness-105 disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>

          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-snug text-ink-soft">
            <Info size={13} className="mt-px shrink-0 text-turq" />
            Maya provides personalized, evidence-informed guidance. Always consult a licensed clinician for medical diagnoses or emergency symptoms.
          </p>
        </div>
      </div>
    </>
  );
}
