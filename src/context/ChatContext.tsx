"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
  ChangeEvent,
} from "react";
import { Message, Prefs } from "@/types";
import { ModeKey, MODES } from "@/constants/modes";

const MAX_INPUT_LENGTH = 200;

type ChatContextShape = {
  messages: Message[];
  input: string;
  loading: boolean;
  isExpanded: boolean;
  showPrefs: boolean;
  prefs: Prefs;
  mode: ModeKey | "";
  endRef: React.RefObject<HTMLDivElement | null>;

  onboardingComplete: boolean;
  modeLabel: string;

  setInput: (v: string) => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setMode: (m: ModeKey) => void;
  setShowPrefs: (v: boolean) => void;
  handlePrefsChange: (k: keyof Prefs, v: string) => void;
  toggleExpanded: () => void;
  send: (override?: string, system?: boolean) => Promise<void>;
};

const ChatContext = createContext<ChatContextShape | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [showPrefs, setShowPrefs] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>({
    name: "Agustin",
    country: "England",
    continent: "Europe",
    destination: "London",
  });
  const [mode, setMode] = useState<ModeKey | "">("funfact");

  const endRef = useRef<HTMLDivElement>(null);

  const modeLabel = useMemo(() => {
    return MODES.find((m) => m.key === mode)?.label || "";
  }, [mode]);

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

  const lettersOnly = (s: string) =>
    s.replace(/[^A-Za-z.,\-\s\?\'\"0-9]/g, "").slice(0, MAX_INPUT_LENGTH);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    setInput(lettersOnly(e.target.value));

  const handlePrefsChange = (key: keyof Prefs, v: string) =>
    setPrefs((p) => ({ ...p, [key]: lettersOnly(v) }));

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(messageOverride?: string, isSystemMessage = false) {
    const msg = messageOverride ?? input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    if (!isSystemMessage) {
      setMessages((prev) => [...prev, userMsg]);
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
      let acc = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value);

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const value: ChatContextShape = {
    messages,
    input,
    loading,
    isExpanded,
    showPrefs,
    prefs,
    mode,
    endRef,
    onboardingComplete,
    modeLabel,
    setInput,
    handleInputChange,
    setMode,
    setShowPrefs,
    handlePrefsChange,
    toggleExpanded,
    send,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be inside <ChatProvider>");
  return ctx;
}
