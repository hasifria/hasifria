"use client";

import { useState, useEffect } from "react";

type SeoRow = {
  page_type: string;
  title_template: string;
  description_template: string;
};

const PAGE_LABELS: Record<string, { label: string; vars: string[] }> = {
  home:   { label: "דף הבית",    vars: [] },
  book:   { label: "דף ספר",     vars: ["{title}", "{author}", "{price}", "{city}"] },
  author: { label: "דף סופר",    vars: ["{author}"] },
};

export default function AdminSeoPage() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/seo").then((r) => r.json()).then(setRows).catch(() => {});
  }, []);

  const update = (pageType: string, field: "title_template" | "description_template", val: string) => {
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
              </div>
              <div className="flex items-center gap-3 mt-4">
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
