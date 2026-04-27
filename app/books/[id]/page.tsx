import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";

const conditionMap = {
  new:  { label: "כמו חדש",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  good: { label: "מצב טוב",  color: "bg-amber-100 text-amber-700 border-amber-200" },
  worn: { label: "מצב סביר", color: "bg-stone-100 text-stone-600 border-stone-200" },
};

function whatsappLink(phone: string, bookTitle: string) {
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "972");
  const text = encodeURIComponent(`היי, ראיתי את המודעה שלך על הספר "${bookTitle}" באתר הספרייה. האם הוא עדיין זמין?`);
  return `https://wa.me/${normalized}?text=${text}`;
}

type Props = { params: Promise<{ id: string }> };

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

  const lowestPrice = book.listings[0]?.price ?? null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-stone-50">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="text-sm text-stone-400 flex items-center gap-2">
            <Link href="/" className="hover:text-amber-600 transition-colors">דף הבית</Link>
            <span>/</span>
            <span className="text-stone-600">{book.title}</span>
          </nav>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Right column — book info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col sm:flex-row gap-6">
                {/* Cover */}
                <div className="shrink-0 w-40 mx-auto sm:mx-0">
                  {book.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-40 h-56 object-cover rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-40 h-56 bg-amber-50 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 border border-amber-100">
                      <span className="text-5xl">📕</span>
                      <span className="text-xs text-stone-400">אין תמונה</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-stone-900 leading-tight mb-1">{book.title}</h1>
                  <p className="text-lg text-stone-500 mb-3">{book.author}</p>

                  {book.genre && (
                    <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
                      {book.genre}
                    </span>
                  )}

                  {book.isbn && (
                    <p className="text-xs text-stone-400 mb-4">ISBN: {book.isbn}</p>
                  )}

                  {book.description && (
                    <p className="text-stone-600 leading-relaxed text-sm">{book.description}</p>
                  )}

                  {lowestPrice !== null && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <p className="text-xs text-stone-400 mb-1">מחיר החל מ</p>
                      <p className="text-3xl font-bold text-amber-700">₪{Number(lowestPrice)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sellers */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <h2 className="text-lg font-bold text-stone-800 mb-5">
                  מוכרים ({book.listings.length})
                </h2>

                {book.listings.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <p className="text-4xl mb-3">😔</p>
                    <p className="font-medium">אין מוכרים כרגע לספר זה</p>
                    <p className="text-sm mt-1">נסה שוב מאוחר יותר</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {book.listings.map((listing: any) => (
                      <div key={listing.id} className="py-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-lg font-bold text-amber-700">
                          {(listing.seller.name ?? listing.seller.phone).charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900">{listing.seller.name ?? listing.seller.phone}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-stone-400">
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

                        {/* Price + CTA */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xl font-bold text-amber-700">₪{Number(listing.price)}</span>
                          <a
                            href={whatsappLink(listing.seller.phone, book.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg"
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
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <span>💡</span> איך לקנות בבטחה?
                </h3>
                <ul className="text-sm text-amber-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">✓</span>
                    <span>פגשו את המוכר במקום ציבורי</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">✓</span>
                    <span>בדקו את הספר לפני התשלום</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">✓</span>
                    <span>שמרו את שיחת הוואטסאפ</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h3 className="font-bold text-stone-800 mb-3">יש לכם את הספר הזה?</h3>
                <p className="text-sm text-stone-500 mb-4">פרסמו מודעה בחינם ומכרו אותו</p>
                <Link
                  href={`/sell?bookId=${book.id}`}
                  className="block w-full text-center bg-amber-600 hover:bg-amber-700 transition-colors text-white font-medium py-2.5 rounded-xl text-sm"
                >
                  פרסם מודעה
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-sm">
        <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
      </footer>
    </div>
  );
}
