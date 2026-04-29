import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";

export async function GET() {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const books = await prisma.book.findMany({
    orderBy: { created_at: "desc" },
    take: 300,
    select: {
      id: true,
      isbn: true,
      title: true,
      author: true,
      cover_image: true,
      cover_alt: true,
      _count: { select: { listings: true } },
    },
  });
  return Response.json(books);
}
