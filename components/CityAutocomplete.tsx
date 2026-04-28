"use client";

import { useState, useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCities(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = value.trim().length > 0
    ? cities.filter((c) => c.includes(value.trim()))
    : cities;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input carries the value for form submission */}
      <input type="hidden" name={name} value={value} />

      <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 focus-within:border-[#F5A623] transition min-w-[140px]">
        <svg className="w-4 h-4 text-[#555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="כל הארץ"
          autoComplete="off"
          className="w-full py-2 bg-transparent text-sm outline-none placeholder:text-[#555] text-[#F0F0F0]"
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(""); setOpen(false); }}
            className="text-[#555] hover:text-[#888] shrink-0 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-30 top-full mt-1 w-full max-h-52 overflow-y-auto bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl">
          {value.trim() === "" && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setValue(""); setOpen(false); }}
              className="w-full text-right px-4 py-2.5 text-sm text-[#888] hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]"
            >
              כל הארץ
            </button>
          )}
          {filtered.map((city) => (
            <button
              key={city}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setValue(city); setOpen(false); }}
              className="w-full text-right px-4 py-2.5 text-sm text-[#F0F0F0] hover:bg-[#2a2a2a] transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
