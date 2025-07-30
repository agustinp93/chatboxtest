import { Pencil, Maximize2, Minimize2 } from "lucide-react";

interface ChatHeaderProps {
  modeLabel: string;
  loading: boolean;
  editing: boolean;
  onEditPrefs: () => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  modeLabel,
  loading,
  onEditPrefs,
  editing,
  isExpanded,
  toggleExpanded,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b bg-[#1A2E25] text-white">
      <span className="text-sm font-medium">
        Geo‑Chat <span className="opacity-60">• {modeLabel}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleExpanded}
          className="p-1 rounded hover:bg-[#2E4A3B]"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        {!editing && (
          <button
            onClick={onEditPrefs}
            disabled={loading}
            className="p-1 rounded hover:bg-[#2E4A3B]"
            title="Edit preferences"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
