"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import ImageCropper from "@/components/ImageCropper";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

type FoundBook = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  cover_image: string | null;
};

type Step = "scanning" | "looking-up" | "found" | "not-found" | "done";

function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

export default function MobileListing({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("scanning");
  const [scannedISBN, setScannedISBN] = useState("");
  const [foundBook, setFoundBook] = useState<FoundBook | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(async (isbn: string) => {
    setScannedISBN(isbn);
    setStep("looking-up");
    setError("");
    try {
      const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn.replace(/[-\s]/g, ""))}`);
      const book = await res.json();
      if (book?.id) {
        setFoundBook(book);
        setStep("found");
      } else {
        setStep("not-found");
      }
    } catch {
      setStep("not-found");
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

  const submitBook = async (bookData: {
    bookId?: string;
    isbn?: string | null;
    title: string;
    author: string;
    cover_image?: string | null;
  }) => {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/mobile-listing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...bookData }),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const data = await res.json();
        setError(data.error ?? "שגיאה. נסה שוב.");
      }
    } catch {
      setError("שגיאת תקשורת. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFound = () => {
    if (!foundBook) return;
    submitBook({
      bookId: foundBook.id,
      isbn: foundBook.isbn,
      title: foundBook.title,
      author: foundBook.author,
      cover_image: foundBook.cover_image,
    });
  };

  const handleSubmitManual = () => {
    if (!title.trim()) { setError("נא למלא שם ספר"); return; }
    if (!author.trim()) { setError("נא למלא שם סופר"); return; }
    submitBook({
      isbn: scannedISBN || null,
      title: title.trim(),
      author: author.trim(),
      cover_image: coverImage,
    });
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-20 h-20 bg-emerald-900/40 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#F0F0F0] mb-2">הספר נוסף!</h1>
        <p className="text-[#888] text-sm">ניתן לסגור דף זה ולחזור למחשב להשלמת הפרסום</p>
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <BarcodeScanner
        onScan={handleScan}
        onClose={() => setStep("not-found")}
      />
    );
  }

  if (step === "looking-up") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <Spinner className="w-10 h-10 text-[#F5A623] mb-4" />
        <p className="text-[#888]">מחפש ספר...</p>
        <p className="text-[#555] text-xs mt-1 font-mono">{scannedISBN}</p>
      </div>
    );
  }

  if (step === "found" && foundBook) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-xs">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#F0F0F0]">הספר נמצא!</h1>
          </div>

          <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-4 flex gap-4 items-start mb-6">
            <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 bg-[#2a2a2a] flex items-center justify-center">
              {foundBook.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foundBook.cover_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl opacity-40">📕</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#F0F0F0] leading-snug">{foundBook.title}</p>
              <p className="text-[#888] text-sm mt-1">{foundBook.author}</p>
              {foundBook.isbn && (
                <p className="text-[#555] text-xs mt-2 font-mono">{foundBook.isbn}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          <button
            onClick={handleConfirmFound}
            disabled={isSubmitting}
            className="w-full py-4 bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-60 text-black font-bold rounded-2xl text-lg transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2"><Spinner />שולח...</span>
            ) : "אשר ספר"}
          </button>
          <button
            onClick={() => { setFoundBook(null); setStep("scanning"); }}
            className="w-full mt-3 py-3 text-[#555] hover:text-[#888] text-sm transition-colors"
          >
            סרוק מחדש
          </button>
        </div>
      </div>
    );
  }

  // not-found (manual entry)
  return (
    <>
      {rawImage && (
        <ImageCropper
          src={rawImage}
          onConfirm={(url) => { setCoverImage(url); setRawImage(null); }}
          onCancel={() => setRawImage(null)}
        />
      )}
      <div className="min-h-screen bg-[#0f0f0f] px-6 py-10" dir="rtl">
        <div className="w-full max-w-xs mx-auto">
          <h1 className="text-xl font-bold text-[#F0F0F0] mb-1">הספר לא נמצא</h1>
          <p className="text-[#888] text-sm mb-1">מלא את הפרטים ידנית</p>
          {scannedISBN && (
            <p className="text-xs text-[#555] mb-5 font-mono">ISBN: {scannedISBN}</p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">שם הספר *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="הארי פוטר"
                className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">סופר *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="ג'יי קיי רולינג"
                className="w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">תמונת עטיפה</label>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {coverImage ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="עטיפה" className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                  <button type="button" onClick={() => setCoverImage(null)} className="text-sm text-[#555] hover:text-red-400 transition-colors">
                    הסר
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#F5A623] hover:bg-[#e0941a] text-black text-sm font-medium rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    צלם
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#a0a0a0] text-sm font-medium rounded-xl transition-colors"
                  >
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

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          <button
            onClick={handleSubmitManual}
            disabled={isSubmitting}
            className="w-full mt-6 py-4 bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-60 text-black font-bold rounded-2xl text-lg transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2"><Spinner />שולח...</span>
            ) : "שמור ספר"}
          </button>
          <button
            onClick={() => setStep("scanning")}
            className="w-full mt-3 py-3 text-[#555] hover:text-[#888] text-sm transition-colors"
          >
            סרוק מחדש
          </button>
        </div>
      </div>
    </>
  );
}
