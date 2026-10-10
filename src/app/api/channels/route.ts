import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Get user's connected channels
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const channels = await prisma.channel.findMany({
      where: { userId },
    });

    return NextResponse.json(channels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add a YouTube channel
export async function POST(req: Request) {
  try {
    const { userId, channelId, title, thumbnail, subscribers } = await req.json();

    if (!userId || !channelId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const channel = await prisma.channel.upsert({
      where: { channelId },
      create: { userId, channelId, title, thumbnail, subscribers },
      update: { title, thumbnail, subscribers },
    });

    return NextResponse.json(channel);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete / Disconnect a channel
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) return NextResponse.json({ error: "Missing channelId" }, { status: 400 });

    await prisma.channel.delete({
      where: { channelId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}