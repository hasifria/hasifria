import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: { is_blocked: Boolean(body.is_blocked) },
    select: { id: true, is_blocked: true },
  });
  return Response.json(user);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const listings = await prisma.listing.findMany({ where: { seller_id: id }, select: { id: true } });
  const listingIds = listings.map((l) => l.id);
  if (listingIds.length > 0) {
    await prisma.like.deleteMany({ where: { listing_id: { in: listingIds } } });
  }
  await prisma.like.deleteMany({ where: { user_id: id } });
  await prisma.listing.deleteMany({ where: { seller_id: id } });
  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}
