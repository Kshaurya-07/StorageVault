import { NextResponse } from "next/server";
import { getCookieSettings } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  const cookieSettings = getCookieSettings();
  response.cookies.set(cookieSettings.name, "", {
    ...cookieSettings.options,
    maxAge: 0,
  });
  return response;
}
