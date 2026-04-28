import Link from "next/link";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/db";
import CityAutocomplete from "@/components/CityAutocomplete";

type Props = { searchParams: Promise<{ q?: string; city?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", city = "" } = await searchParams;

  const trimmedQ = q.trim();
  const cityFilter = !!(city && city !== "כל הארץ" && city.trim());
  const hasQuery = !!(trimmedQ || cityFilter);

  const cityWhere = cityFilter
    ? {
        seller: {
          OR: [
            { address: { contains: city.trim(), mode: "insensitive" as const } },
            { city:    { contains: city.trim(), mode: "insensitive" as const } },
          ],
        },
      }
    : {};

  const books = hasQuery
    ? await prisma.book.findMany({
        where: {
          ...(trimmedQ
            ? {
                OR: [
                  { title:  { contains: trimmedQ, mode: "insensitive" } },
                  { author: { contains: trimmedQ, mode: "insensitive" } },
                ],
              }
            : {}),
          listings: { some: { status: "available", ...cityWhere } },
        },
        include: {
          listings: {
            where: { status: "available", ...cityWhere },
            orderBy: { price: "asc" },
            select: { id: true, price: true },
            take: 1,
          },
        },
        orderBy: { created_at: "desc" },
        take: 60,
      })
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (books as any[])
    .filter((b: any) => b.listings.length > 0)
    .map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_image: b.cover_image,
      minPrice: b.listings[0].price !== null ? Number(b.listings[0].price) : null,
      listingId: b.listings[0].id,
    }));

  const uniqueAuthors = trimmedQ
    ? [...new Set(results.map((r: any) => r.author as string))].filter((a) =>
        a.toLowerCase().includes(trimmedQ.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />

      {/* Sticky filter bar */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form method="get" action="/search" className="flex gap-2 flex-col sm:flex-row">
            {/* Text search */}
            <div className="flex-1 flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 focus-within:border-[#F5A623] transition">
              <svg className="w-4 h-4 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="שם ספר, סופר..."
                autoComplete="off"
                className="flex-1 py-2 bg-transparent text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
              />
            </div>

            {/* Dynamic city autocomplete */}
            <CityAutocomplete defaultValue={city} name="city" />

            <button
              type="submit"
              className="px-6 py-2 bg-[#F5A623] hover:bg-[#e0941a] text-black text-sm font-semibold rounded-xl transition-colors"
            >
              חפש
            </button>
          </form>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {!hasQuery ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-5">📚</p>
              <h2 className="text-2xl font-bold text-[#F0F0F0] mb-2">חפש ספר</h2>
              <p className="text-[#555]">הזן שם ספר, שם סופר, או בחר עיר כדי להתחיל</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-5">😕</p>
              <h2 className="text-2xl font-bold text-[#F0F0F0] mb-2">לא נמצאו תוצאות</h2>
              <p className="text-[#555]">
                {trimmedQ ? `לא נמצאו ספרים עבור "${trimmedQ}"` : ""}
                {trimmedQ && cityFilter ? " " : ""}
                {cityFilter ? `ב${city}` : ""}
              </p>
              <Link href="/sell" className="mt-6 inline-block bg-[#F5A623] hover:bg-[#e0941a] text-black font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                פרסם ספר
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-8">
                <h1 className="text-xl font-bold text-[#F0F0F0]">
                  {results.length} {results.length === 1 ? "ספר נמצא" : "ספרים נמצאו"}
                </h1>
                {trimmedQ && (
                  <span className="text-[#555] text-sm">עבור &ldquo;{trimmedQ}&rdquo;</span>
                )}
                {cityFilter && (
                  <span className="text-[#555] text-sm">ב{city}</span>
                )}
              </div>

              {/* Authors section */}
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

              {/* Books section — no nested <a> tags */}
              <div>
                {uniqueAuthors.length > 0 && (
                  <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">ספרים</h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {results.map((book: any) => (
                    // Use relative+absolute pattern to avoid nested <a> tags (which crash React)
                    <div
                      key={book.id}
                      className="relative bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] hover:border-[#F5A623]/40 transition-all overflow-hidden group"
                    >
                      {/* Full-card link (sits behind everything) */}
                      <Link
                        href={`/books/${book.id}`}
                        className="absolute inset-0 z-0 rounded-2xl"
                        aria-label={book.title}
                      />

                      <div className="aspect-[2/3] bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
                        {book.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={book.cover_image}
                            alt={book.title}
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
                        {/* Author link sits above the card link via z-10 */}
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
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
