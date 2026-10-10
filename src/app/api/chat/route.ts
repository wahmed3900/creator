import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Created per request so the build does not need OPENAI_API_KEY
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert YouTube growth strategist." }, 
        ...messages
      ],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          fullText += text;
          controller.enqueue(new TextEncoder().encode(text));
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}