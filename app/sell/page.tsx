"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Header } from "@/components/Header";
import ImageCropper from "@/components/ImageCropper";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Book = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  genre: string | null;
  cover_image: string | null;
};

type Condition = "new" | "good" | "worn";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: "new", label: "כמו חדש", desc: "לא נפתח או כמעט שלא נקרא" },
  { value: "good", label: "מצב טוב", desc: "נקרא אבל תקין לחלוטין" },
  { value: "worn", label: "מצב סביר", desc: "סימני שימוש קלים" },
];

function looksLikeISBN(q: string) {
  const d = q.replace(/[-\s]/g, "");
  return /^\d{10}$/.test(d) || /^\d{13}$/.test(d);
}

// ─── QR Upload Modal ──────────────────────────────────────────────────────────

function QRUploadModal({
  token,
  smsSent,
  onImageReceived,
  onClose,
}: {
  token: string;
  smsSent: boolean;
  onImageReceived: (imageData: string) => void;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const uploadUrl = `${window.location.origin}/sell/mobile-upload/${token}`;
    import("qrcode").then((mod) => {
      const QRCode = mod.default ?? mod;
      (QRCode as any).toDataURL(uploadUrl, { width: 240, margin: 2 }).then(setQrDataUrl);
    });
  }, [token]);

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/books/cover-poll?token=${token}`);
      const data = await res.json();
      if (data.ready && data.imageData) {
        clearInterval(id);
        onImageReceived(data.imageData);
      }
    }, 2500);
    return () => clearInterval(id);
  }, [token, onImageReceived]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
        <h3 className="font-bold text-stone-900 text-lg mb-1">
          {smsSent ? "קישור נשלח ב-SMS" : "סרוק עם הנייד"}
        </h3>
        <p className="text-stone-500 text-sm mb-4">
          {smsSent
            ? "פתח את הקישור בנייד לצילום עטיפת הספר"
            : "סרוק את הקוד עם הנייד לצילום עטיפת הספר"}
        </p>

        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR" className="w-48 h-48 mx-auto mb-4 rounded-xl border border-stone-100" />
        ) : (
          <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-stone-100 animate-pulse" />
        )}

        <div className="flex items-center justify-center gap-2 text-amber-600 text-sm mb-5">
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          ממתין לצילום מהנייד...
        </div>

        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-sm transition-colors">
          ביטול
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SellPage() {
  const router = useRouter();

  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);

  // Book search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundBook, setFoundBook] = useState<Book | null | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [skipSearch, setSkipSearch] = useState(false);

  // Manual fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");

  // Cover image
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // QR/SMS upload (desktop)
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadSmsSent, setUploadSmsSent] = useState(false);
  const [requestingToken, setRequestingToken] = useState(false);

  // Listing
  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const showManualFields = skipSearch || foundBook === null;
  const isBookResolved = skipSearch || foundBook !== undefined;

  // ── Search ───────────────────────────────────────────────────────────────

  const performSearch = useCallback(async (q: string) => {
    const cleaned = q.trim();
    if (!cleaned) return;
    setSearching(true);
    setFoundBook(undefined);
    setSearchResults([]);
    try {
      if (looksLikeISBN(cleaned)) {
        const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(cleaned.replace(/[-\s]/g, ""))}`);
        const data = await res.json();
        setFoundBook(data ?? null);
      } else {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(cleaned)}`);
        const data: Book[] = await res.json();
        if (data.length === 1) {
          setFoundBook(data[0]);
        } else if (data.length > 1) {
          setSearchResults(data);
        } else {
          setFoundBook(null);
        }
      }
    } catch {
      setFoundBook(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleScan = useCallback((code: string) => {
    setShowScanner(false);
    setSearchQuery(code);
    performSearch(code);
  }, [performSearch]);

  const resetSearch = () => {
    setFoundBook(undefined);
    setSearchResults([]);
    setSearchQuery("");
  };

  // ── Cover image ──────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const requestUploadToken = async (sendSms: boolean) => {
    setRequestingToken(true);
    try {
      const res = await fetch("/api/books/cover-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendSms }),
      });
      const data = await res.json();
      if (data.token) {
        setUploadToken(data.token);
        setUploadSmsSent(sendSms);
        setShowQRModal(true);
      }
    } catch {
      /* ignore */
    } finally {
      setRequestingToken(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!isBookResolved) {
      setFormError("יש לחפש ספר לפני הפרסום");
      return;
    }
    if (showManualFields && !title.trim()) { setFormError("יש להזין שם ספר"); return; }
    if (showManualFields && !author.trim()) { setFormError("יש להזין שם סופר"); return; }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { setFormError("יש להזין מחיר תקין"); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { condition, price };
      if (foundBook) {
        body.bookId = foundBook.id;
      } else {
        body.isbn = searchQuery.replace(/[-\s]/g, "") || null;
        body.title = title.trim();
        body.author = author.trim();
        body.genre = genre.trim() || null;
        if (croppedImage) body.cover_image = croppedImage;
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: { error?: string; bookId?: string } = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        if (res.status === 401) { setFormError("יש להתחבר תחילה כדי לפרסם"); return; }
        setFormError(data.error ?? "שגיאה בפרסום. אנא נסה שוב.");
        return;
      }
      router.push(`/books/${data.bookId}`);
    } catch {
      setFormError("שגיאת תקשורת. אנא נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {rawImage && (
        <ImageCropper
          src={rawImage}
          onConfirm={(url) => { setCroppedImage(url); setRawImage(null); }}
          onCancel={() => setRawImage(null)}
        />
      )}

      {showQRModal && uploadToken && (
        <QRUploadModal
          token={uploadToken}
          smsSent={uploadSmsSent}
          onImageReceived={(imageData) => {
            setCroppedImage(imageData);
            setShowQRModal(false);
            setUploadToken(null);
          }}
          onClose={() => { setShowQRModal(false); setUploadToken(null); }}
        />
      )}

      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-stone-50 py-10 px-4">
          <div className="max-w-lg mx-auto">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-stone-900">פרסום ספר למכירה</h1>
              <p className="text-stone-500 text-sm mt-1">מלא את הפרטים ופרסם בחינם</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── Book Search ──────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <h2 className="font-bold text-stone-800">פרטי הספר</h2>

                {!skipSearch && (
                  <div>
                    {/* Mobile scan button */}
                    {isMobile && foundBook === undefined && searchResults.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="w-full mb-3 flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white font-semibold rounded-xl transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                        </svg>
                        סרוק ברקוד
                      </button>
                    )}

                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      ברקוד ISBN או שם ספר
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setFoundBook(undefined); setSearchResults([]); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), performSearch(searchQuery))}
                        placeholder="9780747532699 או ״הארי פוטר״"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => performSearch(searchQuery)}
                        disabled={searching || !searchQuery.trim()}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
                      >
                        {searching ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                          </svg>
                        ) : "חפש"}
                      </button>
                    </div>

                    {/* Single match */}
                    {foundBook && (
                      <div className="mt-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <span className="text-emerald-600 text-lg">✓</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 text-sm truncate">{foundBook.title}</p>
                          <p className="text-xs text-stone-500">{foundBook.author}</p>
                        </div>
                        <button type="button" onClick={resetSearch} className="text-xs text-stone-400 hover:text-stone-600 shrink-0">שנה</button>
                      </div>
                    )}

                    {/* Multiple matches */}
                    {searchResults.length > 0 && (
                      <div className="mt-3 border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                        <p className="px-3 py-2 text-xs text-stone-400 bg-stone-50">{searchResults.length} תוצאות — בחר ספר:</p>
                        {searchResults.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => { setFoundBook(b); setSearchResults([]); }}
                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-amber-50 transition-colors text-right"
                          >
                            <div className="w-8 h-10 rounded bg-amber-100 overflow-hidden shrink-0">
                              {b.cover_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={b.cover_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="flex items-center justify-center h-full text-lg opacity-40">📕</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="font-medium text-stone-900 text-sm truncate">{b.title}</p>
                              <p className="text-xs text-stone-400 truncate">{b.author}</p>
                            </div>
                          </button>
                        ))}
                        <button type="button" onClick={() => { setSearchResults([]); setFoundBook(null); }} className="w-full px-3 py-2.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors text-right">
                          הספר שלי לא ברשימה — הזן ידנית
                        </button>
                      </div>
                    )}

                    {/* Not found */}
                    {foundBook === null && searchResults.length === 0 && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                        הספר לא נמצא במסד הנתונים — מלא את הפרטים ידנית למטה
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => { setSkipSearch(true); setFoundBook(undefined); setSearchResults([]); }}
                      className="mt-2 text-xs text-stone-400 hover:text-amber-600 transition-colors"
                    >
                      דלג — הזן ידנית
                    </button>
                  </div>
                )}

                {/* Manual fields */}
                {showManualFields && (
                  <div className="space-y-3">
                    {skipSearch && (
                      <button type="button" onClick={() => { setSkipSearch(false); setTitle(""); setAuthor(""); setGenre(""); }} className="text-xs text-stone-400 hover:text-amber-600 transition-colors">
                        ← חזרה לחיפוש
                      </button>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">שם הספר *</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הארי פוטר ואבן החכמים" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm" required={showManualFields} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">סופר *</label>
                      <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ג'יי קיי רולינג" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm" required={showManualFields} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">ז&apos;אנר</label>
                      <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="פנטזיה, מדע בדיוני..." className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm" />
                    </div>
                  </div>
                )}
              </section>

              {/* ── Cover image — new books only ─────────────────────── */}
              {showManualFields && (
                <section className="bg-white rounded-2xl border border-stone-200 p-5">
                  <h2 className="font-bold text-stone-800 mb-4">תמונת עטיפה</h2>

                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                  {!croppedImage ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-28 h-40 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl opacity-30">📷</span>
                        <span className="text-xs text-stone-400">אין תמונה</span>
                      </div>

                      {/* Camera + Gallery (both devices) */}
                      <div className="flex gap-2 flex-wrap justify-center">
                        <button type="button" onClick={() => cameraRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                          צלם
                        </button>
                        <button type="button" onClick={() => galleryRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          גלריה
                        </button>
                      </div>

                      {/* Desktop: QR + SMS options */}
                      {!isMobile && (
                        <div className="w-full border-t border-stone-100 pt-4 flex flex-col gap-2">
                          <p className="text-xs text-stone-400 text-center mb-1">או צלם עם הנייד שלך</p>
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => requestUploadToken(false)}
                              disabled={requestingToken}
                              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              סרוק QR עם הנייד
                            </button>
                            <button
                              type="button"
                              onClick={() => requestUploadToken(true)}
                              disabled={requestingToken}
                              className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              קבל קישור ב-SMS
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-stone-400">אופציונלי — עוזר למצוא את הספר</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={croppedImage} alt="עטיפה" className="w-28 h-40 object-cover rounded-xl shadow-md" />
                      <button type="button" onClick={() => setCroppedImage(null)} className="text-sm text-stone-400 hover:text-red-500 transition-colors">הסר תמונה</button>
                    </div>
                  )}
                </section>
              )}

              {/* ── Condition ────────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-200 p-5">
                <h2 className="font-bold text-stone-800 mb-4">מצב הספר</h2>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITIONS.map((c: any) => (
                    <button key={c.value} type="button" onClick={() => setCondition(c.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${condition === c.value ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300 bg-stone-50"}`}>
                      <span className={`text-sm font-semibold ${condition === c.value ? "text-amber-800" : "text-stone-700"}`}>{c.label}</span>
                      <span className="text-xs text-stone-400 leading-tight">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Price ────────────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-200 p-5">
                <h2 className="font-bold text-stone-800 mb-4">מחיר</h2>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₪</span>
                  <input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" dir="ltr"
                    className="w-full pr-9 pl-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-xl font-bold text-center" required />
                </div>
                <p className="text-xs text-stone-400 mt-2 text-center">קבע מחיר הוגן לשני הצדדים</p>
              </section>

              {/* ── Error & Submit ────────────────────────────────────── */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {formError}
                  {formError.includes("להתחבר") && (
                    <Link href="/login" className="mr-2 font-semibold underline">כניסה →</Link>
                  )}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-bold py-4 rounded-2xl text-lg">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    מפרסם...
                  </span>
                ) : "פרסם ספר"}
              </button>
            </form>
          </div>
        </main>

        <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-sm">
          <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
        </footer>
      </div>
    </>
  );
}
