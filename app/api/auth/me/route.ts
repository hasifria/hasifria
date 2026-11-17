import { getActiveSession } from "@/lib/activeSession";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getActiveSession();
    if (!session.userId) return Response.json(null);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, phone: true, city: true, address: true },
    });

    if (!user) return Response.json(null);

    const superPhone = process.env.SUPER_USER_PHONE;
    return Response.json({ ...user, isSuperUser: !!(superPhone && user.phone === superPhone) });
  } catch {
    return Response.json(null);
  }
}
