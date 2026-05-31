"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ISRAELI_CITIES = [
  "אבו גוש","אבן יהודה","אופקים","אור יהודה","אור עקיבא","אורנית","אילת","אכסאל","אלעד",
  "אלפי מנשה","אנו","אפרת","אריאל","אשדוד","אשקלון","באר יעקב","באר שבע","בית אל",
  "בית גן","בית דגן","בית שאן","בית שמש","בני ברק","בת ים","ג'לג'וליה","גבעת שמואל",
  "גבעתיים","גדרה","גן יבנה","דאלית אל-כרמל","דימונה","הוד השרון","הרצליה","חדרה",
  "חולון","חיפה","טבריה","טייבה","טירה","טירת כרמל","יבנה","יהוד-מונוסון","יקנעם",
  "ירושלים","כוכב יאיר","כפר סבא","כפר קאסם","כרמיאל","לוד","מגדל העמק","מודיעין",
  "מודיעין עילית","מזכרת בתיה","מעלה אדומים","מעלות-תרשיחא","נהריה","נס ציונה",
  "נצרת","נצרת עילית","נשר","נתיבות","נתניה","עכו","עפולה","ערד","פתח תקווה",
  "צפת","קדימה-צורן","קלנסווה","קריית אונו","קריית אתא","קריית ביאליק","קריית גת",
  "קריית מלאכי","קריית מוצקין","קריית שמונה","קריית ים","ראש העין","ראשון לציון",
  "רהט","רחובות","רמה","רמלה","רמת גן","רמת השרון","רעננה","שדרות","תל אביב",
];

type Pos = { top: number; left: number; width: number };

export default function DesktopSearchBar({ defaultQ = "", defaultCity = "" }: { defaultQ?: string; defaultCity?: string }) {
  const [query, setQuery] = useState(defaultQ);
  const [city, setCity] = useState(defaultCity);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, width: 0 });
  const [dbCities, setDbCities] = useState<string[]>([]);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDbCities(data); })
      .catch(() => {});
  }, []);

  const allCities = [...new Set([...ISRAELI_CITIES, ...dbCities])].sort((a, b) =>
    a.localeCompare(b, "he")
  );

  const filtered = city.trim()
    ? allCities.filter((c) => c.includes(city.trim()))
    : allCities;

  const measurePos = useCallback(() => {
    if (cityRef.current) {
      const rect = cityRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city && city !== "כל הארץ") params.set("city", city);
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <div className="hidden md:block bg-[#141414] border-b border-[#2a2a2a]">
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 focus-within:border-[#F5A623] transition">
            <svg className="w-4 h-4 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="שם ספר, סופר..."
              className="flex-1 py-2 bg-transparent text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
            />
          </div>

          <div ref={cityRef} className="relative">
            <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 focus-within:border-[#F5A623] transition min-w-[140px]">
              <svg className="w-4 h-4 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); measurePos(); setOpen(true); }}
                onFocus={() => { measurePos(); setOpen(true); }}
                onClick={() => { measurePos(); setOpen(true); }}
                placeholder="כל הארץ"
                autoComplete="off"
                className="w-full py-2 bg-transparent text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
              />
              {city && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setCity(""); }}
                  className="text-[#555] hover:text-[#888] shrink-0 text-xs"
                >✕</button>
              )}
            </div>
            {open && filtered.length > 0 && (
              <div
                style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                className="max-h-60 overflow-y-auto bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl"
              >
                {!city.trim() && (
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setCity(""); setOpen(false); }}
                    className="w-full text-right px-4 text-sm text-[#888] hover:bg-[#2a2a2a] border-b border-[#2a2a2a] flex items-center min-h-[40px]">
                    כל הארץ
                  </button>
                )}
                {filtered.slice(0, 40).map((c) => (
                  <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setCity(c); setOpen(false); }}
                    className="w-full text-right px-4 text-sm text-[#F0F0F0] hover:bg-[#2a2a2a] flex items-center min-h-[40px]">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="px-6 py-2 bg-[#F5A623] hover:bg-[#e0941a] text-black text-sm font-semibold rounded-xl transition-colors">
            חפש
          </button>
        </form>
      </div>
    </div>
  );
}
