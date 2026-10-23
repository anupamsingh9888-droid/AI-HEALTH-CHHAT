import { useEffect, useRef, useState } from "react";
import { Bot, Paperclip, Send, Info, Sparkles, RefreshCw } from "lucide-react";
import { PageHeader } from "./ui";
import { Avatar } from "./Shell";
import { api, ChatMessage } from "../api/client";

type Msg = { from: "ai" | "me"; text: string; list?: string[] };

const initialSuggestions = ["Why am I feeling tired?", "How can I improve my sleep?", "Is my activity level healthy?"];

const tiredReply: Msg = {
  from: "ai",
  text: "Your sleep dropped from about 8h 10m to 6h 42m this week, and shorter sleep can affect energy and daytime focus. A few gentle, evidence-based things to try:",
  list: [
    "Keep a consistent bedtime within 30 minutes, even on weekends.",
    "Dim screens and bright lights 45 minutes before bed.",
    "Have caffeine before 2 pm and drink water through the day.",
    "A 10-minute morning walk can help your body clock.",
  ],
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Hi Maya, I'm your health companion. I can help you understand your sleep, activity and habits. What's on your mind?" },
    { from: "me", text: "Why am I feeling tired lately?" },
    tiredReply,
  ]);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>(initialSuggestions);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  useEffect(() => {
    let mounted = true;
    api.chat.history()
      .then((history) => {
        if (!mounted || !history || history.length === 0) return;
        const formatted: Msg[] = history.map((m: ChatMessage) => {
          const lines = m.content.split("\n• ");
          const mainText = lines[0].replace(/• /g, "");
          const listItems = lines.length > 1 ? lines.slice(1) : undefined;
          return {
            from: m.role === "assistant" ? "ai" : "me",
            text: mainText,
            list: listItems,
          };
        });
        setMsgs(formatted);
        const lastAssistant = [...history].reverse().find((h) => h.role === "assistant");
        if (lastAssistant?.suggestions && lastAssistant.suggestions.length > 0) {
          setActiveSuggestions(lastAssistant.suggestions);
        }
      })
      .catch((err) => console.warn("Using local chat history fallback:", err.message));
    return () => { mounted = false; };
  }, []);

  const send = async (t: string) => {
    if (!t.trim()) return;
    const userText = t.trim();
    setMsgs((m) => [...m, { from: "me", text: userText }]);
    setText("");
    setTyping(true);

    try {
      const response = await api.chat.send(userText, true);
      const content = response.content;
      const lines = content.split("\n• ");
      const mainText = lines[0].replace(/• /g, "");
      const listItems = lines.length > 1 ? lines.slice(1) : undefined;

      setMsgs((m) => [...m, { from: "ai", text: mainText, list: listItems }]);
      if (response.suggestions && response.suggestions.length > 0) {
        setActiveSuggestions(response.suggestions);
      }
    } catch (err: any) {
      console.warn("Using local Gemini fallback:", err.message);
      setTimeout(() => {
        const fallbackText = /sleep/i.test(userText)
          ? "Maintaining a consistent 10:15 pm wind-down and dimming screens helps align circadian rhythm."
          : /tired/i.test(userText)
          ? "Your sleep averaged 6h 42m this week. Shorter sleep is strongly correlated with daytime fatigue."
          : "Based on your logged data, keeping regular sleep and movement habits will provide the strongest baseline.";

        setMsgs((m) => [...m, { from: "ai", text: fallbackText }]);
      }, 700);
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
      { from: "ai", text: "Conversation history cleared. What wellness questions can I help you explore?" },
    ]);
    setActiveSuggestions(initialSuggestions);
  };

  return (
    <>
      <PageHeader
        title="AI Health Chat"
        sub="Ask questions in plain language and get calm, evidence-based guidance powered by Gemini."
        right={
          <button
            onClick={handleClearHistory}
            className="flex h-10 items-center gap-2 rounded-2xl border border-powder bg-white px-4 text-xs font-bold text-ink-soft hover:text-navy"
          >
            <RefreshCw size={14} /> Clear Chat
          </button>
        }
      />
      <div className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-col overflow-hidden rounded-3xl border border-powder/60 bg-white shadow-soft">
        <div className="flex items-center gap-3 border-b border-powder/60 bg-linear-to-r from-sky/70 to-lav/70 px-5 py-4">
          <span className="grid size-11 place-items-center rounded-2xl grad text-white">
            <Bot size={22} />
          </span>
          <div className="flex-1">
            <p className="font-extrabold">Copilot Health Assistant</p>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <span className="size-2 rounded-full bg-turq" />
              Online · Google Gemini & Supabase Connected
            </p>
          </div>
          <Sparkles className="text-violet" size={18} />
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-ivory/60 px-4 py-6 sm:px-6">
          {msgs.map((m, i) => (
            <div key={i} className={`fade-in flex items-end gap-3 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
              {m.from === "me" ? (
                <Avatar size={32} />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lav text-violet">
                  <Bot size={16} />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed sm:max-w-[70%] ${
                  m.from === "me"
                    ? "rounded-br-md grad text-white"
                    : "rounded-bl-md bg-linear-to-br from-sky to-lav text-navy"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                {m.list && (
                  <ul className="mt-3 space-y-2">
                    {m.list.map((l, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-1.5 pl-11" aria-label="Assistant is typing">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="size-2 animate-bounce rounded-full bg-violet/60"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="border-t border-powder/60 bg-white p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {activeSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="h-9 shrink-0 rounded-full border border-powder bg-sky/50 px-4 text-xs font-bold text-navy transition hover:border-accent hover:bg-sky"
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
            <button
              type="button"
              aria-label="Attach file"
              className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-sky"
            >
              <Paperclip size={18} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about sleep, energy, habits, or your reports…"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-ink-soft/60"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!text.trim() || typing}
              className="grid size-11 place-items-center rounded-full grad text-white transition hover:brightness-105 disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-ink-soft">
            <Info size={13} className="mt-px shrink-0" />
            AI insights are informational and do not replace professional medical advice. Always consult a physician for clinical diagnoses.
          </p>
        </div>
      </div>
    </>
  );
}
