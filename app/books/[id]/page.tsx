import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";
import ShareButton from "@/components/ShareButton";
import LikeButton from "@/components/LikeButton";
import { getSeoTemplates, fillTemplate } from "@/lib/seo";

const conditionMap = {
  new:  { label: "כמו חדש",  color: "bg-emerald-900/40 text-emerald-400 border-emerald-800" },
  good: { label: "מצב טוב",  color: "bg-amber-900/40 text-amber-400 border-amber-800" },
  worn: { label: "מצב סביר", color: "bg-[#2a2a2a] text-[#888] border-[#3a3a3a]" },
};

function whatsappLink(phone: string, bookTitle: string) {
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "972");
  const text = encodeURIComponent(`היי, ראיתי את המודעה שלך על הספר "${bookTitle}" באתר הספרייה. האם הוא עדיין זמין?`);
  return `https://wa.me/${normalized}?text=${text}`;
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      title: true,
      author: true,
      cover_image: true,
      listings: {
        where: { status: "available" },
        select: { price: true, seller: { select: { city: true, address: true } } },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
  });
  if (!book) return { title: "ספר לא נמצא — הספרייה" };

  const seo = await getSeoTemplates("book");
  const listing = book.listings[0];
  const price = listing?.price !== null && listing?.price !== undefined
    ? String(Number(listing.price))
    : "מחיר חינם";
  const city = listing?.seller?.city
    ?? listing?.seller?.address?.split(/[,،\-]/)[0]?.trim()
    ?? "ישראל";

  const title = fillTemplate(seo.title_template, { title: book.title, author: book.author });
  const description = fillTemplate(seo.description_template, { title: book.title, author: book.author, price, city });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [seo.og_image || book.cover_image || "/hasifria_logo.jpg"],
      url: `https://hasifria-roan.vercel.app/books/${id}`,
    },
  };
}

export default async function BookPage({ params }: Props) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      listings: {
        where: { status: "available" },
        include: { seller: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!book) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowestPrice = (book as any).listings[0]?.price ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="text-sm text-[#555] flex items-center gap-2">
            <Link href="/" className="hover:text-[#F5A623] transition-colors">דף הבית</Link>
            <span>/</span>
            <Link href={`/author/${encodeURIComponent(book.author)}`} className="hover:text-[#4ECDC4] transition-colors">{book.author}</Link>
            <span>/</span>
            <span className="text-[#888]">{book.title}</span>
          </nav>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Right column — book info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-6 flex flex-col sm:flex-row gap-6">
                {/* Cover */}
                <div className="shrink-0 w-40 mx-auto sm:mx-0">
                  {book.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_image}
                      alt={book.cover_alt || `${book.title} מאת ${book.author} — ספר יד שנייה`}
                      className="w-40 h-56 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="w-40 h-56 bg-[#2a2a2a] rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 border border-[#3a3a3a]">
                      <span className="text-5xl">📕</span>
                      <span className="text-xs text-[#555]">אין תמונה</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-[#F0F0F0] leading-tight">{book.title}</h1>
                    <ShareButton title={book.title} />
                  </div>
                  <Link
                    href={`/author/${encodeURIComponent(book.author)}`}
                    className="text-lg text-[#4ECDC4] hover:underline mb-3 inline-block"
                  >
                    {book.author}
                  </Link>

                  {book.genre && (
                    <span className="inline-block bg-[#F5A623]/10 text-[#F5A623] text-xs font-medium px-3 py-1 rounded-full mb-4 block w-fit">
                      {book.genre}
                    </span>
                  )}

                  {book.isbn && (
                    <p className="text-xs text-[#555] mb-4">ISBN: {book.isbn}</p>
                  )}

                  {book.description && (
                    <p className="text-[#a0a0a0] leading-relaxed text-sm">{book.description}</p>
                  )}

                  {lowestPrice !== null && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <p className="text-xs text-[#555] mb-1">מחיר החל מ</p>
                      <p className="text-3xl font-bold text-[#F5A623]">₪{Number(lowestPrice)}</p>
                    </div>
                  )}
                  {lowestPrice === null && (book as any).listings.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <p className="text-2xl font-bold text-[#4ECDC4]">למסירה חינם</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sellers */}
              <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-6">
                <h2 className="text-lg font-bold text-[#F0F0F0] mb-5">
                  מוכרים ({(book as any).listings.length})
                </h2>

                {(book as any).listings.length === 0 ? (
                  <div className="text-center py-12 text-[#555]">
                    <p className="text-4xl mb-3">😔</p>
                    <p className="font-medium text-[#888]">אין מוכרים כרגע לספר זה</p>
                    <p className="text-sm mt-1">נסה שוב מאוחר יותר</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2a2a2a]">
                    {(book as any).listings.map((listing: any) => (
                      <div key={listing.id} className="py-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center shrink-0 text-lg font-bold text-[#F5A623]">
                          {(listing.seller.name ?? listing.seller.phone).charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/seller/${listing.seller.phone}`} className="font-semibold text-[#F0F0F0] hover:text-[#F5A623] transition-colors">
                            {listing.seller.name ?? listing.seller.phone}
                          </Link>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-[#555]">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {listing.seller.address ?? listing.seller.city ?? "לא צוין"}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${conditionMap[listing.condition as keyof typeof conditionMap].color}`}>
                              {conditionMap[listing.condition as keyof typeof conditionMap].label}
                            </span>
                          </div>
                        </div>

                        {/* Price + CTA + Like */}
                        <div className="flex items-center gap-2 shrink-0">
                          <LikeButton listingId={listing.id} />
                          <span className="text-xl font-bold text-[#F5A623]">
                            {listing.price !== null ? `₪${Number(listing.price)}` : "חינם"}
                          </span>
                          <a
                            href={whatsappLink(listing.seller.phone, book.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.127 1.533 5.861L.057 23.386a.75.75 0 0 0 .92.92l5.525-1.476A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.357l-.355-.21-3.68.983.984-3.594-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                            </svg>
                            וואטסאפ
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Left column — sidebar */}
            <div className="space-y-4">
              <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-2xl p-5">
                <h3 className="font-bold text-[#F5A623] mb-2 flex items-center gap-2">
                  <span>💡</span> איך לקנות בבטחה?
                </h3>
                <ul className="text-sm text-[#a0a0a0] space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#4ECDC4]">✓</span>
                    <span>פגשו את המוכר במקום ציבורי</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#4ECDC4]">✓</span>
                    <span>בדקו את הספר לפני התשלום</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#4ECDC4]">✓</span>
                    <span>שמרו את שיחת הוואטסאפ</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-5">
                <h3 className="font-bold text-[#F0F0F0] mb-3">יש לכם את הספר הזה?</h3>
                <p className="text-sm text-[#888] mb-4">פרסמו מודעה בחינם ומכרו אותו</p>
                <Link
                  href={`/sell?bookId=${book.id}`}
                  className="block w-full text-center bg-[#F5A623] hover:bg-[#e0941a] transition-colors text-black font-medium py-2.5 rounded-xl text-sm"
                >
                  פרסם מודעה
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
