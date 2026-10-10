import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { describeAIError, pickProvider, streamChat, type ChatMessage } from "@/lib/ai";

const SYSTEM_PROMPT = "You are an expert YouTube growth strategist.";

export async function POST(req: Request) {
  const provider = pickProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "No AI key set on the server. Add ANTHROPIC_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY." },
      { status: 500 }
    );
  }
  try {
    const { messages, userId, chatId } = await req.json();
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { subscription: true } 
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMax = user.subscription?.plan === "MAX";
    if (!isMax && user.credits <= 0) {
      return NextResponse.json({ error: "Upgrade to MAX for unlimited insights" }, { status: 403 });
    }

    const chat = chatId
      ? await prisma.chatSession.findFirst({ where: { id: chatId, userId } })
      : null;
    if (chatId && !chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    // Save the user's message and name the chat after its first message
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    if (chat && lastUserMessage) {
      await prisma.message.create({
        data: { chatId: chat.id, role: "user", content: lastUserMessage.content },
      });
      if (chat.title === "New Strategy Session") {
        const title = lastUserMessage.content.slice(0, 40) + (lastUserMessage.content.length > 40 ? "…" : "");
        await prisma.chatSession.update({ where: { id: chat.id }, data: { title } });
      }
    }

    const history: ChatMessage[] = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({ role: m.role, content: String(m.content) }));
    const chunks = streamChat(provider, SYSTEM_PROMPT, history);
    // Read the first chunk now so key or quota errors are returned as JSON, not a broken stream
    const first = await chunks.next();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullText = "";
        try {
          if (!first.done) {
            fullText += first.value;
            controller.enqueue(encoder.encode(first.value));
          }
          for await (const text of chunks) {
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        } catch (error) {
          console.error("Chat stream error:", error);
          controller.enqueue(encoder.encode("\n\n[The response was interrupted. Please try again.]"));
        }
        // Save the assistant's reply once streaming finishes
        if (chat && fullText) {
          await prisma.message.create({
            data: { chatId: chat.id, role: "assistant", content: fullText },
          });
        }
        controller.close();
      },
    });

    if (!isMax) {
      await prisma.user.update({ 
        where: { id: userId }, 
        data: { credits: { decrement: 1 } } 
      });
    }

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    // Surface provider errors (bad key, no credit, rate limit) so they can be fixed
    const aiError = describeAIError(provider, error);
    if (aiError) return NextResponse.json({ error: aiError }, { status: 502 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}