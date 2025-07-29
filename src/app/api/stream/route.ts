export const runtime = "edge";
import OpenAI from "openai";

if (!process.env.OPENAI_KEY || !process.env.OPENAI_MODEL) {
  throw new Error("Missing OPENAI_KEY or OPENAI_MODEL env vars");
}

const MAX_MESSAGE_LENGTH = 1000;

interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

interface UserPrefs {
  country: string;
  continent: string;
  destination: string;
}

interface RequestBody {
  message: string;
  history: ChatHistory[];
  prefs: UserPrefs;
}

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const getGeoGuidePrompt = function getGeoGuidePrompt(prefs: {
  country: string;
  continent: string;
  destination: string;
}) {
  return `You are **GeoGuide**, an AI assistant chat-bot that ONLY discusses world-geography.

      - Output rules
        1. Reply in plain text - no Markdown, HTML or code-blocks.
        2. Be concise (≈ 2-4 sentences) yet informative; avoid answers that force the user to scroll.
        3. Maintain a neutral, polite and friendly tone. Never insult or use rude language.
        4. If a user asks about anything *not* related to geography, respond with:
          "I'm sorry, I can only discuss geography-related topics."

      - Conversation goals
        • Give clear, accurate answers to geography questions.
        • Proactively keep the chat lively by suggesting related geography facts or questions.
        • Personalise content using the stored preferences below whenever relevant.

      ✦ User preferences
        • Favourite country: ${prefs.country || "-"}
        • Favourite continent: ${prefs.continent || "-"}
        • Favourite destination: ${prefs.destination || "-"}
      If any of the user preferences is not present, please ask the user for more information. 

      Max lenght response: ${MAX_MESSAGE_LENGTH} characters.
    `.trim();
};

function isValidRequest(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { message, history, prefs } = body as RequestBody;

  // Validate message
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return false;
  }

  // Validate history
  if (
    !Array.isArray(history) ||
    history.some(
      (item) =>
        typeof item !== "object" ||
        !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string" ||
        item.content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return false;
  }

  // Validate prefs
  if (!prefs || typeof prefs !== "object") {
    return false;
  }

  const { country, continent, destination } = prefs;
  if (
    (country !== undefined && typeof country !== "string") ||
    (continent !== undefined && typeof continent !== "string") ||
    (destination !== undefined && typeof destination !== "string")
  ) {
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

  const { message, history, prefs } = body;

  const recentHistory = history.slice(-10);

  let response;
  try {
    response = await openAiClient.responses.create({
      model: process.env.OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: getGeoGuidePrompt(prefs),
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
  console.log("OpenAI Response", assistantResponse);

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
