import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return Response.json(null);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, phone: true, city: true, address: true },
    });

    return Response.json(user);
  } catch {
    return Response.json(null);
  }
}
