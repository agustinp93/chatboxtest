"use client";
import { useChat } from "@/context/ChatContext";
import ChatHeader from "@/components/chat/ChatHeader";
import PreferencesForm from "@/components/chat/PreferencesForm";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";

export default function Home() {
  const { showPrefs, isExpanded } = useChat();

  return (
    <div
      className={`fixed bottom-6 right-6 ${
        isExpanded ? "w-[550px] h-[650px]" : "w-80 h-[500px]"
      } max-h-[80vh] flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900 transition-all duration-300 overflow-hidden`}
    >
      <ChatHeader />

      {showPrefs ? (
        <PreferencesForm />
      ) : (
        <>
          <MessageList />
          <ChatInput />
        </>
      )}
    </div>
  );
}
