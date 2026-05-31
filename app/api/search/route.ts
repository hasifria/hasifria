import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
  const skip = (page - 1) * limit;

  const cityFilter =
    city && city !== "כל הארץ"
      ? {
          seller: {
            OR: [
              { address: { contains: city, mode: "insensitive" as const } },
              { city: { contains: city, mode: "insensitive" as const } },
            ],
          },
        }
      : {};

  const textFilter = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { author: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = {
    ...textFilter,
    listings: { some: { status: "available" as const, ...cityFilter } },
  };

  try {
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          listings: {
            where: { status: "available", ...cityFilter },
            orderBy: { price: "asc" },
            select: { id: true, price: true },
            take: 1,
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (books as any[])
      .filter((b: any) => b.listings.length > 0)
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        cover_image: b.cover_image,
        cover_alt: b.cover_alt,
        minPrice: b.listings[0].price !== null ? Number(b.listings[0].price) : null,
        listingId: b.listings[0].id,
      }));

    return Response.json({ results, hasMore: skip + limit < total, total });
  } catch (err) {
    console.error("[api/search]", err);
    return Response.json({ results: [], hasMore: false, total: 0 });
  }
}
