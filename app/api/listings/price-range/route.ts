import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isbn = searchParams.get("isbn") || "";
  const title = searchParams.get("title") || "";

  if (!isbn && !title) {
    return Response.json({ min: null, max: null, count: 0 });
  }

  try {
    const bookOrClauses: object[] = [];
    if (isbn) bookOrClauses.push({ isbn });
    if (title) bookOrClauses.push({ title: { contains: title, mode: "insensitive" as const } });

    const listings = await prisma.listing.findMany({
      where: {
        status: "available",
        price: { not: null },
        book: { OR: bookOrClauses },
      },
      select: { price: true },
    });

    const count = listings.length;
    if (count === 0) {
      return Response.json({ min: null, max: null, count: 0 });
    }

    const prices = listings.map((l) => Number(l.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return Response.json({ min, max, count });
  } catch (err) {
    console.error("[price-range]", err);
    return Response.json({ min: null, max: null, count: 0 });
  }
}
