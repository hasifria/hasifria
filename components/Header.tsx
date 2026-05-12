"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { id: string; name: string | null; phone: string; isSuperUser?: boolean } | null;

function MenuLink({
  href,
  emoji,
  label,
  onClick,
  highlight,
}: {
  href: string;
  emoji: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
        highlight
          ? "bg-[#F5A623]/10 text-[#F5A623] hover:bg-[#F5A623]/20"
          : "text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-[#F0F0F0]"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </Link>
  );
}

export function Header({ showSearch }: { showSearch?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<User | "loading">("loading");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="הספריה" className="h-7 md:h-9 w-auto" />
          </Link>

          {/* Search bar (desktop only) */}
          {showSearch && (
            <form
              onSubmit={handleSearch}
              className="flex-1 hidden md:flex items-center bg-[#1e1e1e] rounded-lg border border-[#2a2a2a] overflow-hidden max-w-xl"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש לפי ספר, סופר..."
                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#F5A623] hover:bg-[#e0941a] transition-colors text-black text-sm font-medium"
              >
                חיפוש
              </button>
            </form>
          )}

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3 mr-auto">
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
                  href="/account"
                  className="text-sm text-[#888] hover:text-[#F5A623] font-medium transition-colors"
                >
                  החשבון שלי
                </Link>
                <Link
                  href="/liked"
                  className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#FF4757] font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
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

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2 mr-auto">
            <Link
              href="/sell"
              className="bg-[#F5A623] hover:bg-[#e0941a] transition-colors text-black text-sm font-bold px-3 py-2 rounded-lg"
            >
              פרסם ספר
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-[#a0a0a0] hover:text-[#F0F0F0] transition-colors"
              aria-label="פתח תפריט"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile hamburger menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" dir="rtl">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />

          {/* Slide-in panel from right */}
          <div className="absolute top-0 right-0 h-full w-72 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="הספריה" className="h-7 w-auto" />
              <button
                onClick={closeMenu}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F0F0F0] transition-colors"
                aria-label="סגור תפריט"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <MenuLink href="/" emoji="🏠" label="דף הבית" onClick={closeMenu} />
              <MenuLink href="/search" emoji="🔍" label="חיפוש" onClick={closeMenu} />
              <MenuLink href="/sell" emoji="📚" label="פרסם ספר" onClick={closeMenu} highlight />

              {user && user !== "loading" && (
                <>
                  <div className="border-t border-[#2a2a2a] my-2" />
                  <MenuLink href="/liked" emoji="❤️" label="אהבתי" onClick={closeMenu} />
                  <MenuLink href="/account" emoji="👤" label="החשבון שלי" onClick={closeMenu} />
                  <MenuLink href={`/seller/${user.phone}`} emoji="🏪" label="החנות שלי" onClick={closeMenu} />
                  {user.isSuperUser && (
                    <MenuLink href="/admin/seo" emoji="🔧" label="ניהול" onClick={closeMenu} />
                  )}
                </>
              )}
            </nav>

            {/* Login / Logout */}
            <div className="px-3 pb-6 pt-4 border-t border-[#2a2a2a]">
              {user === "loading" ? null : user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors text-sm font-medium"
                >
                  <span>🚪</span>
                  <span>יציאה</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors text-sm font-medium"
                >
                  <span>🔑</span>
                  <span>כניסה</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
