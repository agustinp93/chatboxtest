"use client";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useChat } from "@/context/ChatContext";

export default function ChatInput() {
  const { input, loading, handleInputChange, send } = useChat();

  return (
    <div className="p-3 flex gap-2 border-t bg-white dark:bg-gray-900">
      <input
        value={input}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === "Enter" && send()}
        className="w-[80%] rounded-md border px-2 py-1 text-sm bg-transparent outline-none"
        placeholder="Type a message"
        disabled={loading}
      />
      <div className="w-[20%] flex items-center justify-center">
        <Button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="w-full h-full flex items-center justify-center"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Send"}
        </Button>
      </div>
    </div>
  );
}
