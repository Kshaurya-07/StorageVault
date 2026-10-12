import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        accountStatus: true,
        createdAt: true,
        telegramConnection: {
          select: {
            connectionStatus: true,
            telegramUserId: true,
            telegramUsername: true,
            telegramFirstName: true,
            connectedAt: true,
          },
        },
      },
    });

    if (!user || user.accountStatus === "DELETED") {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      telegram: {
        connected: user.telegramConnection?.connectionStatus === "CONNECTED",
        status: user.telegramConnection?.connectionStatus || "DISCONNECTED",
        username: user.telegramConnection?.telegramUsername,
        firstName: user.telegramConnection?.telegramFirstName,
        connectedAt: user.telegramConnection?.connectedAt,
      },
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
