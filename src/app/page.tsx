"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Pencil } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Prefs = { country: string; continent: string; destination: string };

const MAX_INPUT_LENGTH = 200;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const [showPrefs, setShowPrefs] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>({
    country: "",
    continent: "",
    destination: "",
  });

  const prefsComplete = useMemo(
    () => prefs.country && prefs.continent && prefs.destination,
    [prefs]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10),
          prefs,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

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
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= MAX_INPUT_LENGTH) {
      setInput(lettersOnly(e.target.value));
    }
  };

  const lettersOnly = (s: string) => s.replace(/[^A-Za-z.,-\s\?\'\"0-9]/g, "");

  const handlePrefsChange =
    (key: keyof Prefs) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPrefs((p) => ({ ...p, [key]: lettersOnly(e.target.value) }));

  if (showPrefs || !prefsComplete) {
    return (
      <div className="fixed bottom-6 right-6 w-80 rounded-lg shadow-lg border bg-white dark:bg-gray-900 p-4 space-y-3 text-sm">
        <h2 className="font-medium">Tell us a bit about you</h2>

        <input
          placeholder="Favourite country"
          className="w-full border rounded p-2"
          value={prefs.country}
          onChange={handlePrefsChange("country")}
        />
        <input
          placeholder="Favourite continent"
          className="w-full border rounded p-2"
          value={prefs.continent}
          onChange={handlePrefsChange("continent")}
        />
        <input
          placeholder="Favourite destination"
          className="w-full border rounded p-2"
          value={prefs.destination}
          onChange={handlePrefsChange("destination")}
          onKeyDown={(e) => e.key === "Enter" && setShowPrefs(false)}
        />

        <button
          disabled={!prefsComplete}
          className="w-full py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={() => setShowPrefs(false)}
        >
          Start chatting
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Geo-Chat</span>
        <button
          onClick={() => setShowPrefs(true)}
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
            className={`max-w-[75%] break-words ${
              i % 2 === 0
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50"
            } rounded-md px-3 py-1`}
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
        />
        <button
          onClick={send}
          className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
