import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (/^05\d{8}$/.test(cleaned)) return cleaned;
  if (/^\+9725\d{8}$/.test(cleaned)) return "0" + cleaned.slice(3);
  return null;
}

export async function POST(req: Request) {
  try {
    const { name, address, phone } = await req.json();

    if (!name?.trim()) return Response.json({ error: "חסר שם מלא" }, { status: 400 });
    if (!address?.trim()) return Response.json({ error: "חסרה כתובת" }, { status: 400 });

    const normalized = normalizePhone(phone ?? "");
    if (!normalized) return Response.json({ error: "מספר טלפון לא תקין" }, { status: 400 });

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.pendingPhone = normalized;
    session.pendingName = name.trim();
    session.pendingAddress = address.trim();
    await session.save();

    // TODO: send real SMS — OTP is hardcoded 1234
    return Response.json({ success: true, phone: normalized });
  } catch (err) {
    console.error("[register]", err);
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
