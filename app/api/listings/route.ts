import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";
import { uploadBookCover, isBase64Image } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.userId) {
      return Response.json({ error: "יש להתחבר תחילה" }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, isbn, title, author, genre, cover_image, condition, price, category } = body;

    if (!condition || !["new", "good", "worn"].includes(condition)) {
      return Response.json({ error: "מצב הספר לא תקין" }, { status: 400 });
    }

    let parsedPrice: number | null = null;
    if (price !== null && price !== undefined && price !== "") {
      parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return Response.json({ error: "מחיר לא תקין" }, { status: 400 });
      }
    }

    const validCategories = ["CHILDREN", "YOUNG_ADULT", "ADULT", "EDUCATION", "HEALTH"];
    const parsedCategory = category && validCategories.includes(category) ? category : null;

    // Upload base64 cover images to Cloudinary before persisting
    let resolvedCover: string | null = cover_image || null;
    if (resolvedCover && isBase64Image(resolvedCover)) {
      resolvedCover = await uploadBookCover(resolvedCover, {
        isbn: isbn?.trim() || null,
        title: title?.trim() || null,
      });
    }

    let book;
    if (bookId) {
      book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) return Response.json({ error: "ספר לא נמצא" }, { status: 404 });
      if (resolvedCover && !book.cover_image) {
        book = await prisma.book.update({ where: { id: bookId }, data: { cover_image: resolvedCover } });
      }
    } else {
      if (!title?.trim()) return Response.json({ error: "חסר שם ספר" }, { status: 400 });
      if (!author?.trim()) return Response.json({ error: "חסר שם סופר" }, { status: 400 });
      book = await prisma.book.create({
        data: {
          isbn: isbn?.trim() || null,
          title: title.trim(),
          author: author.trim(),
          genre: genre?.trim() || null,
          cover_image: resolvedCover,
        },
      });
    }

    const listing = await prisma.listing.create({
      data: {
        book_id: book.id,
        seller_id: session.userId,
        price: parsedPrice,
        condition,
        category: parsedCategory,
        status: "available",
      },
    });

    return Response.json({ success: true, listingId: listing.id, bookId: book.id });
  } catch (err) {
    console.error("[listings POST]", err);
    return Response.json({ error: "שגיאת שרת. אנא נסה שוב." }, { status: 500 });
  }
}
