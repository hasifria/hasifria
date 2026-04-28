"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import ImageCropper from "@/components/ImageCropper";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

// ─── Shared types & constants ─────────────────────────────────────────────────

type Book = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  cover_image: string | null;
};

type ResolvedBook = {
  bookId?: string;
  isbn?: string | null;
  title: string;
  author: string;
  cover_image?: string | null;
};

type Condition = "new" | "good" | "worn";

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: "new", label: "כמו חדש", desc: "לא נפתח או כמעט שלא נקרא" },
  { value: "good", label: "מצב טוב", desc: "נקרא אבל תקין לחלוטין" },
  { value: "worn", label: "מצב סביר", desc: "סימני שימוש קלים" },
];

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Shared listing form sections (condition + price + submit) ─────────────────

function ListingFormSections({
  condition,
  setCondition,
  price,
  setPrice,
  submitting,
  formError,
}: {
  condition: Condition;
  setCondition: (c: Condition) => void;
  price: string;
  setPrice: (p: string) => void;
  submitting: boolean;
  formError: string;
}) {
  return (
    <>
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

      <section className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-bold text-stone-800 mb-4">מחיר</h2>
        <div className="relative">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₪</span>
          <input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" dir="ltr"
            className="w-full pr-9 pl-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-xl font-bold text-center"
            required />
        </div>
        <p className="text-xs text-stone-400 mt-2 text-center">קבע מחיר הוגן לשני הצדדים</p>
      </section>

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
          <span className="flex items-center justify-center gap-2"><Spinner className="w-5 h-5" />מפרסם...</span>
        ) : "פרסם ספר"}
      </button>
    </>
  );
}

// ─── Desktop: QR/SMS modal for new-book mobile flow ───────────────────────────

function MobileListingModal({
  token, smsSent, onBookReceived, onClose,
}: {
  token: string;
  smsSent: boolean;
  onBookReceived: (book: ResolvedBook) => void;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const mobileUrl = `${window.location.origin}/sell/mobile/${token}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("qrcode").then((mod: any) => {
      const QRCode = mod.default ?? mod;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (QRCode as any).toDataURL(mobileUrl, { width: 240, margin: 2 }).then(setQrDataUrl);
    });
  }, [token]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/mobile-listing/poll?token=${token}`);
        const data = await res.json();
        if (data.ready && data.book) { clearInterval(id); onBookReceived(data.book); }
      } catch { /* ignore */ }
    }, 2500);
    return () => clearInterval(id);
  }, [token, onBookReceived]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
        <h3 className="font-bold text-stone-900 text-lg mb-1">
          {smsSent ? "קישור נשלח ב-SMS" : "סרוק עם הנייד"}
        </h3>
        <p className="text-stone-500 text-sm mb-4">
          {smsSent ? "פתח את הקישור בנייד לסריקת ברקוד הספר" : "סרוק את הקוד עם הנייד לסריקת ברקוד הספר"}
        </p>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR" className="w-48 h-48 mx-auto mb-4 rounded-xl border border-stone-100" />
        ) : (
          <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-stone-100 animate-pulse" />
        )}
        <div className="flex items-center justify-center gap-2 text-amber-600 text-sm mb-5">
          <Spinner />ממתין לסריקה מהנייד...
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-sm transition-colors">ביטול</button>
      </div>
    </div>
  );
}

// ─── Mobile flow ──────────────────────────────────────────────────────────────

type MobileStep = "scanning" | "looking-up" | "found" | "manual" | "listing";

function MobileSell() {
  const router = useRouter();
  const [step, setStep] = useState<MobileStep>("scanning");
  const [scannedISBN, setScannedISBN] = useState("");
  const [foundBook, setFoundBook] = useState<Book | null>(null);
  const [resolvedBook, setResolvedBook] = useState<ResolvedBook | null>(null);

  // Manual entry fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [manualError, setManualError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Listing details
  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleScan = useCallback(async (isbn: string) => {
    setScannedISBN(isbn);
    setStep("looking-up");
    try {
      const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn.replace(/[-\s]/g, ""))}`);
      const book = await res.json();
      if (book?.id) {
        setFoundBook(book);
        setStep("found");
      } else {
        setStep("manual");
      }
    } catch {
      setStep("manual");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmFound = () => {
    if (!foundBook) return;
    setResolvedBook({ bookId: foundBook.id, isbn: foundBook.isbn, title: foundBook.title, author: foundBook.author, cover_image: foundBook.cover_image });
    setStep("listing");
  };

  const confirmManual = () => {
    setManualError("");
    if (!title.trim()) { setManualError("נא למלא שם ספר"); return; }
    if (!author.trim()) { setManualError("נא למלא שם סופר"); return; }
    setResolvedBook({ isbn: scannedISBN || null, title: title.trim(), author: author.trim(), cover_image: coverImage });
    setStep("listing");
  };

  const resetToScan = () => {
    setFoundBook(null);
    setResolvedBook(null);
    setTitle(""); setAuthor(""); setCoverImage(null); setManualError("");
    setStep("scanning");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!resolvedBook) return;
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { setFormError("יש להזין מחיר תקין"); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { condition, price };
      if (resolvedBook.bookId) {
        body.bookId = resolvedBook.bookId;
      } else {
        body.isbn = resolvedBook.isbn ?? null;
        body.title = resolvedBook.title;
        body.author = resolvedBook.author;
        body.cover_image = resolvedBook.cover_image ?? null;
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

  // Full-screen states
  if (step === "scanning") {
    return <BarcodeScanner onScan={handleScan} onClose={() => setStep("manual")} />;
  }

  if (step === "looking-up") {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
        <Spinner className="w-10 h-10 text-amber-600" />
        <p className="text-stone-500 text-sm">מחפש ספר...</p>
      </div>
    );
  }

  return (
    <>
      {rawImage && (
        <ImageCropper
          src={rawImage}
          onConfirm={(url) => { setCoverImage(url); setRawImage(null); }}
          onCancel={() => setRawImage(null)}
        />
      )}

      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-stone-50 py-8 px-4">
          <div className="max-w-lg mx-auto">

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-stone-900">פרסום ספר למכירה</h1>
            </div>

            {/* ── Book step: found or manual ─────────────────────────── */}
            {(step === "found" || step === "manual") && (
              <div className="space-y-5">
                <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                  <h2 className="font-bold text-stone-800">פרטי הספר</h2>

                  {step === "found" && foundBook && (
                    <>
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 bg-amber-100 flex items-center justify-center">
                          {foundBook.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={foundBook.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl opacity-40">📕</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-emerald-600 text-xs font-medium">✓ הספר נמצא</span>
                          </div>
                          <p className="font-bold text-stone-900 leading-snug">{foundBook.title}</p>
                          <p className="text-stone-500 text-sm mt-0.5">{foundBook.author}</p>
                          {foundBook.isbn && <p className="text-stone-400 text-xs mt-1.5 font-mono">{foundBook.isbn}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={confirmFound}
                          className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors">
                          המשך לפרסום
                        </button>
                        <button type="button" onClick={resetToScan}
                          className="px-4 py-3 border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium rounded-xl transition-colors text-sm">
                          סרוק מחדש
                        </button>
                      </div>
                    </>
                  )}

                  {step === "manual" && (
                    <>
                      {scannedISBN ? (
                        <p className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-1.5 font-mono">
                          ISBN {scannedISBN} — לא נמצא במאגר
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500">הספר לא נמצא. מלא את הפרטים ידנית.</p>
                      )}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1.5">שם הספר *</label>
                          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הארי פוטר"
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1.5">סופר *</label>
                          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ג'יי קיי רולינג"
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1.5">תמונת עטיפה</label>
                          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          {coverImage ? (
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={coverImage} alt="עטיפה" className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                              <button type="button" onClick={() => setCoverImage(null)} className="text-sm text-stone-400 hover:text-red-500 transition-colors">הסר</button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => cameraRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <circle cx="12" cy="13" r="3" />
                                </svg>
                                צלם
                              </button>
                              <button type="button" onClick={() => galleryRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                                גלריה
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {manualError && <p className="text-sm text-red-600">{manualError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={confirmManual}
                          className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors">
                          המשך לפרסום
                        </button>
                        <button type="button" onClick={resetToScan}
                          className="px-4 py-3 border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium rounded-xl transition-colors text-sm">
                          סרוק מחדש
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {/* ── Listing step ───────────────────────────────────────── */}
            {step === "listing" && resolvedBook && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <section className="bg-white rounded-2xl border border-stone-200 p-5">
                  <div className="flex items-center gap-3">
                    {resolvedBook.cover_image && (
                      <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolvedBook.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-emerald-600 text-lg">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 text-sm truncate">{resolvedBook.title}</p>
                      <p className="text-xs text-stone-500">{resolvedBook.author}</p>
                    </div>
                    <button type="button" onClick={resetToScan}
                      className="text-xs text-stone-400 hover:text-stone-600 shrink-0 transition-colors">שנה</button>
                  </div>
                </section>
                <ListingFormSections
                  condition={condition} setCondition={setCondition}
                  price={price} setPrice={setPrice}
                  submitting={submitting} formError={formError}
                />
              </form>
            )}

          </div>
        </main>
        <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-sm">
          <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
        </footer>
      </div>
    </>
  );
}

// ─── Desktop flow ─────────────────────────────────────────────────────────────

function DesktopSell() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [resolvedBook, setResolvedBook] = useState<ResolvedBook | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [mobileToken, setMobileToken] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [requestingToken, setRequestingToken] = useState(false);

  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const performSearch = useCallback(async (q: string) => {
    setSearching(true);
    setSearchResults([]);
    setNotFound(false);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
      const data: Book[] = await res.json();
      if (data.length > 0) { setSearchResults(data); } else { setNotFound(true); }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (resolvedBook) return;
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); setNotFound(false); return; }
    const timer = setTimeout(() => performSearch(q), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, resolvedBook, performSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const requestMobileToken = async (sendSms: boolean) => {
    setRequestingToken(true);
    try {
      const res = await fetch("/api/mobile-listing/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendSms }),
      });
      const data = await res.json();
      if (data.token) { setMobileToken(data.token); setSmsSent(sendSms); }
    } catch { /* ignore */ } finally {
      setRequestingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!resolvedBook) { setFormError("יש לבחור ספר תחילה"); return; }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { setFormError("יש להזין מחיר תקין"); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { condition, price };
      if (resolvedBook.bookId) {
        body.bookId = resolvedBook.bookId;
      } else {
        body.isbn = resolvedBook.isbn ?? null;
        body.title = resolvedBook.title;
        body.author = resolvedBook.author;
        body.cover_image = resolvedBook.cover_image ?? null;
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

  return (
    <>
      {mobileToken && (
        <MobileListingModal
          token={mobileToken}
          smsSent={smsSent}
          onBookReceived={(book) => { setResolvedBook(book); setMobileToken(null); }}
          onClose={() => setMobileToken(null)}
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
              <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <h2 className="font-bold text-stone-800">פרטי הספר</h2>

                {resolvedBook ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    {resolvedBook.cover_image && (
                      <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolvedBook.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-emerald-600 text-lg">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 text-sm truncate">{resolvedBook.title}</p>
                      <p className="text-xs text-stone-500">{resolvedBook.author}</p>
                    </div>
                    <button type="button"
                      onClick={() => { setResolvedBook(null); setSearchQuery(""); setNotFound(false); setSearchResults([]); }}
                      className="text-xs text-stone-400 hover:text-stone-600 shrink-0 transition-colors">שנה</button>
                  </div>
                ) : (
                  <div ref={searchContainerRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchResults([]); setNotFound(false); }}
                        placeholder="חפש לפי שם ספר"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm"
                        autoComplete="off"
                      />
                      {searching && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600">
                          <Spinner />
                        </div>
                      )}
                      {searchResults.length > 0 && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden divide-y divide-stone-100">
                          {searchResults.map((b: any) => (
                            <button key={b.id} type="button"
                              onClick={() => { setResolvedBook({ bookId: b.id, isbn: b.isbn, title: b.title, author: b.author, cover_image: b.cover_image }); setSearchResults([]); }}
                              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-amber-50 transition-colors text-right">
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
                        </div>
                      )}
                    </div>

                    {notFound && !mobileToken && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-900 text-sm leading-relaxed">
                          הספר לא נמצא במאגר שלנו. כדי להוסיף אותו, סרוק את הברקוד עם הנייד שלך.
                        </p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button type="button" onClick={() => requestMobileToken(false)} disabled={requestingToken}
                            className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                            {requestingToken ? <Spinner /> : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            )}
                            סרוק QR עם הנייד
                          </button>
                          <button type="button" onClick={() => requestMobileToken(true)} disabled={requestingToken}
                            className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                            {requestingToken ? <Spinner /> : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            )}
                            קבל קישור ב-SMS
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {resolvedBook && (
                <ListingFormSections
                  condition={condition} setCondition={setCondition}
                  price={price} setPrice={setPrice}
                  submitting={submitting} formError={formError}
                />
              )}
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

// ─── Shell: detect device, render correct flow ────────────────────────────────

export default function SellPage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  if (isMobile === null) return <div className="min-h-screen bg-stone-50" />;
  return isMobile ? <MobileSell /> : <DesktopSell />;
}
