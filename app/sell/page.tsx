"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";

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

const CROP_W = 260;
const CROP_H = 390; // 2:3 ratio

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: "new", label: "כמו חדש", desc: "לא נפתח או כמעט שלא נקרא" },
  { value: "good", label: "מצב טוב", desc: "נקרא אבל תקין לחלוטין" },
  { value: "worn", label: "מצב סביר", desc: "סימני שימוש קלים" },
];

// ─── Image Cropper ────────────────────────────────────────────────────────────

function ImageCropper({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const minScaleRef = useRef(1);
  const [transform, setTransform] = useState("translate(0px,0px) scale(1)");

  const updateTransform = (tx: number, ty: number, s: number) => {
    setTransform(`translate(${tx}px,${ty}px) scale(${s})`);
  };

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const clampPos = (tx: number, ty: number, s: number): [number, number] => {
    const img = imgRef.current;
    if (!img) return [tx, ty];
    return [
      clamp(tx, CROP_W - img.naturalWidth * s, 0),
      clamp(ty, CROP_H - img.naturalHeight * s, 0),
    ];
  };

  const apply = (tx: number, ty: number, s: number) => {
    const [cx, cy] = clampPos(tx, ty, s);
    txRef.current = cx;
    tyRef.current = cy;
    scaleRef.current = s;
    updateTransform(cx, cy, s);
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const s = Math.max(CROP_W / img.naturalWidth, CROP_H / img.naturalHeight);
    minScaleRef.current = s;
    const tx = (CROP_W - img.naturalWidth * s) / 2;
    const ty = (CROP_H - img.naturalHeight * s) / 2;
    apply(tx, ty, s);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0, startY = 0, baseTx = 0, baseTy = 0;
    let pinchDist = 0;

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      baseTx = txRef.current; baseTy = tyRef.current;
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      apply(baseTx + e.clientX - startX, baseTy + e.clientY - startY, scaleRef.current);
    };
    const onMouseUp = () => { dragging = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newS = clamp(scaleRef.current * factor, minScaleRef.current, minScaleRef.current * 4);
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      apply(
        cx - (cx - txRef.current) * (newS / scaleRef.current),
        cy - (cy - tyRef.current) * (newS / scaleRef.current),
        newS,
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        dragging = true;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        baseTx = txRef.current; baseTy = tyRef.current;
      } else if (e.touches.length === 2) {
        dragging = false;
        pinchDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging) {
        apply(baseTx + e.touches[0].clientX - startX, baseTy + e.touches[0].clientY - startY, scaleRef.current);
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        );
        const newS = clamp(scaleRef.current * dist / pinchDist, minScaleRef.current, minScaleRef.current * 4);
        const rect = el.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        apply(
          midX - (midX - txRef.current) * (newS / scaleRef.current),
          midY - (midY - tyRef.current) * (newS / scaleRef.current),
          newS,
        );
        pinchDist = dist;
      }
    };
    const onTouchEnd = () => { dragging = false; };

    el.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      -txRef.current / scaleRef.current,
      -tyRef.current / scaleRef.current,
      CROP_W / scaleRef.current,
      CROP_H / scaleRef.current,
      0, 0, 600, 900,
    );
    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="p-4 border-b border-stone-200">
          <h3 className="font-bold text-stone-900 text-center">חתוך את התמונה</h3>
          <p className="text-xs text-stone-400 text-center mt-1">גרור להזזה • צבוט/גלגלת לזום</p>
        </div>

        {/* Crop frame */}
        <div className="flex justify-center py-4 bg-stone-100">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
            style={{ width: CROP_W, height: CROP_H, touchAction: "none" }}
          >
            {/* Corner markers */}
            {[
              "top-0 right-0 border-t-2 border-r-2 rounded-tr",
              "top-0 left-0 border-t-2 border-l-2 rounded-tl",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl",
            ].map((cls) => (
              <div key={cls} className={`absolute z-10 w-5 h-5 border-amber-400 pointer-events-none ${cls}`} />
            ))}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="crop"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute top-0 left-0 max-w-none pointer-events-none select-none"
              style={{ transformOrigin: "0 0", transform }}
            />
          </div>
        </div>

        <div className="p-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors"
          >
            אשר תמונה
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SellPage() {
  const router = useRouter();

  // ISBN / book
  const [isbn, setIsbn] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundBook, setFoundBook] = useState<Book | null | undefined>(undefined);
  // undefined = not yet searched, null = searched & not found

  // Manual fields (when foundBook === null or skipped ISBN)
  const [skipIsbn, setSkipIsbn] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");

  // Image
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Listing
  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const showManualFields = skipIsbn || foundBook === null;
  const isBookResolved = skipIsbn || foundBook !== undefined;

  // ── ISBN search ──────────────────────────────────────────────────────────

  const handleSearchISBN = async () => {
    const cleaned = isbn.replace(/[-\s]/g, "").trim();
    if (!cleaned) return;
    setSearching(true);
    setFoundBook(undefined);
    try {
      const res = await fetch(`/api/books/search?isbn=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      setFoundBook(data ?? null);
    } catch {
      setFoundBook(null);
    } finally {
      setSearching(false);
    }
  };

  // ── Image handling ───────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!isBookResolved) {
      setFormError("יש לחפש לפי ISBN או לדלג");
      return;
    }
    if (showManualFields && !title.trim()) {
      setFormError("יש להזין שם ספר");
      return;
    }
    if (showManualFields && !author.trim()) {
      setFormError("יש להזין שם סופר");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError("יש להזין מחיר תקין");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { condition, price };
      if (foundBook) {
        body.bookId = foundBook.id;
      } else {
        body.isbn = isbn.replace(/[-\s]/g, "") || null;
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
        if (res.status === 401) {
          setFormError("יש להתחבר תחילה כדי לפרסם");
          return;
        }
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
      {rawImage && (
        <ImageCropper
          src={rawImage}
          onConfirm={(url) => { setCroppedImage(url); setRawImage(null); }}
          onCancel={() => setRawImage(null)}
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

              {/* ── ISBN / Book ──────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <h2 className="font-bold text-stone-800">פרטי הספר</h2>

                {!skipIsbn && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      ISBN (ברקוד הספר)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={isbn}
                        onChange={(e) => { setIsbn(e.target.value); setFoundBook(undefined); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchISBN())}
                        placeholder="9780747532699"
                        dir="ltr"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleSearchISBN}
                        disabled={searching || !isbn.trim()}
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

                    {/* Search result */}
                    {foundBook && (
                      <div className="mt-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <span className="text-emerald-600 text-lg">✓</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 text-sm truncate">{foundBook.title}</p>
                          <p className="text-xs text-stone-500">{foundBook.author}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setFoundBook(undefined); setIsbn(""); }}
                          className="text-xs text-stone-400 hover:text-stone-600"
                        >
                          שנה
                        </button>
                      </div>
                    )}
                    {foundBook === null && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                        הספר לא נמצא במסד הנתונים — מלא את הפרטים ידנית למטה
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => { setSkipIsbn(true); setFoundBook(undefined); }}
                      className="mt-2 text-xs text-stone-400 hover:text-amber-600 transition-colors"
                    >
                      אין לי ISBN — הזן ידנית
                    </button>
                  </div>
                )}

                {/* Manual fields */}
                {showManualFields && (
                  <div className="space-y-3">
                    {skipIsbn && (
                      <button
                        type="button"
                        onClick={() => { setSkipIsbn(false); setTitle(""); setAuthor(""); setGenre(""); }}
                        className="text-xs text-stone-400 hover:text-amber-600 transition-colors"
                      >
                        ← חזרה לחיפוש ISBN
                      </button>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">שם הספר *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="הארי פוטר ואבן החכמים"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm"
                        required={showManualFields}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">סופר *</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="ג'יי קיי רולינג"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm"
                        required={showManualFields}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">ז&apos;אנר</label>
                      <input
                        type="text"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="פנטזיה, מדע בדיוני..."
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-sm"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* ── Cover image — only for new books ─────────────────── */}
              {showManualFields && <section className="bg-white rounded-2xl border border-stone-200 p-5">
                <h2 className="font-bold text-stone-800 mb-4">תמונת עטיפה</h2>

                {/* Hidden file inputs */}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                  className="hidden" onChange={handleFileChange} />
                <input ref={galleryRef} type="file" accept="image/*"
                  className="hidden" onChange={handleFileChange} />

                {!croppedImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-32 h-48 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2">
                      <span className="text-4xl opacity-30">📷</span>
                      <span className="text-xs text-stone-400">אין תמונה</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        צלם
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        גלריה
                      </button>
                    </div>
                    <p className="text-xs text-stone-400">אופציונלי — עוזר למצוא את הספר</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={croppedImage}
                      alt="עטיפה"
                      className="w-32 h-48 object-cover rounded-xl shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setCroppedImage(null)}
                      className="text-sm text-stone-400 hover:text-red-500 transition-colors"
                    >
                      הסר תמונה
                    </button>
                  </div>
                )}
              </section>}

              {/* ── Condition ────────────────────────────────────────── */}
              <section className="bg-white rounded-2xl border border-stone-200 p-5">
                <h2 className="font-bold text-stone-800 mb-4">מצב הספר</h2>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCondition(c.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                        condition === c.value
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-200 hover:border-stone-300 bg-stone-50"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${condition === c.value ? "text-amber-800" : "text-stone-700"}`}>
                        {c.label}
                      </span>
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
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    dir="ltr"
                    className="w-full pr-9 pl-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-xl font-bold text-center"
                    required
                  />
                </div>
                <p className="text-xs text-stone-400 mt-2 text-center">קבע מחיר הוגן לשני הצדדים</p>
              </section>

              {/* ── Error & Submit ────────────────────────────────────── */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {formError}
                  {formError.includes("להתחבר") && (
                    <Link href="/login" className="mr-2 font-semibold underline">
                      כניסה →
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-bold py-4 rounded-2xl text-lg"
              >
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
