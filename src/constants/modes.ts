import { BookOpen, HelpCircle, Sparkles } from "lucide-react";

export const MODES = [
  {
    key: "story" as const,
    label: "Story‑telling",
    icon: BookOpen,
    blurb: "Narrative journeys through your favourite places.",
  },
  {
    key: "quiz" as const,
    label: "Mini Quiz",
    icon: HelpCircle,
    blurb: "Quick interactive trivia about your preferences.",
  },
  {
    key: "funfact" as const,
    label: "Fun Facts",
    icon: Sparkles,
    blurb: "Bite‑sized curiosities to brighten the chat.",
  },
];

export type ModeKey = (typeof MODES)[number]["key"];
