import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Temporary guest accounts until real authentication is added.
// GET ?userId=... returns that user (or 404); POST creates a new guest.
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, credits: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await prisma.user.create({
      data: { email: `guest-${crypto.randomUUID()}@guest.local`, name: "Guest" },
      select: { id: true, name: true, credits: true },
    });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
