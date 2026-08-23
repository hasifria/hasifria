import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";

export async function GET() {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      created_at: true,
      terms_accepted_at: true,
      is_blocked: true,
      _count: { select: { listings: true } },
    },
  });
  return Response.json(users);
}
