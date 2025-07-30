import { Loader2 } from "lucide-react";
import Button from "../ui/Button";

interface ChatInputProps {
  input: string;
  disabled: boolean;
  loading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  disabled,
  loading,
  onInputChange,
  onSubmit,
}) => {
  return (
    <div className="p-3 flex gap-2 border-t bg-white dark:bg-gray-900">
      <input
        value={input}
        onChange={onInputChange}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        className="w-[80%] rounded-md border px-2 py-1 text-sm bg-transparent outline-none"
        placeholder="Type a message"
        disabled={disabled}
      />
      <div className="w-[20%] flex items-center justify-center">
        <Button
          onClick={onSubmit}
          disabled={disabled || !input.trim()}
          className="w-full h-full flex items-center justify-center"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
