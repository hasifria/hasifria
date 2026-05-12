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

const CATEGORIES = [
  { value: "", label: "ללא קטגוריה" },
  { value: "CHILDREN", label: "ילדים" },
  { value: "YOUNG_ADULT", label: "נוער" },
  { value: "ADULT", label: "מבוגרים" },
  { value: "EDUCATION", label: "לימוד" },
  { value: "HEALTH", label: "בריאות" },
];

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Pricing suggestion panel ─────────────────────────────────────────────────

type PriceRange = { min: number | null; max: number | null; count: number };

function PriceSuggestion({ isbn, bookTitle }: { isbn?: string | null; bookTitle?: string }) {
  const [range, setRange] = useState<PriceRange | null>(null);

  useEffect(() => {
    if (!bookTitle && !isbn) return;
    setRange(null);
    const params = new URLSearchParams();
    if (isbn) params.set("isbn", isbn);
    if (bookTitle) params.set("title", bookTitle);
    fetch(`/api/listings/price-range?${params}`)
      .then((r) => r.json())
      .then(setRange)
      .catch(() => {});
  }, [isbn, bookTitle]);

  if (!range) return null;

  let message: string;
  if (range.count === 0) {
    message = "הספר הזה עדיין לא מוצע למכירה באתר — אתה הראשון!";
  } else if (range.count === 1 || range.min === range.max) {
    message = `מוכר אחר מציע ספר זה ב: ${range.min}₪`;
  } else {
    message = `מוכרים אחרים מציעים ספר זה ב: ${range.min}₪ - ${range.max}₪`;
  }

  return (
    <div className="bg-[#1e1e1e] border border-[#F5A623]/40 rounded-2xl p-5">
      <p className="text-sm font-semibold text-[#F5A623] mb-1.5">💡 עזרה בתמחור</p>
      <p className="text-sm text-[#F0F0F0]">{message}</p>
      <p className="text-xs text-[#555] mt-2">זו הצעה בלבד — אפשר לתמחר כרצונך</p>
    </div>
  );
}

// ─── Shared listing form sections ─────────────────────────────────────────────

function ListingFormSections({
  condition, setCondition,
  price, setPrice,
  isFree, setIsFree,
  category, setCategory,
  submitting, formError,
  isbn, bookTitle,
}: {
  condition: Condition;
  setCondition: (c: Condition) => void;
  price: string;
  setPrice: (p: string) => void;
  isFree: boolean;
  setIsFree: (f: boolean) => void;
  category: string;
  setCategory: (c: string) => void;
  submitting: boolean;
  formError: string;
  isbn?: string | null;
  bookTitle?: string;
}) {
  return (
    <>
      <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5">
        <h2 className="font-bold text-[#F0F0F0] mb-4">מצב הספר</h2>
        <div className="grid grid-cols-3 gap-2">
          {CONDITIONS.map((c: any) => (
            <button key={c.value} type="button" onClick={() => setCondition(c.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center
                ${condition === c.value
                  ? "border-[#F5A623] bg-[#F5A623]/10"
                  : "border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#141414]"}`}>
              <span className={`text-sm font-semibold ${condition === c.value ? "text-[#F5A623]" : "text-[#a0a0a0]"}`}>{c.label}</span>
              <span className="text-xs text-[#555] leading-tight">{c.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5 space-y-4">
        <h2 className="font-bold text-[#F0F0F0]">קטגוריה</h2>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat: any) => (
            <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
              className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all
                ${category === cat.value
                  ? "border-[#4ECDC4] bg-[#4ECDC4]/10 text-[#4ECDC4]"
                  : "border-[#2a2a2a] bg-[#141414] text-[#888] hover:border-[#3a3a3a]"}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <PriceSuggestion isbn={isbn} bookTitle={bookTitle} />

      <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#F0F0F0]">מחיר</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-[#888]">למסירה חינם</span>
            <div
              onClick={() => setIsFree(!isFree)}
              className={`w-10 h-5.5 rounded-full relative transition-colors cursor-pointer ${isFree ? "bg-[#4ECDC4]" : "bg-[#3a3a3a]"}`}
              style={{ height: "22px" }}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFree ? "right-0.5" : "left-0.5"}`}
              />
            </div>
          </label>
        </div>
        {isFree ? (
          <div className="text-center py-3 text-[#4ECDC4] font-bold text-lg">למסירה חינם</div>
        ) : (
          <>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] font-bold">₪</span>
              <input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" dir="ltr"
                className="w-full pr-9 pl-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition text-xl font-bold text-center"
              />
            </div>
            <p className="text-xs text-[#555] mt-2 text-center">קבע מחיר הוגן לשני הצדדים</p>
          </>
        )}
      </section>

      {formError && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
          {formError}
          {formError.includes("להתחבר") && (
            <Link href="/login" className="mr-2 font-semibold underline">כניסה →</Link>
          )}
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-black font-bold py-4 rounded-2xl text-lg">
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
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <h3 className="font-bold text-[#F0F0F0] text-lg mb-1">
          {smsSent ? "קישור נשלח ב-SMS" : "סרוק עם הנייד"}
        </h3>
        <p className="text-[#888] text-sm mb-4">
          {smsSent ? "פתח את הקישור בנייד לסריקת ברקוד הספר" : "סרוק את הקוד עם הנייד לסריקת ברקוד הספר"}
        </p>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR" className="w-48 h-48 mx-auto mb-4 rounded-xl border border-[#2a2a2a]" />
        ) : (
          <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-[#2a2a2a] animate-pulse" />
        )}
        <div className="flex items-center justify-center gap-2 text-[#F5A623] text-sm mb-5">
          <Spinner />ממתין לסריקה מהנייד...
        </div>
        <button onClick={onClose} className="text-[#555] hover:text-[#888] text-sm transition-colors">ביטול</button>
      </div>
    </div>
  );
}

// ─── Mobile flow ──────────────────────────────────────────────────────────────

type MobileStep = "idle" | "scanning" | "looking-up" | "found" | "manual" | "listing";

function MobileSell() {
  const router = useRouter();
  const [step, setStep] = useState<MobileStep>("idle");
  const [scannedISBN, setScannedISBN] = useState("");
  const [foundBook, setFoundBook] = useState<Book | null>(null);
  const [resolvedBook, setResolvedBook] = useState<ResolvedBook | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [manualError, setManualError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleScan = useCallback(async (isbn: string) => {
    setScannedISBN(isbn);
    setStep("looking-up");
    try {
      const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn.replace(/[-\s]/g, ""))}`);
      const book = await res.json();
      if (book?.id) { setFoundBook(book); setStep("found"); }
      else setStep("manual");
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
    setFoundBook(null); setResolvedBook(null);
    setTitle(""); setAuthor(""); setCoverImage(null); setManualError("");
    setStep("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!resolvedBook) return;
    if (!isFree) {
      const parsedPrice = parseFloat(price);
      if (!price || isNaN(parsedPrice) || parsedPrice < 0) { setFormError("יש להזין מחיר תקין"); return; }
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        condition,
        price: isFree ? null : price,
        category: category || null,
      };
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

  if (step === "idle") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-20 h-20 bg-[#F5A623]/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#F0F0F0] mb-2">פרסום ספר למכירה</h1>
        <p className="text-[#888] text-sm mb-8">חייבים לסרוק את הברקוד בכדי לפרסם ספר</p>
        <button
          onClick={() => setStep("scanning")}
          className="px-8 py-4 bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] text-black font-bold rounded-2xl text-lg transition-colors"
        >
          סרוק ברקוד
        </button>
      </div>
    );
  }

  if (step === "scanning") return <BarcodeScanner onScan={handleScan} onClose={() => setStep("idle")} />;
  if (step === "looking-up") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-3">
        <Spinner className="w-10 h-10 text-[#F5A623]" />
        <p className="text-[#888] text-sm">מחפש ספר...</p>
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
      <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#F0F0F0]">פרסום ספר למכירה</h1>
            </div>

            {(step === "found" || step === "manual") && (
              <div className="space-y-5">
                <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5 space-y-4">
                  <h2 className="font-bold text-[#F0F0F0]">פרטי הספר</h2>

                  {step === "found" && foundBook && (
                    <>
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 bg-[#2a2a2a] flex items-center justify-center">
                          {foundBook.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={foundBook.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : <span className="text-2xl opacity-40">📕</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-emerald-400 text-xs font-medium">✓ הספר נמצא</span>
                          </div>
                          <p className="font-bold text-[#F0F0F0] leading-snug">{foundBook.title}</p>
                          <p className="text-[#888] text-sm mt-0.5">{foundBook.author}</p>
                          {foundBook.isbn && <p className="text-[#555] text-xs mt-1.5 font-mono">{foundBook.isbn}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={confirmFound}
                          className="flex-1 py-3 bg-[#F5A623] hover:bg-[#e0941a] text-black font-bold rounded-xl transition-colors">
                          המשך לפרסום
                        </button>
                        <button type="button" onClick={resetToScan}
                          className="px-4 py-3 border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#888] font-medium rounded-xl transition-colors text-sm">
                          סרוק מחדש
                        </button>
                      </div>
                    </>
                  )}

                  {step === "manual" && (
                    <>
                      {scannedISBN ? (
                        <p className="text-xs text-[#888] bg-[#141414] rounded-lg px-3 py-1.5 font-mono">
                          ISBN {scannedISBN} — לא נמצא במאגר
                        </p>
                      ) : (
                        <p className="text-xs text-[#888]">הספר לא נמצא. מלא את הפרטים ידנית.</p>
                      )}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">שם הספר *</label>
                          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הארי פוטר"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] transition text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">סופר *</label>
                          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ג'יי קיי רולינג"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] transition text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">תמונת עטיפה</label>
                          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          {coverImage ? (
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={coverImage} alt="עטיפה" className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                              <button type="button" onClick={() => setCoverImage(null)} className="text-sm text-[#555] hover:text-red-400 transition-colors">הסר</button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => cameraRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#F5A623] hover:bg-[#e0941a] text-black text-sm font-medium rounded-xl transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <circle cx="12" cy="13" r="3" />
                                </svg>
                                צלם
                              </button>
                              <button type="button" onClick={() => galleryRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#a0a0a0] text-sm font-medium rounded-xl transition-colors">
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
                      {manualError && <p className="text-sm text-red-400">{manualError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={confirmManual}
                          className="flex-1 py-3 bg-[#F5A623] hover:bg-[#e0941a] text-black font-bold rounded-xl transition-colors">
                          המשך לפרסום
                        </button>
                        <button type="button" onClick={resetToScan}
                          className="px-4 py-3 border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#888] font-medium rounded-xl transition-colors text-sm">
                          סרוק מחדש
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {step === "listing" && resolvedBook && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5">
                  <div className="flex items-center gap-3">
                    {resolvedBook.cover_image && (
                      <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolvedBook.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#F0F0F0] text-sm truncate">{resolvedBook.title}</p>
                      <p className="text-xs text-[#888]">{resolvedBook.author}</p>
                    </div>
                    <button type="button" onClick={resetToScan}
                      className="text-xs text-[#555] hover:text-[#888] shrink-0 transition-colors">שנה</button>
                  </div>
                </section>
                <ListingFormSections
                  condition={condition} setCondition={setCondition}
                  price={price} setPrice={setPrice}
                  isFree={isFree} setIsFree={setIsFree}
                  category={category} setCategory={setCategory}
                  submitting={submitting} formError={formError}
                  isbn={resolvedBook?.isbn} bookTitle={resolvedBook?.title}
                />
              </form>
            )}
          </div>
        </main>
        <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
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
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const performSearch = useCallback(async (q: string) => {
    setSearching(true);
    setSearchResults([]);
    setNotFound(false);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
      const data: Book[] = await res.json();
      if (data.length > 0) setSearchResults(data);
      else setNotFound(true);
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
    if (!isFree) {
      const parsedPrice = parseFloat(price);
      if (!price || isNaN(parsedPrice) || parsedPrice < 0) { setFormError("יש להזין מחיר תקין"); return; }
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        condition,
        price: isFree ? null : price,
        category: category || null,
      };
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

      <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
        <Header />
        <main className="flex-1 py-10 px-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#F0F0F0]">פרסום ספר למכירה</h1>
              <p className="text-[#888] text-sm mt-1">מלא את הפרטים ופרסם בחינם</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5 space-y-4">
                <h2 className="font-bold text-[#F0F0F0]">פרטי הספר</h2>

                {resolvedBook ? (
                  <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-800 rounded-xl p-3">
                    {resolvedBook.cover_image && (
                      <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolvedBook.cover_image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#F0F0F0] text-sm truncate">{resolvedBook.title}</p>
                      <p className="text-xs text-[#888]">{resolvedBook.author}</p>
                    </div>
                    <button type="button"
                      onClick={() => { setResolvedBook(null); setSearchQuery(""); setNotFound(false); setSearchResults([]); }}
                      className="text-xs text-[#555] hover:text-[#888] shrink-0 transition-colors">שנה</button>
                  </div>
                ) : (
                  <div ref={searchContainerRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchResults([]); setNotFound(false); }}
                        placeholder="חפש לפי שם ספר"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] transition text-sm"
                        autoComplete="off"
                      />
                      {searching && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#F5A623]">
                          <Spinner />
                        </div>
                      )}
                      {searchResults.length > 0 && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden divide-y divide-[#2a2a2a]">
                          {searchResults.map((b: any) => (
                            <button key={b.id} type="button"
                              onClick={() => { setResolvedBook({ bookId: b.id, isbn: b.isbn, title: b.title, author: b.author, cover_image: b.cover_image }); setSearchResults([]); }}
                              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2a2a2a] transition-colors text-right">
                              <div className="w-8 h-10 rounded bg-[#2a2a2a] overflow-hidden shrink-0">
                                {b.cover_image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={b.cover_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="flex items-center justify-center h-full text-lg opacity-40">📕</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <p className="font-medium text-[#F0F0F0] text-sm truncate">{b.title}</p>
                                <p className="text-xs text-[#888] truncate">{b.author}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {notFound && !mobileToken && (
                      <div className="mt-4 bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-xl p-4">
                        <p className="text-[#a0a0a0] text-sm leading-relaxed">
                          הספר לא נמצא במאגר שלנו. כדי להוסיף אותו, סרוק את הברקוד עם הנייד שלך.
                        </p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button type="button" onClick={() => requestMobileToken(false)} disabled={requestingToken}
                            className="flex items-center gap-2 px-4 py-2.5 border border-[#F5A623]/30 bg-[#F5A623]/5 hover:bg-[#F5A623]/10 text-[#F5A623] text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                            {requestingToken ? <Spinner /> : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            )}
                            סרוק QR עם הנייד
                          </button>
                          <button type="button" onClick={() => requestMobileToken(true)} disabled={requestingToken}
                            className="flex items-center gap-2 px-4 py-2.5 border border-[#F5A623]/30 bg-[#F5A623]/5 hover:bg-[#F5A623]/10 text-[#F5A623] text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
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
                  isFree={isFree} setIsFree={setIsFree}
                  category={category} setCategory={setCategory}
                  submitting={submitting} formError={formError}
                  isbn={resolvedBook?.isbn} bookTitle={resolvedBook?.title}
                />
              )}
            </form>
          </div>
        </main>
        <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
          <p>© 2026 הספרייה — קנה ומכור ספרים יד שנייה בישראל</p>
        </footer>
      </div>
    </>
  );
}

// ─── Shell: auth check + device detection ─────────────────────────────────────

export default function SellPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (!user?.id) {
          router.replace("/register?redirect=/sell");
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        router.replace("/register?redirect=/sell");
      });
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-[#0f0f0f]" />;
  return isMobile ? <MobileSell /> : <DesktopSell />;
}
