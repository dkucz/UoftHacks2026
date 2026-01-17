import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  transcript: string;
  messages: ChatMessage[];
};

const MODEL_NAME = "gemini-1.5-flash";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY on the server." },
      { status: 500 }
    );
  }

  let payload: ChatRequest;
  try {
    payload = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const transcript = payload.transcript?.trim();
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const userMessage = messages[messages.length - 1]?.content ?? "";

  if (!userMessage) {
    return Response.json({ error: "Message content is required." }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const systemPrompt = [
    "You are a helpful assistant answering questions about a family story.",
    "Use only the provided transcript for factual answers.",
    "If the transcript does not contain the answer, say you don't know and suggest asking a different question.",
    "Keep responses concise and friendly.",
  ].join(" ");

  const historyText = messages
    .slice(0, -1)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const promptParts = [
    systemPrompt,
    transcript
      ? `Transcript:\n${transcript}`
      : "Transcript: (none provided).",
    historyText ? `Conversation so far:\n${historyText}` : "",
    `User question:\n${userMessage}`,
  ].filter(Boolean);

  try {
    const result = await model.generateContent(promptParts.join("\n\n"));
    const text = result.response.text();
    return Response.json({ reply: text });
  } catch (error) {
    console.error("Gemini API error", error);
    return Response.json(
      { error: "Failed to generate a response." },
      { status: 500 }
    );
  }
}
