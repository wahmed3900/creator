import Anthropic from "@anthropic-ai/sdk";
import { OpenAI } from "openai";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Provider = "claude" | "gemini" | "openai";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Claude",
  gemini: "Gemini",
  openai: "OpenAI",
};

// AI_PROVIDER forces a provider; otherwise use the first one with a key set.
export function pickProvider(): Provider | null {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced === "claude" || forced === "gemini" || forced === "openai") return forced;
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

// Turns a provider error into a message that is safe and useful to show the user.
export function describeAIError(provider: Provider, error: unknown): string | null {
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) {
    return `${PROVIDER_LABELS[provider]}: ${error.message}`;
  }
  return null;
}

// Streams the assistant's reply as plain text chunks.
// Clients are created per call so the build does not need API keys.
export async function* streamChat(
  provider: Provider,
  system: string,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  if (provider === "claude") {
    const client = new Anthropic();
    // The Messages API requires the conversation to start with a user turn
    const firstUser = messages.findIndex((m) => m.role === "user");
    const stream = client.beta.messages.stream({
      model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
      max_tokens: 64000,
      system,
      messages: firstUser === -1 ? [] : messages.slice(firstUser),
      // Re-run a safety-declined request on Anthropic's recommended fallback model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
    return;
  }

  // Gemini exposes an OpenAI-compatible endpoint, so both use the OpenAI client
  const client =
    provider === "gemini"
      ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: GEMINI_BASE_URL })
      : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model =
    provider === "gemini" ? process.env.GEMINI_MODEL || "gemini-flash-latest" : "gpt-4o";

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "system", content: system }, ...messages],
    stream: true,
  });
  for await (const chunk of response) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
