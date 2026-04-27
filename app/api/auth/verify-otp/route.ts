import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";

const TEST_OTP = "1234";

export async function POST(req: Request) {
  try {
    let body: { otp?: unknown };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 }); }

    const otp = String(body.otp ?? "").trim();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.pendingPhone) {
      return NextResponse.json({ error: "לא נמצאה בקשת אימות. אנא התחל מחדש." }, { status: 400 });
    }
    if (otp !== TEST_OTP) {
      return NextResponse.json({ error: "קוד שגוי. נסה שוב." }, { status: 400 });
    }

    const isRegistration = !!(session.pendingName);
    const phone = session.pendingPhone;

    const user = await prisma.user.upsert({
      where: { phone },
      update: isRegistration
        ? { name: session.pendingName, address: session.pendingAddress }
        : {},
      create: {
        phone,
        name: session.pendingName ?? null,
        address: session.pendingAddress ?? null,
      },
    });

    session.userId = user.id;
    session.pendingPhone = undefined;
    session.pendingName = undefined;
    session.pendingAddress = undefined;
    await session.save();

    return NextResponse.json({
      success: true,
      phone: user.phone,
      isRegistration,
    });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "שגיאת שרת. אנא נסה שוב." }, { status: 500 });
  }
}
