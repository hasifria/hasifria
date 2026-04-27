import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (/^05\d{8}$/.test(cleaned)) return cleaned;
  if (/^\+9725\d{8}$/.test(cleaned)) return "0" + cleaned.slice(3);
  if (/^9725\d{8}$/.test(cleaned)) return "0" + cleaned.slice(2);
  return null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const phone = normalizePhone(body.phone ?? "");

  if (!phone) {
    return NextResponse.json({ error: "מספר טלפון לא תקין. יש להזין מספר ישראלי כגון 0501234567" }, { status: 400 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.pendingPhone = phone;
  await session.save();

  // TODO: replace with real SMS (e.g. Twilio) — OTP is hardcoded to 1234 for now
  return NextResponse.json({ success: true, phone });
}
