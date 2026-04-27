import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";

async function getOwnerSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getOwnerSession();
    if (!session.userId) return Response.json({ error: "לא מחובר" }, { status: 401 });

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return Response.json({ error: "מודעה לא נמצאה" }, { status: 404 });
    if (listing.seller_id !== session.userId) return Response.json({ error: "אין הרשאה" }, { status: 403 });

    const body = await req.json();
    const data: { price?: number; status?: "available" | "sold" } = {};

    if (body.price !== undefined) {
      const p = parseFloat(body.price);
      if (isNaN(p) || p <= 0) return Response.json({ error: "מחיר לא תקין" }, { status: 400 });
      data.price = p;
    }
    if (body.status !== undefined) {
      if (!["available", "sold"].includes(body.status)) return Response.json({ error: "סטטוס לא תקין" }, { status: 400 });
      data.status = body.status;
    }

    const updated = await prisma.listing.update({ where: { id }, data });
    return Response.json(updated);
  } catch (err) {
    console.error("[listings PATCH]", err);
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getOwnerSession();
    if (!session.userId) return Response.json({ error: "לא מחובר" }, { status: 401 });

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return Response.json({ error: "מודעה לא נמצאה" }, { status: 404 });
    if (listing.seller_id !== session.userId) return Response.json({ error: "אין הרשאה" }, { status: 403 });

    await prisma.listing.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[listings DELETE]", err);
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
