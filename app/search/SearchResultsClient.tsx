"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { titleToSlug } from "@/lib/slug";

type SearchResult = {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
  cover_alt: string | null;
  minPrice: number | null;
  listingId: string;
};

export default function SearchResultsClient({
  initialResults,
  initialHasMore,
  total: initialTotal,
  q,
  city,
}: {
  initialResults: SearchResult[];
  initialHasMore: boolean;
  total: number;
  q: string;
  city: string;
}) {
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const uniqueAuthors = q
    ? [...new Set(results.map((r) => r.author))].filter((a) =>
        a.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ q, city, page: String(nextPage), limit: "12" });
    fetch(`/api/search?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setResults((prev) => [...prev, ...(data.results ?? [])]);
        setHasMore(data.hasMore ?? false);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, page, q, city]);

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

  if (results.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-6xl mb-5">😕</p>
        <h2 className="text-2xl font-bold text-[#F0F0F0] mb-2">לא נמצאו תוצאות</h2>
        <p className="text-[#555]">
          {q ? `לא נמצאו ספרים עבור "${q}"` : ""}
          {q && city ? " " : ""}
          {city ? `ב${city}` : ""}
        </p>
        <Link href="/sell" className="mt-6 inline-block bg-[#F5A623] hover:bg-[#e0941a] text-black font-medium px-6 py-3 rounded-xl transition-colors text-sm">
          פרסם ספר
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-baseline gap-3 mb-8">
        <h1 className="text-xl font-bold text-[#F0F0F0]">
          {initialTotal} {initialTotal === 1 ? "ספר נמצא" : "ספרים נמצאו"}
        </h1>
        {q && <span className="text-[#555] text-sm">עבור &ldquo;{q}&rdquo;</span>}
        {city && <span className="text-[#555] text-sm">ב{city}</span>}
      </div>

      {/* Authors */}
      {uniqueAuthors.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">סופרים</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueAuthors.map((author) => (
              <Link
                key={author}
                href={`/author/${encodeURIComponent(author)}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#F5A623]/50 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-[#F5A623]/10 flex items-center justify-center text-sm font-bold text-[#F5A623]">
                  {author.charAt(0)}
                </div>
                <span className="text-sm font-medium text-[#F0F0F0] group-hover:text-[#F5A623] transition-colors">{author}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Books grid */}
      <div>
        {uniqueAuthors.length > 0 && (
          <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">ספרים</h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((book) => (
            <div
              key={book.id}
              className="relative bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] hover:border-[#F5A623]/40 transition-all overflow-hidden group"
            >
              <Link
                href={`/books/${encodeURIComponent(titleToSlug(book.title))}`}
                className="absolute inset-0 z-0 rounded-2xl"
                aria-label={book.title}
              />
              <div className="aspect-[2/3] bg-[#2a2a2a] flex items-center justify-center overflow-hidden pointer-events-none">
                {book.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_image}
                    alt={book.cover_alt || `${book.title} מאת ${book.author} — ספר יד שניה`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-5xl opacity-20">📕</span>
                )}
              </div>
              <div className="p-3 relative">
                <h3 className="font-semibold text-[#F0F0F0] text-sm leading-snug line-clamp-2 mb-0.5">
                  {book.title}
                </h3>
                <Link
                  href={`/author/${encodeURIComponent(book.author)}`}
                  className="relative z-10 text-xs text-[#4ECDC4] hover:underline truncate block mb-2"
                >
                  {book.author}
                </Link>
                {book.minPrice !== null ? (
                  <p className="text-xs text-[#555]">
                    מחיר החל מ-<span className="font-bold text-[#F5A623] text-sm">₪{book.minPrice}</span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-[#4ECDC4]">חינם</p>
                )}
              </div>
              <div className="absolute top-2 left-2 z-10">
                <LikeButton listingId={book.listingId} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isLoadingMore && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-icon.png" alt="" width={32} height={32} className="animate-pulse opacity-60" />
        )}
        {!isLoadingMore && !hasMore && (
          <p className="text-[#555] text-sm">אין עוד ספרים להצגה</p>
        )}
      </div>
    </>
  );
}
