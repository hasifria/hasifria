"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";

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

type IdentifyResponse = {
  identified: { title: string; author: string; publisher: string | null; language: string; confidence: number };
  match: Book | null;
  coverUrl: string;
  uncertain: boolean;
  error?: string;
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

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const UNCERTAIN_MSG = "לא הצלחנו לזהות בוודאות, אנא בדוק את הפרטים";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] transition text-sm";

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

function CameraIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12M8 6v12M11 6v12M15 6v12M18 6v12M21 6v12" />
    </svg>
  );
}

/**
 * Downscale on the client before upload: phone photos are often 3–10MB, and Vercel
 * rejects request bodies over ~4.5MB. Falls back to the original file if the browser
 * can't decode it (e.g. HEIC outside Safari).
 */
async function prepareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

// ─── Desktop: QR/SMS modal for scanning a barcode with the phone ──────────────

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

// ─── Sell flow (desktop + mobile) ─────────────────────────────────────────────

type Step = "capture" | "identifying" | "scanning" | "looking-up" | "form";

function SellFlow({ isMobile }: { isMobile: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [captureError, setCaptureError] = useState("");

  // Book details
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [scannedIsbn, setScannedIsbn] = useState<string | null>(null); // scanned ISBN not in our DB
  const [match, setMatch] = useState<Book | null>(null); // existing book record
  const [coverUrl, setCoverUrl] = useState<string | null>(null); // seller's photo (Cloudinary URL, or data URL fallback)
  const [warning, setWarning] = useState("");
  const [suggestTitle, setSuggestTitle] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  // Listing details
  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Desktop barcode-by-phone
  const [mobileToken, setMobileToken] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [requestingToken, setRequestingToken] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // "full": first capture → identify + prefill. "cover": add a missing cover from inside the form.
  const identifyMode = useRef<"full" | "cover">("full");

  const displayCover = match?.cover_image || coverUrl;
  const isLinked = !!match && match.title.trim() === title.trim() && match.author.trim() === author.trim();

  const resetAll = () => {
    setTitle(""); setAuthor(""); setScannedIsbn(null); setMatch(null); setCoverUrl(null);
    setWarning(""); setSuggestTitle(""); setCaptureError(""); setFormError("");
    setStep("capture");
  };

  const handleImage = async (file: File) => {
    const mode = identifyMode.current;
    setCaptureError("");
    if (!file.type.startsWith("image/")) {
      setCaptureError("יש לבחור קובץ תמונה");
      return;
    }
    if (mode === "full") setStep("identifying");
    else setCoverUploading(true);

    const blob = await prepareImage(file);
    if (blob.size > MAX_UPLOAD_BYTES) {
      setCaptureError("התמונה גדולה מדי (מקסימום 8MB)");
      setCoverUploading(false);
      if (mode === "full") setStep("capture");
      return;
    }

    const fd = new FormData();
    fd.append("image", blob, "cover.jpg");

    let res: Response | null = null;
    let data: Partial<IdentifyResponse> = {};
    try {
      res = await fetch("/api/books/identify", { method: "POST", body: fd });
      try { data = await res.json(); } catch {}
    } catch { /* network error → fallback below */ }

    setCoverUploading(false);

    if (res?.status === 401) {
      router.replace("/register?redirect=/sell");
      return;
    }
    if (res && (res.status === 413 || res.status === 415)) {
      setCaptureError(data.error ?? "לא הצלחנו לקרוא את התמונה");
      if (mode === "full") setStep("capture");
      return;
    }

    if (!res?.ok || !data.coverUrl) {
      // Identification unavailable (rate limit, server error, offline): keep the photo
      // locally as the cover (/api/listings uploads it) and let the seller type the details.
      try { setCoverUrl(await blobToDataUrl(blob)); } catch {}
      setWarning(`${data.error ?? "הזיהוי האוטומטי לא זמין כרגע."} אנא מלא את פרטי הספר.`);
      setStep("form");
      return;
    }

    setCoverUrl(data.coverUrl);
    const id = data.identified;
    if (mode === "full") {
      if (data.match) {
        setMatch(data.match);
        setTitle(data.match.title);
        setAuthor(data.match.author);
        setSuggestTitle(data.match.title);
      } else {
        setMatch(null);
        setTitle(id?.title ?? "");
        setAuthor(id?.author ?? "");
        setSuggestTitle(id?.title ?? "");
      }
      setWarning(data.uncertain ? UNCERTAIN_MSG : "");
    } else {
      // Only fill fields the seller hasn't filled yet.
      if (!title.trim() && id?.title) setTitle(id.title);
      if (!author.trim() && id?.author) setAuthor(id.author);
    }
    setStep("form");
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleImage(file);
  };

  const pickImage = (mode: "full" | "cover", source: "camera" | "gallery") => {
    identifyMode.current = mode;
    (source === "camera" ? cameraRef : galleryRef).current?.click();
  };

  const applyExistingBook = useCallback((b: Book) => {
    setMatch(b);
    setTitle(b.title);
    setAuthor(b.author);
    setScannedIsbn(null);
    setSuggestTitle(b.title);
    setWarning("");
  }, []);

  const handleScan = useCallback(async (raw: string) => {
    const isbn = raw.replace(/[-\s]/g, "");
    setStep("looking-up");
    try {
      const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn)}`);
      const book: Book | null = await res.json();
      if (book?.id) {
        applyExistingBook(book);
      } else {
        setMatch(null);
        setScannedIsbn(isbn);
        setWarning(`ISBN ${isbn} לא נמצא במאגר — אנא מלא את פרטי הספר`);
      }
    } catch {
      setScannedIsbn(isbn);
      setWarning("החיפוש נכשל — אנא מלא את פרטי הספר");
    }
    setStep("form");
  }, [applyExistingBook]);

  const onDesktopBook = useCallback((book: ResolvedBook) => {
    setMobileToken(null);
    if (book.bookId) {
      applyExistingBook({
        id: book.bookId, isbn: book.isbn ?? null, title: book.title, author: book.author, cover_image: book.cover_image ?? null,
      });
    } else {
      setMatch(null);
      setTitle(book.title);
      setAuthor(book.author);
      setScannedIsbn(book.isbn ?? null);
      setSuggestTitle(book.title);
      if (book.cover_image) setCoverUrl(book.cover_image);
      setWarning("");
    }
    setStep("form");
  }, [applyExistingBook]);

  const startBarcode = async (sendSms = false) => {
    if (isMobile) { setStep("scanning"); return; }
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
    const t = title.trim();
    const a = author.trim();
    if (!t) { setFormError("נא למלא שם ספר"); return; }
    if (!a) { setFormError("נא למלא שם סופר"); return; }
    if (!displayCover) { setFormError("יש להעלות תמונה של כריכת הספר כדי להמשיך"); return; }

    let priceValue: string | null = null; // empty = למסירה
    if (price.trim()) {
      const parsed = parseFloat(price);
      if (isNaN(parsed) || parsed < 0) { setFormError("יש להזין מחיר תקין"); return; }
      priceValue = price.trim();
    }

    const body: Record<string, unknown> = { condition, price: priceValue, category: category || null };
    if (isLinked && match) {
      body.bookId = match.id;
      body.cover_image = coverUrl; // the server only applies it if the book has no cover yet
    } else {
      // Seller edited the details (or nothing matched): create a new book.
      body.isbn = scannedIsbn;
      body.title = t;
      body.author = a;
      body.cover_image = coverUrl ?? match?.cover_image ?? null;
    }

    setSubmitting(true);
    try {
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

  const barcodeButton = (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => startBarcode(false)} disabled={requestingToken}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[#a0a0a0] hover:text-[#F5A623] border border-[#2a2a2a] hover:border-[#F5A623]/40 rounded-xl transition-colors disabled:opacity-50">
        {requestingToken ? <Spinner /> : <BarcodeIcon />}
        יש ברקוד? סרוק
      </button>
      {!isMobile && (
        <button type="button" onClick={() => startBarcode(true)} disabled={requestingToken}
          className="text-xs text-[#555] hover:text-[#888] transition-colors">
          או קבל קישור לסריקה ב-SMS
        </button>
      )}
    </div>
  );

  // ── Full-screen steps ──

  if (step === "scanning") {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <BarcodeScanner onScan={handleScan} onClose={() => setStep(title || displayCover ? "form" : "capture")} />
      </div>
    );
  }

  if (step === "identifying" || step === "looking-up") {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f0f0f]" dir="rtl">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="w-20 h-20 object-contain animate-pulse" />
          <p className="text-[#a0a0a0]">{step === "identifying" ? "מזהה את הספר..." : "מחפש ספר..."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {mobileToken && (
        <MobileListingModal
          token={mobileToken}
          smsSent={smsSent}
          onBookReceived={onDesktopBook}
          onClose={() => setMobileToken(null)}
        />
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileInput} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileInput} />

      <div className="flex flex-col min-h-screen bg-[#0f0f0f]" dir="rtl">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#F0F0F0]">פרסום ספר למכירה</h1>
            </div>

            {step === "capture" && (
              <section
                className={`bg-[#1e1e1e] rounded-2xl border-2 border-dashed p-8 text-center transition-colors
                  ${dragOver ? "border-[#F5A623] bg-[#F5A623]/5" : "border-[#2a2a2a]"}`}
                onDragOver={(e) => { if (!isMobile) { e.preventDefault(); setDragOver(true); } }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  if (isMobile) return;
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) { identifyMode.current = "full"; handleImage(file); }
                }}
              >
                <div className="w-20 h-20 bg-[#F5A623]/10 rounded-full flex items-center justify-center mx-auto mb-5 text-[#F5A623]">
                  <CameraIcon className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-[#F0F0F0] mb-2">צלם את כריכת הספר</h2>
                <p className="text-[#888] text-sm mb-6">
                  {isMobile
                    ? "נזהה את הספר מהתמונה ונשתמש בה כתמונת הכריכה"
                    : "העלה תמונה של הכריכה (או גרור אותה לכאן) — נזהה את הספר ונשתמש בה כתמונת הכריכה"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {isMobile ? (
                    <>
                      <button type="button" onClick={() => pickImage("full", "camera")}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] text-black font-bold rounded-2xl text-lg transition-colors">
                        <CameraIcon />צלם כריכה
                      </button>
                      <button type="button" onClick={() => pickImage("full", "gallery")}
                        className="px-6 py-3.5 border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#a0a0a0] font-medium rounded-2xl transition-colors">
                        בחר מהגלריה
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => pickImage("full", "gallery")}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] text-black font-bold rounded-2xl text-lg transition-colors">
                      <CameraIcon />העלה תמונת כריכה
                    </button>
                  )}
                </div>
                {captureError && <p className="text-sm text-red-400 mt-4">{captureError}</p>}
                <div className="mt-6 pt-5 border-t border-[#2a2a2a]">{barcodeButton}</div>
              </section>
            )}

            {step === "form" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-[#F0F0F0]">פרטי הספר</h2>
                    <button type="button" onClick={resetAll}
                      className="text-xs text-[#555] hover:text-[#888] transition-colors">התחל מחדש</button>
                  </div>

                  {warning && (
                    <div className="bg-[#F5A623]/10 border border-[#F5A623]/40 rounded-xl px-4 py-3 text-sm text-[#F5A623]" role="alert">
                      {warning}
                    </div>
                  )}

                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-[#2a2a2a] flex items-center justify-center">
                      {coverUploading ? (
                        <Spinner className="w-6 h-6 text-[#F5A623]" />
                      ) : displayCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={displayCover} alt="כריכת הספר" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl opacity-40">📕</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {isLinked && <p className="text-emerald-400 text-xs font-medium">✓ הספר נמצא במאגר</p>}
                      {scannedIsbn && <p className="text-[#555] text-xs font-mono">ISBN {scannedIsbn}</p>}
                      {!displayCover && !coverUploading && (
                        <>
                          <p className="text-xs text-[#888]">יש להעלות תמונה של כריכת הספר כדי להמשיך</p>
                          <div className="flex gap-2 flex-wrap">
                            {isMobile && (
                              <button type="button" onClick={() => pickImage("cover", "camera")}
                                className="px-3 py-2 bg-[#F5A623] hover:bg-[#e0941a] text-black text-sm font-medium rounded-xl transition-colors">
                                צלם
                              </button>
                            )}
                            <button type="button" onClick={() => pickImage("cover", "gallery")}
                              className="px-3 py-2 border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#a0a0a0] text-sm font-medium rounded-xl transition-colors">
                              {isMobile ? "גלריה" : "העלה תמונה"}
                            </button>
                          </div>
                        </>
                      )}
                      {captureError && <p className="text-xs text-red-400">{captureError}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sell-title" className="block text-sm font-medium text-[#a0a0a0] mb-1.5">שם הספר *</label>
                    <input id="sell-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הארי פוטר" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="sell-author" className="block text-sm font-medium text-[#a0a0a0] mb-1.5">סופר *</label>
                    <input id="sell-author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ג'יי קיי רולינג" className={inputClass} />
                  </div>

                  {!isLinked && !scannedIsbn && <div className="pt-1">{barcodeButton}</div>}
                </section>

                <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5">
                  <h2 className="font-bold text-[#F0F0F0] mb-4">מצב הספר</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {CONDITIONS.map((c) => (
                      <button key={c.value} type="button" onClick={() => setCondition(c.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center
                          ${condition === c.value ? "border-[#F5A623] bg-[#F5A623]/10" : "border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#141414]"}`}>
                        <span className={`text-sm font-semibold ${condition === c.value ? "text-[#F5A623]" : "text-[#a0a0a0]"}`}>{c.label}</span>
                        <span className="text-xs text-[#555] leading-tight">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5 space-y-4">
                  <h2 className="font-bold text-[#F0F0F0]">קטגוריה</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all
                          ${category === cat.value ? "border-[#4ECDC4] bg-[#4ECDC4]/10 text-[#4ECDC4]" : "border-[#2a2a2a] bg-[#141414] text-[#888] hover:border-[#3a3a3a]"}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </section>

                <PriceSuggestion isbn={match?.isbn ?? scannedIsbn} bookTitle={suggestTitle} />

                <section className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-5">
                  <label htmlFor="sell-price" className="block font-bold text-[#F0F0F0] mb-4">
                    מחיר <span className="text-sm font-normal text-[#555]">(לא חובה)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] font-bold">₪</span>
                    <input id="sell-price" type="number" min="0" step="1" inputMode="numeric" value={price}
                      onChange={(e) => setPrice(e.target.value)} placeholder="למסירה" dir="ltr"
                      className="w-full pr-9 pl-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#4ECDC4] placeholder:font-semibold outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition text-xl font-bold text-center" />
                  </div>
                  <p className="text-xs text-[#555] mt-2 text-center">
                    {price.trim() ? "קבע מחיר הוגן לשני הצדדים" : "השאר ריק כדי למסור את הספר בחינם"}
                  </p>
                </section>

                {formError && (
                  <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
                    {formError}
                    {formError.includes("להתחבר") && (
                      <Link href="/login" className="mr-2 font-semibold underline">כניסה →</Link>
                    )}
                  </div>
                )}

                <button type="submit" disabled={submitting || coverUploading}
                  className="w-full bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-black font-bold py-4 rounded-2xl text-lg">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2"><Spinner className="w-5 h-5" />מפרסם...</span>
                  ) : "פרסם ספר"}
                </button>
              </form>
            )}
          </div>
        </main>
        <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
          <p>© 2026 הספריה — קנה ומכור ספרים יד שניה בישראל</p>
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
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (!user?.id) router.replace("/register?redirect=/sell");
        else setReady(true);
      })
      .catch(() => router.replace("/register?redirect=/sell"));
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-[#0f0f0f]" />;
  return <SellFlow isMobile={isMobile} />;
}
