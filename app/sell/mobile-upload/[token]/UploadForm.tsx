"use client";

import { useState, useRef } from "react";
import ImageCropper from "@/components/ImageCropper";

export default function UploadForm({ token }: { token: string }) {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleConfirm = async (imageData: string) => {
    setRawImage(null);
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/books/cover-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, imageData }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        setError(data.error ?? "שגיאה בהעלאה");
      }
    } catch {
      setError("שגיאת תקשורת. אנא נסה שוב.");
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">העטיפה הועלתה!</h1>
        <p className="text-stone-500 text-sm">ניתן לסגור דף זה ולחזור למחשב</p>
      </div>
    );
  }

  return (
    <>
      {rawImage && (
        <ImageCropper
          src={rawImage}
          onConfirm={handleConfirm}
          onCancel={() => setRawImage(null)}
        />
      )}
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-1">צלם עטיפת ספר</h1>
          <p className="text-stone-500 text-sm mb-8">צלם את עטיפת הספר כדי להוסיפה למודעה</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white font-bold rounded-2xl text-lg transition-colors flex items-center justify-center gap-3"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                מעלה...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                צלם עטיפה
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
