import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "./session";
import { prisma } from "./db";

/**
 * Loads the iron-session and drops `userId` if that user was deleted or blocked,
 * so a blocked user is treated as logged out on every request — not only at login.
 * The cleared userId is in-memory only; call `session.destroy()` to also clear the cookie.
 */
export async function getActiveSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { is_blocked: true },
    });
    if (!user || user.is_blocked) session.userId = undefined;
  }
  return session;
}
