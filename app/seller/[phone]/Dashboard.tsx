"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Book = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  genre: string | null;
  cover_image: string | null;
  cover_alt: string | null;
  description: string | null;
  created_at: string;
};

type Listing = {
  id: string;
  book_id: string;
  seller_id: string;
  price: number | null;
  condition: "new" | "good" | "worn";
  status: "available" | "sold";
  created_at: string;
  book: Book;
};

type Seller = {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  created_at: string;
  listings: Listing[];
};

type Modal =
  | { type: "price"; listing: Listing }
  | { type: "delete"; listing: Listing }
  | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const conditionMap = {
  new:  { label: "כמו חדש",  color: "bg-emerald-900/40 text-emerald-400" },
  good: { label: "מצב טוב",  color: "bg-amber-900/40 text-amber-400" },
  worn: { label: "מצב סביר", color: "bg-[#2a2a2a] text-[#888]" },
};

// ─── Price Modal ──────────────────────────────────────────────────────────────

function PriceModal({
  listing,
  onSave,
  onClose,
  busy,
}: {
  listing: Listing;
  onSave: (price: number | null) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [value, setValue] = useState(listing.price !== null ? String(listing.price) : "");
  const [isFree, setIsFree] = useState(listing.price === null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFree) inputRef.current?.select();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isFree]);

  const parsed = parseFloat(value);
  const valid = isFree || (!isNaN(parsed) && parsed >= 0);

  const handleSave = () => {
    if (!valid) return;
    onSave(isFree ? null : parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-[#F0F0F0] mb-1">שינוי מחיר</h2>
        <p className="text-sm text-[#888] mb-5 line-clamp-1">{listing.book.title}</p>

        <label className="flex items-center justify-between mb-5 cursor-pointer">
          <span className="text-sm font-medium text-[#a0a0a0]">למסירה חינם</span>
          <div
            onClick={() => setIsFree(!isFree)}
            className={`w-10 rounded-full relative transition-colors cursor-pointer ${isFree ? "bg-[#4ECDC4]" : "bg-[#3a3a3a]"}`}
            style={{ height: "22px" }}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFree ? "right-0.5" : "left-0.5"}`} />
          </div>
        </label>

        {!isFree && (
          <>
            <label className="block text-sm font-medium text-[#a0a0a0] mb-2">מחיר חדש</label>
            <div className="flex items-center border-2 border-[#2a2a2a] rounded-xl overflow-hidden focus-within:border-[#F5A623] transition-colors">
              <span className="px-3 py-3 bg-[#141414] text-[#555] font-bold border-l border-[#2a2a2a] text-sm">₪</span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && valid) handleSave(); }}
                className="flex-1 px-4 py-3 text-lg font-bold text-[#F0F0F0] outline-none bg-[#1e1e1e]"
                dir="ltr"
                autoFocus={!isFree}
              />
            </div>
            {listing.price !== null && (
              <p className="text-xs text-[#555] mt-1.5">מחיר נוכחי: ₪{listing.price}</p>
            )}
          </>
        )}
        {isFree && (
          <div className="text-center py-3 text-[#4ECDC4] font-bold text-lg">למסירה חינם</div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#888] text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={!valid || busy}
            className="flex-1 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e0941a] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold transition-colors"
          >
            {busy ? "שומר..." : "שמור מחיר"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  listing,
  onConfirm,
  onClose,
  busy,
}: {
  listing: Listing;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#F0F0F0] text-center mb-1">מחיקת מודעה</h2>
        <p className="text-sm text-[#888] text-center mb-1">האם למחוק את המודעה עבור</p>
        <p className="text-sm font-semibold text-[#F0F0F0] text-center mb-5 line-clamp-2">&ldquo;{listing.book.title}&rdquo;?</p>
        <p className="text-xs text-[#555] text-center mb-5">פעולה זו אינה הפיכה</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#888] text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {busy ? "מוחק..." : "כן, מחק"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  isOwner,
  isBusy,
  onPriceClick,
  onMarkSold,
  onMarkAvailable,
  onDeleteClick,
}: {
  listing: Listing;
  isOwner: boolean;
  isBusy: boolean;
  onPriceClick: () => void;
  onMarkSold: () => void;
  onMarkAvailable: () => void;
  onDeleteClick: () => void;
}) {
  const isSold = listing.status === "sold";

  return (
    <div className={`bg-[#1e1e1e] rounded-2xl border overflow-hidden transition-all ${isSold ? "border-[#2a2a2a] opacity-50" : "border-[#2a2a2a]"}`}>
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <div className="shrink-0">
          {listing.book.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.book.cover_image}
              alt={listing.book.cover_alt || `${listing.book.title} מאת ${listing.book.author} — ספר יד שנייה`}
              className="w-16 h-24 object-cover rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-16 h-24 bg-[#2a2a2a] rounded-lg flex items-center justify-center border border-[#3a3a3a]">
              <span className="text-2xl opacity-40">📕</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/books/${listing.book_id}`}
            className="font-semibold text-[#F0F0F0] hover:text-[#F5A623] transition-colors line-clamp-2 leading-snug block"
          >
            {listing.book.title}
          </Link>
          <p className="text-sm text-[#888] mt-0.5 truncate">{listing.book.author}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionMap[listing.condition].color}`}>
              {conditionMap[listing.condition].label}
            </span>
            {isSold && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#2a2a2a] text-[#555] border border-[#3a3a3a]">
                נמכר
              </span>
            )}
          </div>

          <p className="mt-2 text-lg font-bold text-[#F5A623]">
            {listing.price !== null ? `₪${listing.price}` : "חינם"}
          </p>
        </div>
      </div>

      {/* Action bar — sold */}
      {isOwner && isSold && (
        <div className="border-t border-[#2a2a2a] px-3 py-2.5 flex items-center bg-[#141414]">
          <button
            onClick={onMarkAvailable}
            disabled={isBusy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-[#1e1e1e] border border-[#2a2a2a] text-emerald-400 hover:border-emerald-700 hover:bg-emerald-900/20 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isBusy ? "..." : "החזר למכירה"}
          </button>
        </div>
      )}

      {/* Action bar — available */}
      {isOwner && !isSold && (
        <div className="border-t border-[#2a2a2a] px-3 py-2.5 flex items-center gap-2 bg-[#141414]">
          <button
            onClick={onPriceClick}
            disabled={isBusy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:border-[#F5A623]/50 hover:text-[#F5A623] disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            שנה מחיר
          </button>

          <button
            onClick={onMarkSold}
            disabled={isBusy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:border-[#3a3a3a] hover:text-[#F0F0F0] disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isBusy ? "..." : "סמן כנמכר"}
          </button>

          <button
            onClick={onDeleteClick}
            disabled={isBusy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-red-500 hover:bg-red-900/20 hover:text-red-400 disabled:opacity-50 transition-colors mr-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            מחק
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ seller, isOwner }: { seller: Seller; isOwner: boolean }) {
  const [listings, setListings] = useState<Listing[]>(seller.listings);
  const [modal, setModal] = useState<Modal>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const available = listings.filter((l: any) => l.status === "available");
  const sold = listings.filter((l: any) => l.status === "sold");

  async function updateListing(id: string, patch: { price?: number | null; status?: "available" | "sold" }) {
    setBusyId(id);
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setListings((prev) =>
        prev.map((l: any) => (l.id === id ? { ...l, ...updated } : l))
      );
    }
    setBusyId(null);
    setModal(null);
  }

  async function deleteListing(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) setListings((prev) => prev.filter((l: any) => l.id !== id));
    setBusyId(null);
    setModal(null);
  }

  const modalListing = modal ? listings.find((l: any) => l.id === modal.listing.id) ?? modal.listing : null;

  const sellerPageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/seller/${seller.phone}`
    : `/seller/${seller.phone}`;

  return (
    <main className="flex-1">
      {/* Modals */}
      {modal?.type === "price" && modalListing && (
        <PriceModal
          listing={modalListing}
          onSave={(price) => updateListing(modalListing.id, { price })}
          onClose={() => setModal(null)}
          busy={busyId === modalListing.id}
        />
      )}
      {modal?.type === "delete" && modalListing && (
        <DeleteModal
          listing={modalListing}
          onConfirm={() => deleteListing(modalListing.id)}
          onClose={() => setModal(null)}
          busy={busyId === modalListing.id}
        />
      )}

      {/* Seller profile banner */}
      <div className="bg-[#141414] border-b border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-[#F5A623]/10 flex items-center justify-center text-2xl font-bold text-[#F5A623] shrink-0">
              {(seller.name ?? seller.phone).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#F0F0F0] truncate">
                {seller.name ?? seller.phone}
              </h1>
              {(seller.address ?? seller.city) && (
                <p className="text-[#888] text-sm mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span>{seller.address ?? seller.city}</span>
                </p>
              )}
              <p className="text-[#555] text-sm mt-1">
                {available.length} ספרים למכירה
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <ShareButton title={`${seller.name ?? seller.phone} — הספרייה`} url={sellerPageUrl} />
              {isOwner && (
                <Link
                  href="/sell"
                  className="bg-[#F5A623] hover:bg-[#e0941a] transition-colors text-black text-sm font-bold px-4 py-2 rounded-xl"
                >
                  + הוסף ספר
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-20 text-[#555]">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-xl font-semibold text-[#888] mb-2">
              {isOwner ? "עדיין לא פרסמת ספרים" : "אין ספרים למכירה כרגע"}
            </p>
            {isOwner && (
              <Link
                href="/sell"
                className="mt-4 inline-block bg-[#F5A623] hover:bg-[#e0941a] text-black font-bold px-6 py-3 rounded-xl transition-colors"
              >
                פרסם את הספר הראשון שלך
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {available.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-[#F0F0F0] mb-4">
                  למכירה ({available.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {available.map((l: any) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      isOwner={isOwner}
                      isBusy={busyId === l.id}
                      onPriceClick={() => setModal({ type: "price", listing: l })}
                      onMarkSold={() => updateListing(l.id, { status: "sold" })}
                      onMarkAvailable={() => {}}
                      onDeleteClick={() => setModal({ type: "delete", listing: l })}
                    />
                  ))}
                </div>
              </section>
            )}

            {sold.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-[#555] mb-4">
                  נמכרו ({sold.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sold.map((l: any) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      isOwner={isOwner}
                      isBusy={busyId === l.id}
                      onPriceClick={() => {}}
                      onMarkSold={() => {}}
                      onMarkAvailable={() => updateListing(l.id, { status: "available" })}
                      onDeleteClick={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
