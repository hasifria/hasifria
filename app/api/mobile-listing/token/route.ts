import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";
import twilio from "twilio";

function makeToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return Response.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sendSms = !!body.sendSms;

  const token = makeToken();
  await prisma.mobileListingSession.create({ data: { token } });

  if (sendSms) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true },
    });
    if (user?.phone) {
      const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
      const mobileUrl = `${origin}/sell/mobile/${token}`;
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
        await client.messages.create({
          body: `הספרייה — לחץ לסריקת ברקוד הספר: ${mobileUrl}`,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: "+972" + user.phone.slice(1),
        });
      } catch (err) {
        console.error("[mobile-listing/token] SMS error:", err);
      }
    }
  }

  return Response.json({ token });
}
