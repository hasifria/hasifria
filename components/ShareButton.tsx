"use client";

import { useState } from "react";

export default function ShareButton({
  title,
  url,
  className = "",
}: {
  title: string;
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = url ?? window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch { /* user cancelled */ }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={share}
      aria-label="שתף"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
        ${copied
          ? "bg-[#4ECDC4]/20 text-[#4ECDC4]"
          : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#a0a0a0] hover:text-[#F0F0F0]"
        } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          הועתק!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          שתף
        </>
      )}
    </button>
  );
}
