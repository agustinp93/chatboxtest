"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const user = input.trim();
    setMessages((prev) => [...prev, user]);
    setInput("");

    const res = await fetch("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: user }),
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let ai = "";
    setMessages((prev) => [...prev, ""]);
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      ai += decoder.decode(value);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = ai;
        return copy;
      });
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
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
            {m}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
