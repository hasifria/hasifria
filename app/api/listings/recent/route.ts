import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

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

  try {
    const listings = await prisma.listing.findMany({
      where: { status: "available", ...cityFilter },
      include: {
        book: { select: { id: true, title: true, author: true, cover_image: true, cover_alt: true } },
        seller: { select: { address: true, city: true } },
      },
      orderBy: { created_at: "desc" },
      take: 12,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (listings as any[]).map((l: any) => ({
      listingId: l.id,
      bookId: l.book.id,
      title: l.book.title,
      author: l.book.author,
      cover_image: l.book.cover_image,
      cover_alt: l.book.cover_alt,
      price: l.price !== null ? Number(l.price) : null,
      condition: l.condition,
      location: l.seller.address ?? l.seller.city ?? null,
    }));

    return Response.json(result);
  } catch (err) {
    console.error("[listings/recent]", err);
    return Response.json([]);
  }
}
