"use client";

import { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop(): void } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("@zxing/browser").then(({ BrowserMultiFormatReader }) => {
      if (cancelled) return;
      const reader = new BrowserMultiFormatReader();
      reader
        .decodeFromVideoDevice(undefined, videoRef.current!, async (result, _err, controls) => {
          if (!controlsRef.current) controlsRef.current = controls;
          if (result) {
            controls.stop();
            onScan(result.getText());
          }
        })
        .catch((err: unknown) => {
          if (
            err instanceof Error &&
            (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
          ) {
            setPermissionDenied(true);
          } else {
            console.error(err);
          }
        });
    });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onScan]);

  if (permissionDenied) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-white text-sm leading-relaxed mb-6">
          נדרשת הרשאת מצלמה לסריקת ברקוד. אנא אפשר גישה למצלמה בהגדרות הדפדפן ורענן את הדף
        </p>
        <button
          onClick={() => location.reload()}
          className="px-6 py-3 bg-[#F5A623] hover:bg-[#e0941a] text-black font-bold rounded-2xl transition-colors"
        >
          רענן דף
        </button>
        <button
          onClick={onClose}
          className="mt-4 text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          ביטול
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h2 className="text-white font-bold text-lg">סרוק ברקוד</h2>
        <button
          onClick={() => { controlsRef.current?.stop(); onClose(); }}
          className="text-white text-xl w-10 h-10 flex items-center justify-center rounded-full bg-white/20"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-44 border-2 border-amber-400 rounded-xl">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-400/70 animate-pulse" />
            {/* Corner accents */}
            {["top-0 left-0 border-t-4 border-l-4 rounded-tl-lg", "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg"].map((cls) => (
              <div key={cls} className={`absolute w-6 h-6 border-amber-300 ${cls}`} />
            ))}
          </div>
        </div>
        {/* Dim overlay outside frame */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 290px 180px at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)" }} />
      </div>

      <div className="p-6 text-center">
        <p className="text-white/70 text-sm">כוון את ברקוד הספר לתוך המסגרת</p>
      </div>
    </div>
  );
}
