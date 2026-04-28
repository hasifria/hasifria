import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 30 * 60 * 1000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return Response.json({ ready: false });

  try {
    const record = await prisma.mobileListingSession.findUnique({ where: { token } });
    if (!record) return Response.json({ ready: false });

    if (Date.now() - record.created_at.getTime() > TOKEN_TTL_MS) {
      await prisma.mobileListingSession.delete({ where: { token } });
      return Response.json({ ready: false, expired: true });
    }

    if (!record.book_data) return Response.json({ ready: false });

    const book = JSON.parse(record.book_data);
    await prisma.mobileListingSession.delete({ where: { token } });
    return Response.json({ ready: true, book });
  } catch (err) {
    console.error("[mobile-listing/poll]", err);
    return Response.json({ ready: false });
  }
}
