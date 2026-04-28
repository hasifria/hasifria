import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return Response.json({ likedIds: [] }, { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const details = searchParams.get("details") === "true";

  try {
    if (details) {
      const likes = await prisma.like.findMany({
        where: { user_id: session.userId },
        include: {
          listing: {
            include: {
              book: { select: { id: true, title: true, author: true, cover_image: true } },
              seller: { select: { address: true, city: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listings = (likes as any[])
        .filter((lk: any) => lk.listing)
        .map((lk: any) => ({
          listingId: lk.listing.id,
          bookId: lk.listing.book.id,
          title: lk.listing.book.title,
          author: lk.listing.book.author,
          cover_image: lk.listing.book.cover_image,
          price: lk.listing.price !== null ? Number(lk.listing.price) : null,
          condition: lk.listing.condition,
          location: lk.listing.seller.address ?? lk.listing.seller.city ?? null,
        }));

      return Response.json({ listings });
    }

    const likes = await prisma.like.findMany({
      where: { user_id: session.userId },
      select: { listing_id: true },
    });

    return Response.json({ likedIds: likes.map((lk: any) => lk.listing_id) });
  } catch (err) {
    console.error("[likes GET]", err);
    return Response.json({ likedIds: [] });
  }
}

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return Response.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  try {
    const { listingId } = await req.json();
    if (!listingId) return Response.json({ error: "חסר listingId" }, { status: 400 });

    const existing = await prisma.like.findUnique({
      where: { user_id_listing_id: { user_id: session.userId, listing_id: listingId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return Response.json({ liked: false });
    } else {
      await prisma.like.create({ data: { user_id: session.userId, listing_id: listingId } });
      return Response.json({ liked: true });
    }
  } catch (err) {
    console.error("[likes POST]", err);
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
