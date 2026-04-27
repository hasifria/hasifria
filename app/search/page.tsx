import Link from "next/link";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/db";

const CITIES = [
  "כל הארץ", "תל אביב", "ירושלים", "חיפה", "באר שבע",
  "ראשון לציון", "נס ציונה", "פתח תקווה", "אשדוד", "נתניה",
  "רחובות", "חולון", "בת ים", "בני ברק",
];

type Props = { searchParams: Promise<{ q?: string; city?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", city = "כל הארץ" } = await searchParams;

  const trimmedQ = q.trim();
  const cityFilter = !!(city && city !== "כל הארץ");
  const hasQuery = !!(trimmedQ || cityFilter);

  const cityWhere = cityFilter
    ? {
        seller: {
          OR: [
            { address: { contains: city, mode: "insensitive" as const } },
            { city:    { contains: city, mode: "insensitive" as const } },
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
            select: { price: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: 60,
      })
    : [];

  const results = books
    .filter((b: any) => b.listings.length > 0)
    .map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_image: b.cover_image,
      minPrice: Number(b.listings[0].price),
      sellerCount: b.listings.length,
    }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Sticky filter bar */}
      <div className="bg-white border-b border-stone-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form method="get" action="/search" className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition">
              <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="שם ספר, סופר..."
                className="flex-1 py-2 bg-transparent text-sm outline-none placeholder:text-stone-400"
              />
            </div>

            <select
              name="city"
              defaultValue={city}
              className="px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-sm text-stone-700 outline-none focus:border-amber-400 cursor-pointer"
            >
              {CITIES.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              חפש
            </button>
          </form>
        </div>
      </div>

      <main className="flex-1 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {!hasQuery ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-5">📚</p>
              <h2 className="text-2xl font-bold text-stone-700 mb-2">חפש ספר</h2>
              <p className="text-stone-400">הזן שם ספר, שם סופר, או בחר עיר כדי להתחיל</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-6xl mb-5">😕</p>
              <h2 className="text-2xl font-bold text-stone-700 mb-2">לא נמצאו תוצאות</h2>
              <p className="text-stone-400">
                {trimmedQ ? `לא נמצאו ספרים עבור "${trimmedQ}"` : ""}
                {trimmedQ && cityFilter ? " " : ""}
                {cityFilter ? `ב${city}` : ""}
              </p>
              <Link href="/sell" className="mt-6 inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                פרסם ספר
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-6">
                <h1 className="text-xl font-bold text-stone-800">
                  {results.length} {results.length === 1 ? "ספר נמצא" : "ספרים נמצאו"}
                </h1>
                {trimmedQ && (
                  <span className="text-stone-500 text-sm">
                    עבור &ldquo;{trimmedQ}&rdquo;
                  </span>
                )}
                {cityFilter && (
                  <span className="text-stone-400 text-sm">ב{city}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.map((book: any) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    className="bg-white rounded-2xl border border-stone-200 hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group"
                  >
                    {/* Cover */}
                    <div className="aspect-[2/3] bg-amber-50 flex items-center justify-center overflow-hidden">
                      {book.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-5xl opacity-30">📕</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2 mb-0.5 group-hover:text-amber-700 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-stone-500 truncate mb-2">{book.author}</p>

                      <p className="text-xs text-stone-400">
                        מחיר החל מ-<span className="font-bold text-amber-700 text-sm">₪{book.minPrice}</span>
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {book.sellerCount === 1 ? "מוכר 1" : `${book.sellerCount} מוכרים`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
