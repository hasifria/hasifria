"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = { id: string; name: string | null; phone: string } | null;

export function Header({ showSearch }: { showSearch?: boolean }) {
  const [user, setUser] = useState<User | "loading">("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">📚</span>
          <span className="text-xl font-bold text-amber-700 tracking-tight">הספרייה</span>
        </Link>

        {/* Search bar (home page) */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex items-center bg-stone-100 rounded-lg border border-stone-200 overflow-hidden max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש לפי ספר, סופר..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-stone-400"
            />
            <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 transition-colors text-white text-sm font-medium">
              חיפוש
            </button>
          </form>
        )}

        {/* Nav */}
        <nav className="flex items-center gap-3 mr-auto">
          {user === "loading" ? (
            <div className="w-20 h-8 bg-stone-100 rounded-lg animate-pulse" />
          ) : user ? (
            <Link
              href={`/seller/${user.phone}`}
              className="text-sm text-stone-700 hover:text-amber-700 font-medium transition-colors"
            >
              החנות שלי
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              כניסה
            </Link>
          )}
          <Link
            href="/sell"
            className="bg-amber-600 hover:bg-amber-700 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            פרסם ספר
          </Link>
        </nav>
      </div>
    </header>
  );
}
