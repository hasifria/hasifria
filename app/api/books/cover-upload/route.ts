import { prisma } from "@/lib/db";
import { uploadBookCover } from "@/lib/cloudinary";

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: Request) {
  try {
    const { token, imageData } = await req.json();
    if (!token || !imageData) {
      return Response.json({ error: "חסר token או תמונה" }, { status: 400 });
    }

    const record = await prisma.coverUpload.findUnique({ where: { token } });
    if (!record) {
      return Response.json({ error: "קישור לא תקין" }, { status: 404 });
    }

    if (Date.now() - record.created_at.getTime() > TOKEN_TTL_MS) {
      await prisma.coverUpload.delete({ where: { token } });
      return Response.json({ error: "הקישור פג תוקף. בקש קישור חדש." }, { status: 410 });
    }

    const url = await uploadBookCover(imageData);

    await prisma.coverUpload.update({
      where: { token },
      data: { image_data: url },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[cover-upload]", err);
    return Response.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
