import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Created per request so the build does not need OPENAI_API_KEY
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { messages, userId } = await req.json();
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { subscription: true } 
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMax = user.subscription?.plan === "MAX";
    if (!isMax && user.credits <= 0) {
      return NextResponse.json({ error: "Upgrade to MAX for unlimited insights" }, { status: 403 });
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
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(new TextEncoder().encode(text));
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