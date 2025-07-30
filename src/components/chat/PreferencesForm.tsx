import { MODES } from "@/constants/modes";
import { Prefs } from "@/types";
import { ChangeEvent } from "react";
import Button from "../ui/Button";

interface PreferencesFormProps {
  prefs: Prefs;
  mode: string;
  onPrefsChange: (key: keyof Prefs, value: string) => void;
  onModeChange: (mode: string) => void;
  onComplete: () => void;
  disabled: boolean;
  ready: boolean;
}

export default function PreferencesForm({
  prefs,
  mode,
  onPrefsChange,
  onModeChange,
  onComplete,
  disabled,
  ready,
}: PreferencesFormProps) {
  const handleInput =
    (key: keyof Prefs) => (e: ChangeEvent<HTMLInputElement>) =>
      onPrefsChange(key, e.target.value);

  return (
    <div className="p-4 space-y-4 text-sm text-black dark:text-white">
      <h2 className="font-semibold text-base">
        Welcome! Let&rsquo;s personalise your chat
      </h2>

      <input
        placeholder="Your name"
        className="w-full border rounded p-2"
        value={prefs.name}
        onChange={handleInput("name")}
        disabled={disabled}
      />
      <input
        placeholder="Favourite country"
        className="w-full border rounded p-2"
        value={prefs.country}
        onChange={handleInput("country")}
        disabled={disabled}
      />
      <input
        placeholder="Favourite continent"
        className="w-full border rounded p-2"
        value={prefs.continent}
        onChange={handleInput("continent")}
        disabled={disabled}
      />
      <input
        placeholder="Favourite destination"
        className="w-full border rounded p-2"
        value={prefs.destination}
        onChange={handleInput("destination")}
        disabled={disabled}
        onKeyDown={(e) =>
          e.key === "Enter" && ready && !disabled && onComplete()
        }
      />

      <div className="pt-2">
        <p className="mb-1 font-medium">Choose your vibe:</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ key, label, icon: Icon, blurb }) => (
            <button
              key={key}
              type="button"
              onClick={() => onModeChange(key)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition ${
                mode === key
                  ? "ring-2 ring-[#A8D500] border-[#A8D500]"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              title={blurb}
            >
              <Icon size={20} className="stroke-2" />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <Button onClick={onComplete} disabled={!ready || disabled} fullWidth>
        Let&rsquo;s chat!
      </Button>
    </div>
  );
}
