import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";

export async function GET() {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const listings = await prisma.listing.findMany({
    orderBy: { created_at: "desc" },
    take: 300,
    include: {
      book:   { select: { id: true, title: true, author: true } },
      seller: { select: { id: true, name: true, phone: true } },
    },
  });
  return Response.json(listings);
}
