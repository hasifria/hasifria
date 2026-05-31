import { Header } from "@/components/Header";
import { prisma } from "@/lib/db";
import CityAutocomplete from "@/components/CityAutocomplete";
import Footer from "@/components/Footer";
import SearchResultsClient from "./SearchResultsClient";

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

  const LIMIT = 12;

  const where = hasQuery
    ? {
        ...(trimmedQ
          ? {
              OR: [
                { title:  { contains: trimmedQ, mode: "insensitive" as const } },
                { author: { contains: trimmedQ, mode: "insensitive" as const } },
              ],
            }
          : {}),
        listings: { some: { status: "available" as const, ...cityWhere } },
      }
    : null;

  const [books, total] = where
    ? await Promise.all([
        prisma.book.findMany({
          where,
          include: {
            listings: {
              where: { status: "available", ...cityWhere },
              orderBy: { price: "asc" },
              select: { id: true, price: true },
              take: 1,
            },
          },
          orderBy: { created_at: "desc" },
          take: LIMIT,
        }),
        prisma.book.count({ where }),
      ])
    : [[], 0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialResults = (books as any[])
    .filter((b: any) => b.listings.length > 0)
    .map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_image: b.cover_image,
      cover_alt: b.cover_alt,
      minPrice: b.listings[0].price !== null ? Number(b.listings[0].price) : null,
      listingId: b.listings[0].id,
    }));

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />

      {/* Sticky filter bar */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form method="get" action="/search" className="flex gap-2 flex-col sm:flex-row">
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
            <div className="order-first sm:order-none">
              <CityAutocomplete defaultValue={city} name="city" />
            </div>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-icon.png"
                alt=""
                aria-hidden="true"
                width={80}
                height={80}
                className="mx-auto mb-5"
                style={{ animation: "logo-pulse 1.4s ease-in-out infinite" }}
              />
              <h2 className="text-2xl font-bold text-[#F0F0F0] mb-2">חפש ספר</h2>
              <p className="text-[#555]">הזן שם ספר, שם סופר, או בחר עיר כדי להתחיל</p>
            </div>
          ) : (
            <SearchResultsClient
              initialResults={initialResults}
              initialHasMore={total > LIMIT}
              total={total}
              q={trimmedQ}
              city={city}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
