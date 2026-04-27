import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "available" },
      include: {
        book: { select: { id: true, title: true, author: true, cover_image: true } },
        seller: { select: { address: true, city: true } },
      },
      orderBy: { created_at: "desc" },
      take: 8,
    });

    const result = listings.map((l) => ({
      listingId: l.id,
      bookId: l.book.id,
      title: l.book.title,
      author: l.book.author,
      cover_image: l.book.cover_image,
      price: Number(l.price),
      condition: l.condition,
      location: l.seller.address ?? l.seller.city ?? null,
    }));

    return Response.json(result);
  } catch (err) {
    console.error("[listings/recent]", err);
    return Response.json([]);
  }
}
