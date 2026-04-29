import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "./session";
import { prisma } from "./db";

export async function requireSuperUser(): Promise<{ phone: string } | null> {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) return null;
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });
    if (!user) return null;
    const superPhone = process.env.SUPER_USER_PHONE;
    if (!superPhone || user.phone !== superPhone) return null;
    return user;
  } catch {
    return null;
  }
}
