import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { status, price } = body;

  const validStatuses = ["available", "sold"];
  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...(status !== undefined && validStatuses.includes(status) && { status }),
      ...(price !== undefined && { price: price === null || price === "" ? null : parseFloat(price) }),
    },
  });
  return Response.json(listing);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.like.deleteMany({ where: { listing_id: id } });
  await prisma.listing.delete({ where: { id } });
  return Response.json({ success: true });
}
