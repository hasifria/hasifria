import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cols = await prisma.seoSetting.findMany({
      where: { page_type: { in: ["footer_col_1", "footer_col_2", "footer_col_3"] } },
    });
    return Response.json(cols);
  } catch {
    return Response.json([]);
  }
}
