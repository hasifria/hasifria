import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import LikeButton from "@/components/LikeButton";

const conditionLabel: Record<string, { label: string; color: string }> = {
  new:  { label: "כמו חדש", color: "bg-emerald-900/40 text-emerald-400" },
  good: { label: "מצב טוב",  color: "bg-amber-900/40 text-amber-400" },
  worn: { label: "מצב סביר", color: "bg-[#2a2a2a] text-[#888]" },
};

export default async function LikedPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    redirect("/register?redirect=/liked");
  }

  const likes = await prisma.like.findMany({
    where: { user_id: session.userId },
    include: {
      listing: {
        include: {
          book: { select: { id: true, title: true, author: true, cover_image: true } },
          seller: { select: { name: true, phone: true, address: true, city: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (likes as any[])
    .filter((lk: any) => lk.listing && lk.listing.status === "available")
    .map((lk: any) => ({
      listingId: lk.listing.id,
      bookId: lk.listing.book.id,
      title: lk.listing.book.title,
      author: lk.listing.book.author,
      cover_image: lk.listing.book.cover_image,
      price: lk.listing.price !== null ? Number(lk.listing.price) : null,
      condition: lk.listing.condition,
      sellerName: lk.listing.seller.name ?? lk.listing.seller.phone,
      sellerPhone: lk.listing.seller.phone,
      location: lk.listing.seller.address ?? lk.listing.seller.city ?? null,
    }));

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-8">
            <svg className="w-6 h-6 text-[#FF4757]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-[#F0F0F0]">
              ספרים שמורים
            </h1>
            <span className="text-sm text-[#555] bg-[#1e1e1e] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-[#FF4757]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#FF4757]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#F0F0F0] mb-2">אין ספרים שמורים</h2>
              <p className="text-[#888] text-sm mb-6">לחץ על ❤️ על כל ספר כדי לשמור אותו כאן</p>
              <Link
                href="/"
                className="inline-block bg-[#F5A623] hover:bg-[#e0941a] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                עיין בספרים
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.listingId} className="relative group">
                  <Link
                    href={`/books/${item.bookId}`}
                    className="block bg-[#1e1e1e] rounded-xl border border-[#2a2a2a] hover:border-[#F5A623]/40 transition-all overflow-hidden"
                  >
                    <div className="bg-[#2a2a2a] aspect-[2/3] flex items-center justify-center overflow-hidden">
                      {item.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-5xl opacity-20">📕</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-[#F0F0F0] text-sm leading-snug mb-0.5 line-clamp-2">{item.title}</h3>
                      <Link
                        href={`/author/${encodeURIComponent(item.author)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#4ECDC4] hover:underline truncate block mb-2"
                      >
                        {item.author}
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#F5A623]">
                          {item.price !== null ? `₪${item.price}` : "חינם"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionLabel[item.condition]?.color ?? ""}`}>
                          {conditionLabel[item.condition]?.label}
                        </span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-[#555]">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="absolute top-2 left-2">
                    <LikeButton listingId={item.listingId} />
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
