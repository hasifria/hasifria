"use client";

import { useState, useEffect } from "react";

type SeoRow = {
  page_type: string;
  title_template: string;
  description_template: string;
  og_image: string | null;
};

type FooterLink = { name: string; url: string };

type FooterCol = {
  page_type: string;
  title: string;
  links: FooterLink[];
};

const PAGE_LABELS: Record<string, { label: string; vars: string[]; altOnly?: boolean }> = {
  home:           { label: "דף הבית",                        vars: [] },
  book:           { label: "דף ספר",                         vars: ["{title}", "{author}", "{price}", "{city}"] },
  author:         { label: "דף סופר",                        vars: ["{author}"] },
  image_defaults: { label: "הגדרות תמונות ברירת מחדל",       vars: ["{title}", "{author}"], altOnly: true },
};

const SITE_LOGO = "/hasifria_logo.jpg";

const FOOTER_COL_LABELS: Record<string, string> = {
  footer_col_1: "עמודה 1",
  footer_col_2: "עמודה 2",
  footer_col_3: "עמודה 3",
};

function emptyLinks(): FooterLink[] {
  return Array.from({ length: 5 }, () => ({ name: "", url: "" }));
}

export default function AdminSeoPage() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [footerCols, setFooterCols] = useState<FooterCol[]>([
    { page_type: "footer_col_1", title: "", links: emptyLinks() },
    { page_type: "footer_col_2", title: "", links: emptyLinks() },
    { page_type: "footer_col_3", title: "", links: emptyLinks() },
  ]);
  const [footerSaving, setFooterSaving] = useState<string | null>(null);
  const [footerSaved, setFooterSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/seo").then((r) => r.json()).then(setRows).catch(() => {});

    fetch("/api/footer-links").then((r) => r.json()).then((data: SeoRow[]) => {
      if (!Array.isArray(data)) return;
      setFooterCols((prev) =>
        prev.map((col) => {
          const db = data.find((d) => d.page_type === col.page_type);
          if (!db) return col;
          let links: FooterLink[] = [];
          try { links = JSON.parse(db.description_template); } catch { /* empty */ }
          const padded = [...links, ...emptyLinks()].slice(0, 5);
          return { page_type: col.page_type, title: db.title_template, links: padded };
        })
      );
    }).catch(() => {});
  }, []);

  const update = (pageType: string, field: keyof SeoRow, val: string | null) => {
    setRows((prev) => prev.map((r) => r.page_type === pageType ? { ...r, [field]: val } : r));
  };

  const save = async (row: SeoRow) => {
    setSaving(row.page_type);
    setSaved(null);
    try {
      await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      setSaved(row.page_type);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  const updateFooterCol = (pageType: string, field: "title" | "links", val: string | FooterLink[]) => {
    setFooterCols((prev) =>
      prev.map((col) => col.page_type === pageType ? { ...col, [field]: val } : col)
    );
  };

  const updateFooterLink = (pageType: string, index: number, field: keyof FooterLink, val: string) => {
    setFooterCols((prev) =>
      prev.map((col) => {
        if (col.page_type !== pageType) return col;
        const links = col.links.map((l, i) => i === index ? { ...l, [field]: val } : l);
        return { ...col, links };
      })
    );
  };

  const saveFooterCol = async (col: FooterCol) => {
    setFooterSaving(col.page_type);
    setFooterSaved(null);
    const validLinks = col.links.filter((l) => l.name.trim());
    try {
      await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_type: col.page_type,
          title_template: col.title,
          description_template: JSON.stringify(validLinks),
          og_image: null,
        }),
      });
      setFooterSaved(col.page_type);
      setTimeout(() => setFooterSaved(null), 2000);
    } finally {
      setFooterSaving(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F0F0F0] mb-8">עריכת SEO</h1>
      <div className="space-y-6">
        {rows.map((row) => {
          const meta = PAGE_LABELS[row.page_type] ?? { label: row.page_type, vars: [] };
          return (
            <div key={row.page_type} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-[#F0F0F0] text-lg">{meta.label}</h2>
                {meta.vars.length > 0 && (
                  <p className="text-xs text-[#555]">
                    משתנים: <span className="text-[#4ECDC4]">{meta.vars.join(", ")}</span>
                  </p>
                )}
              </div>
              <div className="space-y-4">
                {meta.altOnly ? (
                  <div>
                    <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">
                      תבנית alt text לתמונות ספרים
                    </label>
                    <input
                      type="text"
                      value={row.description_template}
                      onChange={(e) => update(row.page_type, "description_template", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                      dir="rtl"
                    />
                    <p className="text-xs text-[#555] mt-2">
                      תבנית זו מציגה את ברירת המחדל לתיאור תמונה כאשר לא הוגדר alt text ידני לספר.
                      משתמש ב: <span className="text-[#4ECDC4]">{"{title}"}, {"{author}"}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">כותרת (title)</label>
                      <input
                        type="text"
                        value={row.title_template}
                        onChange={(e) => update(row.page_type, "title_template", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">תיאור (description)</label>
                      <textarea
                        value={row.description_template}
                        onChange={(e) => update(row.page_type, "description_template", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm resize-none"
                        dir="rtl"
                      />
                    </div>
                  </>
                )}
                {!meta.altOnly && <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">תמונת og:image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={row.og_image ?? ""}
                      onChange={(e) => update(row.page_type, "og_image", e.target.value || null)}
                      placeholder="הדבק כתובת URL של תמונה..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => update(row.page_type, "og_image", SITE_LOGO)}
                      className="shrink-0 px-3 py-2.5 text-xs font-medium border border-[#3a3a3a] hover:border-[#F5A623] text-[#888] hover:text-[#F5A623] rounded-xl transition-colors whitespace-nowrap"
                    >
                      השתמש בלוגו
                    </button>
                  </div>
                  {row.og_image && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.og_image}
                        alt=""
                        className="w-20 h-11 object-cover rounded-lg border border-[#3a3a3a] bg-[#2a2a2a]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <button
                        type="button"
                        onClick={() => update(row.page_type, "og_image", null)}
                        className="text-xs text-[#555] hover:text-red-400 transition-colors"
                      >
                        הסר
                      </button>
                    </div>
                  )}
                </div>}
              </div>
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => save(row)}
                  disabled={saving === row.page_type}
                  className="px-5 py-2 bg-[#F5A623] hover:bg-[#e0941a] disabled:opacity-60 text-black text-sm font-bold rounded-xl transition-colors"
                >
                  {saving === row.page_type ? "שומר..." : "שמור"}
                </button>
                {saved === row.page_type && (
                  <span className="text-sm text-emerald-400">✓ נשמר</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer columns section */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="font-bold text-[#F0F0F0] text-lg mb-2">קישורים בפוטר</h2>
          <p className="text-xs text-[#555] mb-6">
            הגדר עד 3 עמודות קישורים שיופיעו בתחתית האתר. כל עמודה יכולה להכיל כותרת ועד 5 קישורים.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {footerCols.map((col) => (
              <div key={col.page_type} className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[#a0a0a0]">{FOOTER_COL_LABELS[col.page_type]}</h3>

                <div>
                  <label className="block text-xs text-[#555] mb-1">כותרת עמודה</label>
                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) => updateFooterCol(col.page_type, "title", e.target.value)}
                    placeholder="לדוגמה: ספרים מומלצים"
                    className="w-full px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-[#555]">קישורים (עד 5)</label>
                  {col.links.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => updateFooterLink(col.page_type, i, "name", e.target.value)}
                        placeholder="שם"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-xs"
                        dir="rtl"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateFooterLink(col.page_type, i, "url", e.target.value)}
                        placeholder="/search?q=..."
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => saveFooterCol(col)}
                    disabled={footerSaving === col.page_type}
                    className="px-4 py-1.5 bg-[#F5A623] hover:bg-[#e0941a] disabled:opacity-60 text-black text-xs font-bold rounded-lg transition-colors"
                  >
                    {footerSaving === col.page_type ? "שומר..." : "שמור"}
                  </button>
                  {footerSaved === col.page_type && (
                    <span className="text-xs text-emerald-400">✓ נשמר</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
