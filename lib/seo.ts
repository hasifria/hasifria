import { prisma } from "./db";

export const SEO_DEFAULTS = {
  home: {
    title_template: "הספריה — ספרים יד שניה בישראל",
    description_template: "מצא ספרים יד שניה ממוכרים פרטיים בכל רחבי ישראל. מחירים נוחים, מגוון עצום.",
  },
  book: {
    title_template: "{title} מאת {author} — הספריה",
    description_template: "קנה את הספר {title} מאת {author} יד שניה. מחיר החל מ-{price}₪ באזור {city}.",
  },
  author: {
    title_template: "ספרים מאת {author} — הספריה",
    description_template: "כל הספרים של {author} למכירה יד שניה בישראל.",
  },
  image_defaults: {
    title_template: "",
    description_template: "{title} מאת {author} — ספר יד שניה בישראל",
  },
} as const;

export type PageType = keyof typeof SEO_DEFAULTS;

export async function getSeoTemplates(pageType: PageType) {
  try {
    const setting = await prisma.seoSetting.findUnique({ where: { page_type: pageType } });
    if (setting) {
      return {
        title_template: setting.title_template,
        description_template: setting.description_template,
        og_image: setting.og_image ?? null,
      };
    }
  } catch { /* fall through to defaults */ }
  return { ...SEO_DEFAULTS[pageType], og_image: null };
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{${k}}`, v), template);
}
