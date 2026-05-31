"use client";

import { useState, useEffect } from "react";

type Prefs = { fontSize: number; highContrast: boolean; readableFont: boolean };

const DEFAULTS: Prefs = { fontSize: 100, highContrast: false, readableFont: false };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem("a11y-prefs");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

function applyPrefs(prefs: Prefs) {
  const html = document.documentElement;
  html.style.fontSize = `${prefs.fontSize}%`;
  if (prefs.highContrast) {
    html.setAttribute("data-high-contrast", "true");
  } else {
    html.removeAttribute("data-high-contrast");
  }
  if (prefs.readableFont) {
    html.setAttribute("data-readable-font", "true");
  } else {
    html.removeAttribute("data-readable-font");
  }
}

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    const saved = loadPrefs();
    setPrefs(saved);
    applyPrefs(saved);
  }, []);

  const update = (next: Partial<Prefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    applyPrefs(merged);
    try { localStorage.setItem("a11y-prefs", JSON.stringify(merged)); } catch { /* ignore */ }
  };

  return (
    <>
      {/* High contrast + readable font CSS */}
      <style>{`
        [data-high-contrast="true"] body {
          background: #000 !important;
          color: #fff !important;
        }
        [data-high-contrast="true"] a { color: #ffff00 !important; }
        [data-high-contrast="true"] button { border: 1px solid #fff !important; }
        [data-readable-font="true"] body,
        [data-readable-font="true"] input,
        [data-readable-font="true"] textarea,
        [data-readable-font="true"] button {
          font-family: Arial, sans-serif !important;
          line-height: 1.8 !important;
        }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="נגישות"
        className="fixed bottom-6 left-6 z-[9000] w-12 h-12 bg-[#F5A623] hover:bg-[#e0941a] text-black rounded-full shadow-lg flex items-center justify-center text-xl transition-colors"
      >
        ♿
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 left-6 z-[9000] bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl shadow-2xl p-5 w-60"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#F0F0F0] text-sm">נגישות</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-[#555] hover:text-[#F0F0F0] transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Font size */}
          <div className="mb-4">
            <p className="text-xs text-[#888] mb-2">גודל טקסט</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update({ fontSize: Math.max(80, prefs.fontSize - 10) })}
                className="flex-1 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F0F0F0] rounded-lg text-sm font-bold transition-colors"
              >
                א-
              </button>
              <span className="text-xs text-[#555] w-10 text-center">{prefs.fontSize}%</span>
              <button
                onClick={() => update({ fontSize: Math.min(150, prefs.fontSize + 10) })}
                className="flex-1 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F0F0F0] rounded-lg text-sm font-bold transition-colors"
              >
                א+
              </button>
            </div>
          </div>

          {/* High contrast */}
          <button
            onClick={() => update({ highContrast: !prefs.highContrast })}
            className={`w-full py-2.5 rounded-lg text-sm font-medium mb-2 transition-colors ${
              prefs.highContrast
                ? "bg-[#F5A623] text-black"
                : "bg-[#2a2a2a] text-[#F0F0F0] hover:bg-[#3a3a3a]"
            }`}
          >
            ניגודיות גבוהה {prefs.highContrast ? "✓" : ""}
          </button>

          {/* Readable font */}
          <button
            onClick={() => update({ readableFont: !prefs.readableFont })}
            className={`w-full py-2.5 rounded-lg text-sm font-medium mb-4 transition-colors ${
              prefs.readableFont
                ? "bg-[#F5A623] text-black"
                : "bg-[#2a2a2a] text-[#F0F0F0] hover:bg-[#3a3a3a]"
            }`}
          >
            קריאה נוחה {prefs.readableFont ? "✓" : ""}
          </button>

          {/* Reset */}
          <button
            onClick={() => update(DEFAULTS)}
            className="w-full py-2 text-xs text-[#555] hover:text-[#888] transition-colors"
          >
            איפוס הגדרות
          </button>
        </div>
      )}
    </>
  );
}
