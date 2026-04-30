"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = { id: string; name: string | null; phone: string; isSuperUser?: boolean } | null;

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
    <header className="bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="הספריה"
            className="h-7 md:h-9 w-auto"
          />
        </Link>

        {/* Search bar */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex items-center bg-[#1e1e1e] rounded-lg border border-[#2a2a2a] overflow-hidden max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש לפי ספר, סופר..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
            />
            <button type="submit" className="px-4 py-2 bg-[#F5A623] hover:bg-[#e0941a] transition-colors text-black text-sm font-medium">
              חיפוש
            </button>
          </form>
        )}

        {/* Nav */}
        <nav className="flex items-center gap-3 mr-auto">
          {user === "loading" ? (
            <div className="w-20 h-8 bg-[#2a2a2a] rounded-lg animate-pulse" />
          ) : user ? (
            <>
              {user.isSuperUser && (
                <Link
                  href="/admin/seo"
                  className="text-sm text-[#888] hover:text-[#F5A623] font-medium transition-colors"
                >
                  ניהול
                </Link>
              )}
              <Link
                href="/liked"
                className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#FF4757] font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                שמורים
              </Link>
              <Link
                href={`/seller/${user.phone}`}
                className="text-sm text-[#a0a0a0] hover:text-[#F5A623] font-medium transition-colors"
              >
                החנות שלי
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-sm text-[#888] hover:text-[#F0F0F0] transition-colors">
              כניסה
            </Link>
          )}
          <Link
            href="/sell"
            className="bg-[#F5A623] hover:bg-[#e0941a] transition-colors text-black text-sm font-bold px-4 py-2 rounded-lg"
          >
            פרסם ספר
          </Link>
        </nav>
      </div>
    </header>
  );
}
