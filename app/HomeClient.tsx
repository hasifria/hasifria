"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import LikeButton from "@/components/LikeButton";

const CITIES = ["כל הארץ", "תל אביב", "ירושלים", "חיפה", "באר שבע", "ראשון לציון", "נס ציונה", "פתח תקווה", "אשדוד", "נתניה", "רחובות", "חולון", "בת ים", "בני ברק"];

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "תל אביב": { lat: 32.0853, lon: 34.7818 },
  "ירושלים": { lat: 31.7683, lon: 35.2137 },
  "חיפה": { lat: 32.7940, lon: 34.9896 },
  "באר שבע": { lat: 31.2516, lon: 34.7915 },
  "ראשון לציון": { lat: 31.9730, lon: 34.7925 },
  "נס ציונה": { lat: 31.9296, lon: 34.7996 },
  "פתח תקווה": { lat: 32.0872, lon: 34.8867 },
  "אשדוד": { lat: 31.8044, lon: 34.6552 },
  "נתניה": { lat: 32.3328, lon: 34.8603 },
  "רחובות": { lat: 31.8928, lon: 34.8113 },
  "חולון": { lat: 32.0167, lon: 34.7667 },
  "בת ים": { lat: 32.0167, lon: 34.7500 },
  "בני ברק": { lat: 32.0887, lon: 34.8338 },
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
  price: number | null;
  condition: string;
  location: string | null;
};

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("כל הארץ");
  const [recent, setRecent] = useState<RecentListing[]>([]);
  const [geoCity, setGeoCity] = useState<string | null>(null);

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
          }
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const cityParam = city !== "כל הארץ" ? `?city=${encodeURIComponent(city)}` : "";
    fetch(`/api/listings/recent${cityParam}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecent(data); })
      .catch(() => {});
  }, [city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city !== "כל הארץ") params.set("city", city);
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
              מצא את הספר הבא שלך
            </h1>
            <p className="text-lg text-[#888] mb-10">
              ספרים יד שנייה ממוכרים פרטיים בכל רחבי ישראל
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
              <div className="flex items-center gap-2 px-3 md:min-w-40">
                <svg className="w-5 h-5 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full py-3 outline-none text-[#F0F0F0] bg-transparent cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="bg-[#1e1e1e] text-[#F0F0F0]">{c}</option>
                  ))}
                </select>
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
              {city !== "כל הארץ" ? `ספרים ב${city}` : "מודעות אחרונות"}
            </h2>
            <Link href="/search?q=" className="text-sm text-[#F5A623] hover:text-[#e0941a] font-medium">
              כל הספרים ←
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-16 text-[#555]">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-sm">אין מודעות להצגה כרגע</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recent.map((item) => (
                <div key={item.listingId} className="relative group">
                  <Link
                    href={`/books/${item.bookId}`}
                    className="block bg-[#1e1e1e] rounded-xl border border-[#2a2a2a] hover:border-[#F5A623]/40 transition-all overflow-hidden"
                  >
                    <div className="bg-[#2a2a2a] aspect-[2/3] flex items-center justify-center overflow-hidden">
                      {item.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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

      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
