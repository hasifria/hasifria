import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";
import LikeButton from "@/components/LikeButton";

const conditionMap = {
  new:  { label: "כמו חדש",  color: "bg-emerald-900/40 text-emerald-400" },
  good: { label: "מצב טוב",  color: "bg-amber-900/40 text-amber-400" },
  worn: { label: "מצב סביר", color: "bg-[#2a2a2a] text-[#888]" },
};

type Props = { params: Promise<{ name: string }> };

export default async function AuthorPage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const books = await prisma.book.findMany({
    where: { author: { contains: decoded, mode: "insensitive" } },
    include: {
      listings: {
        where: { status: "available" },
        include: { seller: { select: { name: true, phone: true, address: true, city: true } } },
        orderBy: { price: "asc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (books.length === 0) notFound();

  const authorName = books[0].author;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allListings = (books as any[]).flatMap((book: any) =>
    book.listings.map((listing: any) => ({
      listingId: listing.id,
      bookId: book.id,
      title: book.title,
      cover_image: book.cover_image,
      price: listing.price !== null ? Number(listing.price) : null,
      condition: listing.condition,
      sellerName: listing.seller.name ?? listing.seller.phone,
      sellerPhone: listing.seller.phone,
      location: listing.seller.address ?? listing.seller.city ?? null,
    }))
  );

  const booksWithListings = (books as any[]).filter((b: any) => b.listings.length > 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1">
        {/* Author header */}
        <div className="bg-[#141414] border-b border-[#2a2a2a]">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <nav className="text-sm text-[#555] flex items-center gap-2 mb-5">
              <Link href="/" className="hover:text-[#F5A623] transition-colors">דף הבית</Link>
              <span>/</span>
              <span className="text-[#888]">סופרים</span>
              <span>/</span>
              <span className="text-[#F0F0F0]">{authorName}</span>
            </nav>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center text-3xl font-bold text-[#F5A623] shrink-0">
                {authorName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#F0F0F0]">{authorName}</h1>
                <p className="text-[#888] mt-1">
                  {books.length} {books.length === 1 ? "כותר" : "כותרים"} ·{" "}
                  {allListings.length} {allListings.length === 1 ? "מודעה" : "מודעות"} זמינות
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {allListings.length === 0 ? (
            <div className="text-center py-20 text-[#555]">
              <p className="text-5xl mb-4">📚</p>
              <p className="text-xl font-semibold text-[#888] mb-2">אין מודעות זמינות</p>
              <p className="text-sm">אין כרגע ספרים של {authorName} למכירה</p>
              <Link
                href="/sell"
                className="mt-6 inline-block bg-[#F5A623] hover:bg-[#e0941a] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                פרסם ספר של {authorName}
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {booksWithListings.map((book: any) => (
                <div key={book.id}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a]">
                      {book.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl opacity-40">📕</span>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/books/${book.id}`}
                        className="text-lg font-bold text-[#F0F0F0] hover:text-[#F5A623] transition-colors"
                      >
                        {book.title}
                      </Link>
                      <p className="text-sm text-[#888] mt-0.5">
                        {book.listings.length} {book.listings.length === 1 ? "מוכר" : "מוכרים"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {book.listings.map((listing: any) => (
                      <div key={listing.id} className="relative bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-4 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-[#F5A623]/10 flex items-center justify-center text-xs font-bold text-[#F5A623] shrink-0">
                              {(listing.seller.name ?? listing.seller.phone).charAt(0)}
                            </div>
                            <Link
                              href={`/seller/${listing.seller.phone}`}
                              className="text-sm font-medium text-[#F0F0F0] hover:text-[#F5A623] transition-colors truncate"
                            >
                              {listing.seller.name ?? listing.seller.phone}
                            </Link>
                          </div>
                          {(listing.seller.address ?? listing.seller.city) && (
                            <p className="text-xs text-[#555] mb-2 flex items-center gap-1">
                              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {listing.seller.address ?? listing.seller.city}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#F5A623]">
                              {listing.price !== null ? `₪${Number(listing.price)}` : "חינם"}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionMap[listing.condition as keyof typeof conditionMap].color}`}>
                              {conditionMap[listing.condition as keyof typeof conditionMap].label}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <LikeButton listingId={listing.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
