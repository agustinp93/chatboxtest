"use client";
import { useChat } from "@/context/ChatContext";
import { MODES } from "@/constants/modes";
import Button from "@/components/ui/Button";

export default function PreferencesForm() {
  const {
    prefs,
    mode,
    handlePrefsChange,
    setMode,
    onboardingComplete,
    loading,
    setShowPrefs,
    send,
  } = useChat();

  const complete = () => {
    setShowPrefs(false);
    send("Greet the user", true);
  };

  return (
    <div className="p-4 space-y-4 text-sm text-black dark:text-white overflow-y-auto">
      <h2 className="font-semibold text-base">Let’s personalise your chat</h2>

      {(["name", "country", "continent", "destination"] as const).map((k) => (
        <input
          key={k}
          placeholder={
            k === "name"
              ? "Your name"
              : `Favourite ${k === "country" ? "country" : k}`
          }
          className="w-full border rounded p-2"
          value={prefs[k]}
          onChange={(e) => handlePrefsChange(k, e.target.value)}
          disabled={loading}
        />
      ))}

      <div className="pt-2">
        <p className="mb-1 font-medium">Choose your vibe:</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ key, label, icon: Icon, blurb }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              disabled={loading}
              title={blurb}
              className={`flex flex-col items-center gap-1 rounded-md border p-2 text-center transition ${
                mode === key
                  ? "ring-2 ring-[#A8D500] border-[#A8D500]"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={complete}
        disabled={!onboardingComplete || loading}
        fullWidth
      >
        Let&rsquo;s chat!
      </Button>
    </div>
  );
}
