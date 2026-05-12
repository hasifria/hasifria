"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Pos = { top: number; left: number; width: number };

export default function CityAutocomplete({
  defaultValue = "",
  name = "city",
}: {
  defaultValue?: string;
  name?: string;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCities(data); })
      .catch(() => {});
  }, []);

  // Close on outside mousedown or touchstart
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Calculate fixed position from the container's viewport rect
  const measurePos = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  const openDropdown = useCallback(() => {
    measurePos();
    setOpen(true);
  }, [measurePos]);

  const selectCity = useCallback((city: string) => {
    setValue(city);
    setOpen(false);
  }, []);

  const clearCity = useCallback(() => {
    setValue("");
    measurePos();
    setTimeout(() => setOpen(true), 0);
  }, [measurePos]);

  const filtered = value.trim().length > 0
    ? cities.filter((c) => c.includes(value.trim()))
    : cities;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input carries value for form submission */}
      <input type="hidden" name={name} value={value} />

      <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 focus-within:border-[#F5A623] transition min-w-[140px]">
        <svg className="w-4 h-4 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); openDropdown(); }}
          onFocus={openDropdown}
          onClick={openDropdown}
          placeholder="כל הארץ"
          autoComplete="off"
          className="w-full py-2 bg-transparent text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); clearCity(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); clearCity(); }}
            className="text-[#555] hover:text-[#888] shrink-0 p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown rendered with fixed positioning to escape stacking contexts */}
      {open && filtered.length > 0 && (
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="max-h-64 overflow-y-auto bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl"
        >
          {value.trim() === "" && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCity("")}
              onTouchEnd={(e) => { e.preventDefault(); selectCity(""); }}
              className="w-full text-right px-4 text-sm text-[#888] hover:bg-[#2a2a2a] active:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a] flex items-center min-h-[44px]"
            >
              כל הארץ
            </button>
          )}
          {filtered.map((city) => (
            <button
              key={city}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCity(city)}
              onTouchEnd={(e) => { e.preventDefault(); selectCity(city); }}
              className="w-full text-right px-4 text-sm text-[#F0F0F0] hover:bg-[#2a2a2a] active:bg-[#2a2a2a] transition-colors flex items-center min-h-[44px]"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
