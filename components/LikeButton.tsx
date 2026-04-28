"use client";

import { useState, useEffect } from "react";

// Module-level cache shared across all LikeButton instances on the page
let likesCache: Set<string> | null = null;
let likesFetchPromise: Promise<Set<string>> | null = null;

function fetchLikes(): Promise<Set<string>> {
  if (likesCache !== null) return Promise.resolve(likesCache);
  if (likesFetchPromise) return likesFetchPromise;

  likesFetchPromise = fetch("/api/likes")
    .then((r) => {
      if (!r.ok) return { likedIds: [] };
      return r.json();
    })
    .then((data) => {
      const ids = new Set<string>(Array.isArray(data.likedIds) ? data.likedIds : []);
      likesCache = ids;
      likesFetchPromise = null;
      return ids;
    })
    .catch(() => {
      likesFetchPromise = null;
      return new Set<string>();
    });

  return likesFetchPromise;
}

export function invalidateLikesCache() {
  likesCache = null;
  likesFetchPromise = null;
}

export default function LikeButton({ listingId, className = "" }: { listingId: string; className?: string }) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikes().then((ids) => {
      setLiked(ids.has(listingId));
      setLoading(false);
    });
  }, [listingId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !liked;
    setLiked(next);

    // Update cache optimistically
    if (likesCache) {
      if (next) likesCache.add(listingId);
      else likesCache.delete(listingId);
    }

    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    if (res.status === 401) {
      setLiked(!next);
      if (likesCache) {
        if (!next) likesCache.add(listingId);
        else likesCache.delete(listingId);
      }
      window.location.href = "/register";
      return;
    }

    if (!res.ok) {
      // Revert on error
      setLiked(!next);
      if (likesCache) {
        if (!next) likesCache.add(listingId);
        else likesCache.delete(listingId);
      }
    }
  };

  if (loading) {
    return (
      <button className={`p-1.5 rounded-full bg-[#2a2a2a] ${className}`} disabled aria-label="טוען...">
        <svg className="w-4 h-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={liked ? "הסר מהשמורים" : "שמור"}
      className={`p-1.5 rounded-full transition-all ${liked ? "bg-[#FF4757]/20" : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"} ${className}`}
    >
      <svg
        className={`w-4 h-4 transition-colors ${liked ? "text-[#FF4757]" : "text-[#888]"}`}
        fill={liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
