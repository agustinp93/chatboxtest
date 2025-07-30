import React, { RefObject } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface MessageListProps {
  messages: Message[];
  endRef: RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, endRef }) => {
  return (
    <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm bg-[#1A2E25]">
      {messages.map((m, i) => {
        const isUser = m.role === "user";
        return (
          <div
            key={i}
            className={`max-w-[75%] break-words rounded-md px-4 py-2 ${
              isUser
                ? "ml-auto text-black bg-[#D3D3D3]"
                : "mr-auto text-white bg-[#2E4A3B]"
            }`}
            style={{
              alignSelf: isUser ? "flex-end" : "flex-start",
              border: isUser ? "1px solid #D3D3D3" : "1px solid #A8D500",
            }}
          >
            {m.content}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
