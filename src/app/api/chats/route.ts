import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Get all chat sessions for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const chats = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(chats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new chat session
export async function POST(req: Request) {
  try {
    const { userId, title } = await req.json();

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const chat = await prisma.chatSession.create({
      data: {
        userId,
        title: title || "New Strategy Session",
      },
    });

    return NextResponse.json(chat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}