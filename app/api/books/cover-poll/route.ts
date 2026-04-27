import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return Response.json({ ready: false });

  try {
    const record = await prisma.coverUpload.findUnique({ where: { token } });
    if (!record?.image_data) return Response.json({ ready: false });

    const imageData = record.image_data;
    await prisma.coverUpload.delete({ where: { token } });

    return Response.json({ ready: true, imageData });
  } catch (err) {
    console.error("[cover-poll]", err);
    return Response.json({ ready: false });
  }
}
