"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

const CITIES = ["כל הארץ", "תל אביב", "ירושלים", "חיפה", "באר שבע", "ראשון לציון", "נס ציונה", "פתח תקווה", "אשדוד", "נתניה", "רחובות", "חולון", "בת ים", "בני ברק"];

const CATEGORIES = [
  { label: "רומנים", icon: "📖" },
  { label: "מדע בדיוני", icon: "🚀" },
  { label: "ילדים", icon: "🧸" },
  { label: "היסטוריה", icon: "🏛️" },
  { label: "עסקים", icon: "💼" },
  { label: "בישול", icon: "🍳" },
  { label: "פסיכולוגיה", icon: "🧠" },
  { label: "שירה", icon: "✍️" },
];

const conditionLabel: Record<string, { label: string; color: string }> = {
  new:  { label: "כמו חדש", color: "bg-emerald-100 text-emerald-700" },
  good: { label: "מצב טוב",  color: "bg-amber-100 text-amber-700" },
  worn: { label: "מצב סביר", color: "bg-stone-100 text-stone-600" },
};

type RecentListing = {
  listingId: string;
  bookId: string;
  title: string;
  author: string;
  cover_image: string | null;
  price: number;
  condition: string;
  location: string | null;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("כל הארץ");
  const [recent, setRecent] = useState<RecentListing[]>([]);

  useEffect(() => {
    fetch("/api/listings/recent")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecent(data); })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city !== "כל הארץ") params.set("city", city);
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header showSearch />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-amber-50 to-stone-50 py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              מצא את הספר הבא שלך
            </h1>
            <p className="text-lg text-stone-500 mb-10">
              אלפי ספרים יד שנייה ממוכרים פרטיים בכל רחבי ישראל
            </p>

            {/* Search box */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-md border border-stone-200 p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3">
                <svg className="w-5 h-5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="שם ספר, סופר, ז'אנר..."
                  className="w-full py-3 outline-none text-stone-800 placeholder:text-stone-400 bg-transparent"
                />
              </div>

              <div className="w-px bg-stone-200 hidden md:block" />

              <div className="flex items-center gap-2 px-3 md:min-w-40">
                <svg className="w-5 h-5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full py-3 outline-none text-stone-700 bg-transparent cursor-pointer"
                >
                  {CITIES.map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-colors text-white font-semibold px-8 py-3 rounded-xl">
                חפש
              </button>
            </form>

            <p className="mt-4 text-sm text-stone-400">
              לדוגמה: "הארי פוטר", "עמוס עוז", "מדע בדיוני"
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-stone-800 mb-6">חפש לפי קטגוריה</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map((cat: any) => (
              <button
                key={cat.label}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-sm transition-all group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs text-stone-600 group-hover:text-amber-700 font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent listings */}
        {recent.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">מודעות אחרונות</h2>
              <Link href="/search?q=" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                כל הספרים ←
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recent.map((item: any) => (
                <Link
                  key={item.listingId}
                  href={`/books/${item.bookId}`}
                  className="bg-white rounded-xl border border-stone-200 hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group"
                >
                  <div className="bg-amber-50 aspect-[2/3] flex items-center justify-center overflow-hidden">
                    {item.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-5xl opacity-30">📕</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-stone-900 text-sm leading-snug mb-0.5 line-clamp-2 group-hover:text-amber-700 transition-colors">{item.title}</h3>
                    <p className="text-xs text-stone-500 mb-2 truncate">{item.author}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-amber-700">₪{item.price}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionLabel[item.condition]?.color ?? ""}`}>
                        {conditionLabel[item.condition]?.label}
                      </span>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-stone-400">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="bg-amber-700 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-12">איך זה עובד?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "1", title: "חפש ספר", desc: "חפש לפי שם ספר, סופר או מיקום", icon: "🔍" },
                { step: "2", title: "צור קשר עם המוכר", desc: "שלח הודעה ישירות למוכר", icon: "💬" },
                { step: "3", title: "קנה ואסוף", desc: "הגיעו להסכמה ואסוף את הספר", icon: "🤝" },
              ].map((item: any) => (
                <div key={item.step} className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-amber-100 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
