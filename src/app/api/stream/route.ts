export const runtime = "edge";
import OpenAI from "openai";

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export async function POST(req: Request) {
  const { message, history } = (await req.json()) as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  const recentHistory = history.slice(-10);

  let response;
  try {
    response = await openAiClient.responses.create({
      model: process.env.OPENAI_MODEL,
      input: [
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
      console.log(`Received message: ${message}`);
      // const text = `Echo: ${message}`;
      for (const ch of assistantResponse) {
        controller.enqueue(encoder.encode(ch));
        await new Promise((r) => setTimeout(r, 50));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
