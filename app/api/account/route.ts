import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return Response.json({ error: "לא מחובר" }, { status: 401 });

    const { name, city, address } = await request.json();

    if (!name?.trim()) return Response.json({ error: "שם חסר" }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        city: city?.trim() || null,
        address: address?.trim() || null,
      },
      select: { id: true, name: true, phone: true, city: true, address: true },
    });

    return Response.json(user);
  } catch {
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
