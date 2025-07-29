"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, Pencil, BookOpen, HelpCircle, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

type Prefs = {
  name: string;
  country: string;
  continent: string;
  destination: string;
};

const MODES = [
  {
    key: "story" as const,
    label: "Story‑telling",
    icon: BookOpen,
    blurb: "Narrative journeys through your favourite places.",
  },
  {
    key: "quiz" as const,
    label: "Mini Quiz",
    icon: HelpCircle,
    blurb: "Quick interactive trivia about your preferences.",
  },
  {
    key: "funfact" as const,
    label: "Fun Facts",
    icon: Sparkles,
    blurb: "Bite‑sized curiosities to brighten the chat.",
  },
];

type ModeKey = (typeof MODES)[number]["key"];

const MAX_INPUT_LENGTH = 200;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const [showPrefs, setShowPrefs] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>({
    name: "",
    country: "",
    continent: "",
    destination: "",
  });
  const [mode, setMode] = useState<ModeKey | "">("");

  const onboardingComplete = useMemo(() => {
    return (
      prefs.name &&
      prefs.country &&
      prefs.continent &&
      prefs.destination &&
      !!mode
    );
  }, [prefs, mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10),
          prefs,
          config: mode,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiAssistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        aiAssistant += decoder.decode(value);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: aiAssistant };
          return copy;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const lettersOnly = (s: string) =>
    s.replace(/[^A-Za-z.,\-\s\?\'\"0-9]/g, "").slice(0, MAX_INPUT_LENGTH);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(lettersOnly(e.target.value));
  };

  const handlePrefsChange =
    (key: keyof Prefs) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPrefs((p) => ({ ...p, [key]: lettersOnly(e.target.value) }));

  /* ------------------------------------------------------------------
   * Render onboarding overlay
   * ----------------------------------------------------------------*/
  if (showPrefs || !onboardingComplete) {
    return (
      <div className="fixed bottom-6 right-6 w-80 rounded-xl shadow-lg border bg-white dark:bg-gray-900 p-4 space-y-4 text-sm">
        <h2 className="font-semibold text-base">
          Welcome! Let&rsquo;s personalise your chat
        </h2>

        <input
          placeholder="Your name"
          className="w-full border rounded p-2"
          value={prefs.name}
          onChange={handlePrefsChange("name")}
          disabled={loading}
        />
        <input
          placeholder="Favourite country"
          className="w-full border rounded p-2"
          value={prefs.country}
          onChange={handlePrefsChange("country")}
          disabled={loading}
        />
        <input
          placeholder="Favourite continent"
          className="w-full border rounded p-2"
          value={prefs.continent}
          onChange={handlePrefsChange("continent")}
          disabled={loading}
        />
        <input
          placeholder="Favourite destination"
          className="w-full border rounded p-2"
          value={prefs.destination}
          onChange={handlePrefsChange("destination")}
          disabled={loading}
          onKeyDown={(e) =>
            e.key === "Enter" && onboardingComplete && setShowPrefs(false)
          }
        />

        {/* Creative mode picker */}
        <div className="pt-2">
          <p className="mb-1 font-medium">Choose your vibe:</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ key, label, icon: Icon, blurb }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  mode === key
                    ? "ring-2 ring-blue-500 border-blue-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                title={blurb}
              >
                <Icon size={20} className="stroke-2" />
                <span className="text-xs font-medium leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!onboardingComplete || loading}
          className="w-full py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={() => !loading && setShowPrefs(false)}
        >
          Let&rsquo;s chat!
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">
          Geo‑Chat{" "}
          <span className="opacity-60">
            • {MODES.find((m) => m.key === mode)?.label}
          </span>
        </span>
        <button
          onClick={() => setShowPrefs(true)}
          disabled={loading}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Edit preferences"
        >
          <Pencil size={16} className="stroke-2" />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] break-words rounded-md px-3 py-1 ${
              m.role === "user"
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-md border px-2 py-1 text-sm bg-transparent outline-none"
          placeholder="Type a message"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? "" : "Send"}</span>
        </button>
      </div>
    </div>
  );
}
