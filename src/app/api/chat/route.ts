import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { messages, userId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isMax = user.subscription?.plan === "MAX";
  if (!isMax && user.credits <= 0) {
    return NextResponse.json({ error: "Upgrade to MAX for unlimited insights" }, { status: 403 });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: "You are an expert YouTube growth strategist." }, ...messages],
    stream: true,
  });

  if (!isMax) {
    await prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 1 } } });
  }
  return new Response(response.toReadableStream());
}
