"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Message, Prefs } from "@/types";
import { MODES, ModeKey } from "@/constants/modes";
import MessageList from "@/components/chat/MessageList";
import ChatHeader from "@/components/chat/ChatHeader";
import PreferencesForm from "@/components/chat/PreferencesForm";
import ChatInput from "@/components/chat/ChatInput";

const MAX_INPUT_LENGTH = 200;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<ModeKey | "">("funfact");
  const [showPrefs, setShowPrefs] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>({
    name: "Agustin",
    country: "England",
    continent: "Europe",
    destination: "London",
  });

  const onboardingComplete = useMemo(() => {
    return (
      (prefs.name &&
        prefs.country &&
        prefs.continent &&
        prefs.destination &&
        !!mode) ||
      false
    );
  }, [prefs, mode]);

  const modeLabel = useMemo(() => {
    return MODES.find((m) => m.key === mode)?.label || "";
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(messageOverride?: string, isSystemMessage = false) {
    const msg = messageOverride ?? input.trim();
    if (!msg || loading) return;

    const userMessage: Message = { role: "user", content: msg };
    if (!isSystemMessage) {
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-10),
          prefs,
          config: mode,
        }),
      });

      if (!res.ok || !res.body) throw new Error("API error");

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
    } catch (err) {
      console.error(err);
      if (!isSystemMessage) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  const lettersOnly = (s: string) =>
    s.replace(/[^A-Za-z.,\-\s\?\'\"0-9]/g, "").slice(0, MAX_INPUT_LENGTH);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(lettersOnly(e.target.value));
  };

  const handlePrefsChange = (key: keyof Prefs, value: string) => {
    setPrefs((prev) => ({ ...prev, [key]: lettersOnly(value) }));
  };

  const completeOnboarding = () => {
    setShowPrefs(false);
    send("Greet the user", true);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 ${
        isExpanded ? "w-[550px] h-[650px]" : "w-80 h-120"
      } max-h-[80vh] flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900 transition-all duration-300 overflow-hidden`}
    >
      <ChatHeader
        modeLabel={modeLabel}
        loading={loading}
        editing={showPrefs}
        onEditPrefs={() => setShowPrefs(true)}
        isExpanded={isExpanded}
        toggleExpanded={() => setIsExpanded((prev) => !prev)}
      />

      {showPrefs ? (
        <PreferencesForm
          prefs={prefs}
          mode={mode}
          onPrefsChange={handlePrefsChange}
          onModeChange={(m) => setMode(m as ModeKey)}
          onComplete={completeOnboarding}
          disabled={loading}
          ready={onboardingComplete}
        />
      ) : (
        <>
          <MessageList messages={messages} endRef={endRef} />
          <ChatInput
            input={input}
            disabled={loading}
            loading={loading}
            onInputChange={handleInputChange}
            onSubmit={() => send()}
          />
        </>
      )}
    </div>
  );
}
