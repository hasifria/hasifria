"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import LikeButton from "@/components/LikeButton";
import BooksLoadingSpinner from "@/components/BooksLoadingSpinner";
import Footer from "@/components/Footer";
import { titleToSlug } from "@/lib/slug";

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

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "תל אביב":      { lat: 32.0853, lon: 34.7818 },
  "ירושלים":      { lat: 31.7683, lon: 35.2137 },
  "חיפה":         { lat: 32.7940, lon: 34.9896 },
  "באר שבע":      { lat: 31.2516, lon: 34.7915 },
  "ראשון לציון":  { lat: 31.9730, lon: 34.7925 },
  "נס ציונה":     { lat: 31.9296, lon: 34.7996 },
  "פתח תקווה":    { lat: 32.0872, lon: 34.8867 },
  "אשדוד":        { lat: 31.8044, lon: 34.6552 },
  "נתניה":        { lat: 32.3328, lon: 34.8603 },
  "רחובות":       { lat: 31.8928, lon: 34.8113 },
  "חולון":        { lat: 32.0167, lon: 34.7667 },
  "בת ים":        { lat: 32.0167, lon: 34.7500 },
  "בני ברק":      { lat: 32.0887, lon: 34.8338 },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const conditionLabel: Record<string, { label: string; color: string }> = {
  new:  { label: "כמו חדש", color: "bg-emerald-900/40 text-emerald-400" },
  good: { label: "מצב טוב",  color: "bg-amber-900/40 text-amber-400" },
  worn: { label: "מצב סביר", color: "bg-[#2a2a2a] text-[#888]" },
};

type RecentListing = {
  listingId: string;
  bookId: string;
  title: string;
  author: string;
  cover_image: string | null;
  cover_alt: string | null;
  price: number | null;
  condition: string;
  location: string | null;
};

type Pos = { top: number; left: number; width: number };

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, width: 0 });
  const [dbCities, setDbCities] = useState<string[]>([]);
  const [recent, setRecent] = useState<RecentListing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [geoCity, setGeoCity] = useState<string | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const allCities = [...new Set([...ISRAELI_CITIES, ...dbCities])].sort((a, b) =>
    a.localeCompare(b, "he")
  );

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDbCities(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let nearest = "";
          let minDist = Infinity;
          for (const [name, coords] of Object.entries(CITY_COORDS)) {
            const d = haversineKm(latitude, longitude, coords.lat, coords.lon);
            if (d < minDist) { minDist = d; nearest = name; }
          }
          if (minDist < 30 && nearest) {
            setGeoCity(nearest);
            setCity(nearest);
            setCityInput(nearest);
          }
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setRecent([]);
    setPage(1);
    setHasMore(true);
    const params = new URLSearchParams({ page: "1", limit: "12" });
    if (city && city !== "כל הארץ") params.set("city", city);
    fetch(`/api/listings/recent?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setRecent(data.listings ?? []);
        setHasMore(data.hasMore ?? false);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [city]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage), limit: "12" });
    if (city && city !== "כל הארץ") params.set("city", city);
    fetch(`/api/listings/recent?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setRecent((prev) => [...prev, ...(data.listings ?? [])]);
        setHasMore(data.hasMore ?? false);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, page, city]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const measurePos = useCallback(() => {
    if (cityRef.current) {
      const rect = cityRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  const openCityDropdown = useCallback(() => {
    measurePos();
    setCityOpen(true);
  }, [measurePos]);

  const selectCity = (c: string) => {
    setCity(c);
    setCityInput(c);
    setCityOpen(false);
  };

  const filteredCities = cityInput.trim()
    ? allCities.filter((c) => c.includes(cityInput.trim()))
    : allCities;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city && city !== "כל הארץ") params.set("city", city);
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header showSearch />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 px-4 border-b border-[#1a1a1a]">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#F0F0F0] mb-4 leading-tight">
              ספרים יד שניה או למסירה קרוב לביתך
            </h1>
            <p className="text-lg text-[#888] mb-10">
              ממוכרים פרטיים בכל רחבי ישראל
            </p>

            <form onSubmit={handleSearch} className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3">
                <svg className="w-5 h-5 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="שם ספר, סופר..."
                  className="w-full py-3 outline-none text-[#F0F0F0] placeholder:text-[#555] bg-transparent"
                />
              </div>
              <div className="w-px bg-[#2a2a2a] hidden md:block" />

              {/* City free-text input with autocomplete */}
              <div ref={cityRef} className="relative flex items-center gap-2 px-3 md:min-w-44">
                <svg className="w-5 h-5 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => { setCityInput(e.target.value); setCity(e.target.value); openCityDropdown(); }}
                  onFocus={openCityDropdown}
                  onClick={openCityDropdown}
                  placeholder="כל הארץ"
                  autoComplete="off"
                  className="w-full py-3 outline-none text-[#F0F0F0] placeholder:text-[#555] bg-transparent"
                />
                {cityInput && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setCity(""); setCityInput(""); }}
                    className="text-[#555] hover:text-[#888] shrink-0 text-sm"
                  >✕</button>
                )}
                {cityOpen && filteredCities.length > 0 && (
                  <div
                    style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.max(pos.width, 200), zIndex: 9999 }}
                    className="max-h-60 overflow-y-auto bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl"
                  >
                    {!cityInput.trim() && (
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectCity("")}
                        className="w-full text-right px-4 text-sm text-[#888] hover:bg-[#2a2a2a] border-b border-[#2a2a2a] flex items-center min-h-[44px]">
                        כל הארץ
                      </button>
                    )}
                    {filteredCities.slice(0, 50).map((c) => (
                      <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectCity(c)}
                        className="w-full text-right px-4 text-sm text-[#F0F0F0] hover:bg-[#2a2a2a] flex items-center min-h-[44px]">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] transition-colors text-black font-semibold px-8 py-3 rounded-xl">
                חפש
              </button>
            </form>

            {geoCity && (
              <p className="mt-3 text-sm text-[#4ECDC4] flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                הצגת ספרים ב{geoCity} לפי מיקום שלך
              </p>
            )}
          </div>
        </section>

        {/* Recent listings */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#F0F0F0]">
              {city ? `ספרים ב${city}` : "מודעות אחרונות"}
            </h2>
            <Link href="/search?q=" className="text-sm text-[#F5A623] hover:text-[#e0941a] font-medium">
              כל הספרים ←
            </Link>
          </div>

          {isLoading ? (
            <BooksLoadingSpinner />
          ) : recent.length === 0 ? (
            <div className="text-center py-16 text-[#555]">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-sm">אין מודעות להצגה כרגע</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recent.map((item) => (
                <div key={item.listingId} className="relative group">
                  <Link
                    href={`/books/${encodeURIComponent(titleToSlug(item.title))}`}
                    className="block bg-[#1e1e1e] rounded-xl border border-[#2a2a2a] hover:border-[#F5A623]/40 transition-all overflow-hidden"
                  >
                    <div className="bg-[#2a2a2a] aspect-[2/3] flex items-center justify-center overflow-hidden">
                      {item.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.cover_image} alt={item.cover_alt || `${item.title} מאת ${item.author} — ספר יד שניה`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-5xl opacity-20">📕</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-[#F0F0F0] text-sm leading-snug mb-0.5 line-clamp-2">{item.title}</h3>
                      <p className="text-xs text-[#888] mb-2 truncate">{item.author}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#F5A623]">
                          {item.price !== null ? `₪${item.price}` : "חינם"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionLabel[item.condition]?.color ?? ""}`}>
                          {conditionLabel[item.condition]?.label}
                        </span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-[#555]">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="absolute top-2 left-2">
                    <LikeButton listingId={item.listingId} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {!isLoading && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {isLoadingMore && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/logo-icon.png" alt="" width={32} height={32} className="animate-pulse opacity-60" />
              )}
              {!isLoadingMore && !hasMore && recent.length > 0 && (
                <p className="text-[#555] text-sm">אין עוד ספרים להצגה</p>
              )}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-[#1a1a1a] py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[#F0F0F0] mb-12">איך זה עובד?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "1", title: "חפש ספר", desc: "חפש לפי שם ספר, סופר או מיקום", icon: "🔍" },
                { step: "2", title: "צור קשר עם המוכר", desc: "שלח הודעה ישירות למוכר", icon: "💬" },
                { step: "3", title: "קנה ואסוף", desc: "הגיעו להסכמה ואסוף את הספר", icon: "🤝" },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-full flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg text-[#F0F0F0]">{item.title}</h3>
                  <p className="text-[#888] text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
