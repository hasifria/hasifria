import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import twilio from "twilio";

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (/^05\d{8}$/.test(cleaned)) return cleaned;
  if (/^\+9725\d{8}$/.test(cleaned)) return "0" + cleaned.slice(3);
  if (/^9725\d{8}$/.test(cleaned)) return "0" + cleaned.slice(2);
  return null;
}

function toE164(phone: string): string {
  // Convert 05XXXXXXXX -> +9725XXXXXXXX
  return "+972" + phone.slice(1);
}

export async function POST(req: Request) {
  const body = await req.json();
  const phone = normalizePhone(body.phone ?? "");

  if (!phone) {
    return NextResponse.json({ error: "מספר טלפון לא תקין. יש להזין מספר ישראלי כגון 0501234567" }, { status: 400 });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.pendingPhone = phone;
  session.pendingOtp = otp;
  await session.save();

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    await client.messages.create({
      body: `קוד האימות שלך להספרייה: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: toE164(phone),
    });
  } catch (err) {
    console.error("[send-otp] Twilio error:", err);
    return NextResponse.json({ error: "שליחת SMS נכשלה. אנא נסה שוב." }, { status: 500 });
  }

  return NextResponse.json({ success: true, phone });
}
