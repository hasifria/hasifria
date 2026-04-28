import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const { token, bookId, isbn, title, author, cover_image } = await req.json();

    if (!token) {
      return Response.json({ error: "חסר token" }, { status: 400 });
    }

    const record = await prisma.mobileListingSession.findUnique({ where: { token } });
    if (!record) {
      return Response.json({ error: "קישור לא תקין" }, { status: 404 });
    }
    if (Date.now() - record.created_at.getTime() > TOKEN_TTL_MS) {
      await prisma.mobileListingSession.delete({ where: { token } });
      return Response.json({ error: "הקישור פג תוקף" }, { status: 410 });
    }

    const bookData = {
      ...(bookId ? { bookId } : {}),
      isbn: isbn ?? null,
      title,
      author,
      cover_image: cover_image ?? null,
    };

    await prisma.mobileListingSession.update({
      where: { token },
      data: { book_data: JSON.stringify(bookData) },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[mobile-listing/submit]", err);
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
