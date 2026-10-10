import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Get one chat session with its messages
export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const chat = await prisma.chatSession.findFirst({
      where: { id: params.chatId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    return NextResponse.json(chat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
