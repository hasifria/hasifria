import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isbn = searchParams.get("isbn")?.replace(/[-\s]/g, "").trim();
  const q = searchParams.get("q")?.trim();

  try {
    if (isbn) {
      const book = await prisma.book.findUnique({ where: { isbn } });
      return Response.json(book);
    }

    if (q && q.length >= 2) {
      const books = await prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
            { isbn: { contains: q } },
          ],
        },
        take: 8,
        orderBy: { created_at: "desc" },
      });
      return Response.json(books);
    }

    return Response.json([]);
  } catch (err) {
    console.error("[books/search]", err);
    return Response.json(isbn ? null : []);
  }
}
