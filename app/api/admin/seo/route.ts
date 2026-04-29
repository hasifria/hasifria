import { prisma } from "@/lib/db";
import { requireSuperUser } from "@/lib/superuser";
import { SEO_DEFAULTS } from "@/lib/seo";

export async function GET() {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const settings = await prisma.seoSetting.findMany();
  // Merge DB settings over defaults so all page types are always present
  const result = (Object.keys(SEO_DEFAULTS) as (keyof typeof SEO_DEFAULTS)[]).map((pt) => {
    const db = settings.find((s) => s.page_type === pt);
    return db ?? { page_type: pt, ...SEO_DEFAULTS[pt], og_image: null, id: null, updated_at: null };
  });
  return Response.json(result);
}

export async function POST(req: Request) {
  if (!await requireSuperUser()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { page_type, title_template, description_template, og_image } = await req.json();
  if (!page_type || !title_template || !description_template) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  const setting = await prisma.seoSetting.upsert({
    where: { page_type },
    create: { page_type, title_template, description_template, og_image: og_image ?? null },
    update: { title_template, description_template, og_image: og_image ?? null },
  });
  return Response.json(setting);
}
