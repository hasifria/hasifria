"use client";

import { useRef, useState, useEffect } from "react";

const CROP_W = 260;
const CROP_H = 390;

export default function ImageCropper({
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
    setTransform(`translate(${cx}px,${cy}px) scale(${s})`);
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const s = Math.max(CROP_W / img.naturalWidth, CROP_H / img.naturalHeight);
    minScaleRef.current = s;
    apply((CROP_W - img.naturalWidth * s) / 2, (CROP_H - img.naturalHeight * s) / 2, s);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let dragging = false, startX = 0, startY = 0, baseTx = 0, baseTy = 0, pinchDist = 0;

    const onMouseDown = (e: MouseEvent) => { dragging = true; startX = e.clientX; startY = e.clientY; baseTx = txRef.current; baseTy = tyRef.current; e.preventDefault(); };
    const onMouseMove = (e: MouseEvent) => { if (dragging) apply(baseTx + e.clientX - startX, baseTy + e.clientY - startY, scaleRef.current); };
    const onMouseUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newS = clamp(scaleRef.current * factor, minScaleRef.current, minScaleRef.current * 4);
      const rect = el.getBoundingClientRect();
      apply(e.clientX - rect.left - (e.clientX - rect.left - txRef.current) * (newS / scaleRef.current), e.clientY - rect.top - (e.clientY - rect.top - tyRef.current) * (newS / scaleRef.current), newS);
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) { dragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; baseTx = txRef.current; baseTy = tyRef.current; }
      else if (e.touches.length === 2) { dragging = false; pinchDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY); }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging) {
        apply(baseTx + e.touches[0].clientX - startX, baseTy + e.touches[0].clientY - startY, scaleRef.current);
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        const newS = clamp(scaleRef.current * dist / pinchDist, minScaleRef.current, minScaleRef.current * 4);
        const rect = el.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        apply(midX - (midX - txRef.current) * (newS / scaleRef.current), midY - (midY - tyRef.current) * (newS / scaleRef.current), newS);
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
    canvas.width = 600; canvas.height = 900;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, -txRef.current / scaleRef.current, -tyRef.current / scaleRef.current, CROP_W / scaleRef.current, CROP_H / scaleRef.current, 0, 0, 600, 900);
    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="p-4 border-b border-stone-200">
          <h3 className="font-bold text-stone-900 text-center">חתוך את התמונה</h3>
          <p className="text-xs text-stone-400 text-center mt-1">גרור להזזה • צבוט/גלגלת לזום</p>
        </div>
        <div className="flex justify-center py-4 bg-stone-100">
          <div ref={containerRef} className="relative overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none" style={{ width: CROP_W, height: CROP_H, touchAction: "none" }}>
            {["top-0 right-0 border-t-2 border-r-2 rounded-tr", "top-0 left-0 border-t-2 border-l-2 rounded-tl", "bottom-0 right-0 border-b-2 border-r-2 rounded-br", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl"].map((cls) => (
              <div key={cls} className={`absolute z-10 w-5 h-5 border-amber-400 pointer-events-none ${cls}`} />
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={src} alt="crop" onLoad={handleImageLoad} draggable={false} className="absolute top-0 left-0 max-w-none pointer-events-none select-none" style={{ transformOrigin: "0 0", transform }} />
          </div>
        </div>
        <div className="p-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors">ביטול</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors">אשר תמונה</button>
        </div>
      </div>
    </div>
  );
}
