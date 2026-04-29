import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { title, author, isbn, cover_image, cover_alt } = body;
  const book = await prisma.book.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(author !== undefined && { author }),
      ...(isbn !== undefined && { isbn: isbn || null }),
      ...(cover_image !== undefined && { cover_image: cover_image || null }),
      ...(cover_alt !== undefined && { cover_alt: cover_alt || null }),
    },
  });
  return Response.json(book);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  // Delete in dependency order: likes → listings → book
  const listings = await prisma.listing.findMany({ where: { book_id: id }, select: { id: true } });
  const listingIds = listings.map((l) => l.id);
  await prisma.like.deleteMany({ where: { listing_id: { in: listingIds } } });
  await prisma.listing.deleteMany({ where: { book_id: id } });
  await prisma.book.delete({ where: { id } });
  return Response.json({ success: true });
}
