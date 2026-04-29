"use client";

import { useState, useEffect } from "react";

type SeoRow = {
  page_type: string;
  title_template: string;
  description_template: string;
  og_image: string | null;
};

const PAGE_LABELS: Record<string, { label: string; vars: string[]; altOnly?: boolean }> = {
  home:           { label: "דף הבית",                        vars: [] },
  book:           { label: "דף ספר",                         vars: ["{title}", "{author}", "{price}", "{city}"] },
  author:         { label: "דף סופר",                        vars: ["{author}"] },
  image_defaults: { label: "הגדרות תמונות ברירת מחדל",       vars: ["{title}", "{author}"], altOnly: true },
};

const SITE_LOGO = "/hasifria_logo.jpg";

export default function AdminSeoPage() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/seo").then((r) => r.json()).then(setRows).catch(() => {});
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
      </div>
    </div>
  );
}
