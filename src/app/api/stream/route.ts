export const runtime = "edge";
import OpenAI from "openai";

if (!process.env.OPENAI_KEY || !process.env.OPENAI_MODEL) {
  throw new Error("Missing OPENAI_KEY or OPENAI_MODEL env vars");
}

const MAX_MESSAGE_LENGTH = 1000;

type ChatMode = "story" | "quiz" | "funfact";

interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

interface UserPrefs {
  name?: string;
  country?: string;
  continent?: string;
  destination?: string;
}

interface RequestBody {
  message: string;
  history: ChatHistory[];
  prefs: UserPrefs;
  config?: ChatMode; // "story" | "quiz" | "funfact"
}

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const basePersona = `You are **GeoGuide**, an AI assistant chat-bot that ONLY discusses world-geography.`;

const baseOutputRules = ` - Output rules
        1. Reply in plain text - no Markdown, HTML or code-blocks.
        2. Be concise; avoid answers that force the user to scroll.
        3. Maintain a neutral, polite and friendly tone. Never insult or use rude language.
        4. If asked about topics unrelated to geography, respond with: "I'm sorry, I can only discuss geography-related topics."

        If you receive a message that says "Greet the user", please use it a the conversation starter and start as if the conversation is new.
        
        Max length response: ${MAX_MESSAGE_LENGTH} characters.`;

function formatPrefs(prefs: UserPrefs): string {
  return `- User preferences  
    • Name: ${prefs.name || "-"}  
    • Favourite country: ${prefs.country || "-"}  
    • Favourite continent: ${prefs.continent || "-"}  
    • Favourite destination: ${prefs.destination || "-"}`;
}

function storyPrompt(prefs: UserPrefs) {
  return `${basePersona}

      Your role now is a lively *story-teller*. Weave short, vivid narratives (≈ 5 sentences) that transport the user to their favourite places while remaining factual. 
      Always ground stories in real geography. End each answer with an open question to keep the conversation flowing.${formatPrefs(
        prefs
      )}

      ${baseOutputRules}`;
}

function quizPrompt(prefs: UserPrefs) {
  return `${basePersona}

      Your role now is an *interactive quiz master*. Ask the user one multiple-choice question at a time about world geography, prioritising their preferred places. Wait for the user's reply before revealing the answer and moving to the next question. Keep each question + options within two sentences.${formatPrefs(
        prefs
      )}

      ${baseOutputRules}`;
}

function funFactPrompt(prefs: UserPrefs) {
  return `${basePersona}

      Your role now is to share one *fun geography fact* per message, preferably related to the user's favourite places. Keep it to 2-3 sentences and conclude with a playful prompt encouraging further chat.${formatPrefs(
        prefs
      )}
      
      ${baseOutputRules}`;
}

function defaultPrompt(prefs: UserPrefs) {
  return `${basePersona}

        ${baseOutputRules}

        ${formatPrefs(prefs)}\n\n      `;
}

function buildSystemPrompt(mode: ChatMode | undefined, prefs: UserPrefs) {
  switch (mode) {
    case "story":
      return storyPrompt(prefs);
    case "quiz":
      return quizPrompt(prefs);
    case "funfact":
      return funFactPrompt(prefs);
    default:
      return defaultPrompt(prefs);
  }
}

function isValidRequest(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const { message, history, prefs, config } = body as RequestBody;

  // Message
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return false;
  }

  // History
  if (
    !Array.isArray(history) ||
    history.some(
      (item) =>
        typeof item !== "object" ||
        !["user", "assistant", "system"].includes(item.role) ||
        typeof item.content !== "string" ||
        item.content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return false;
  }

  if (!prefs || typeof prefs !== "object") return false;

  const { name, country, continent, destination } = prefs;
  if (
    (name !== undefined && typeof name !== "string") ||
    (country !== undefined && typeof country !== "string") ||
    (continent !== undefined && typeof continent !== "string") ||
    (destination !== undefined && typeof destination !== "string")
  ) {
    return false;
  }

  const allowedModes = ["story", "quiz", "funfact"] as const;
  if (config !== undefined && !allowedModes.includes(config as ChatMode)) {
    return false;
  }

  return true;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!isValidRequest(body)) {
    return new Response("Invalid request body", { status: 400 });
  }

  const { message, history, prefs, config } = body as RequestBody;

  const recentHistory = history.slice(-10);

  let response;
  try {
    response = await openAiClient.responses.create({
      model: process.env.OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: buildSystemPrompt(config, prefs),
        },
        ...recentHistory,
        {
          role: "user",
          content: message,
        },
      ],
    });
  } catch (err) {
    const msg = (err as Error).message ?? "OpenAI error";
    return new Response(msg, { status: 502 });
  }
  const assistantResponse = response.output_text;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const ch of assistantResponse) {
        controller.enqueue(encoder.encode(ch));
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
