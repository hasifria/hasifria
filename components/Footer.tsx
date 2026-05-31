"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FooterLink = { name: string; url: string };
type FooterCol = { page_type: string; title_template: string; description_template: string };

export default function Footer() {
  const [cols, setCols] = useState<FooterCol[]>([]);

  useEffect(() => {
    fetch("/api/footer-links")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCols(data); })
      .catch(() => {});
  }, []);

  const parsedCols = cols
    .sort((a, b) => a.page_type.localeCompare(b.page_type))
    .map((col) => {
      let raw: FooterLink[] = [];
      try { raw = JSON.parse(col.description_template); } catch { /* empty */ }
      const links = (Array.isArray(raw) ? raw : [])
        .filter((l) => l.name && l.name.trim())
        .slice(0, 5);
      return { title: col.title_template, links };
    })
    .filter((col) => col.links.length > 0);

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Footer columns */}
        {parsedCols.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8 pb-8 border-b border-[#1a1a1a]">
            {parsedCols.map((col, i) => (
              <div key={i}>
                {col.title && (
                  <h3 className="text-[#a0a0a0] font-semibold text-sm mb-3">{col.title}</h3>
                )}
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.url}
                        className="text-sm text-[#555] hover:text-[#F5A623] transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>© 2026 הספריה — ספרים יד שניה או למסירה קרוב לביתך</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#F5A623] transition-colors">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-[#F5A623] transition-colors">מדיניות פרטיות</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
