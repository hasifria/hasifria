"use client";

import { useState, useEffect } from "react";

type Listing = {
  id: string;
  status: "available" | "sold";
  price: string | null;
  condition: string;
  created_at: string;
  book: { id: string; title: string; author: string };
  seller: { id: string; name: string | null; phone: string };
};

const CONDITION_LABELS: Record<string, string> = {
  new: "כמו חדש",
  good: "מצב טוב",
  worn: "מצב סביר",
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState<"available" | "sold">("available");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/listings")
      .then((r) => r.json())
      .then((data) => { setListings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = (l: Listing) => {
    setEditingId(l.id);
    setEditPrice(l.price !== null ? String(Number(l.price)) : "");
    setEditStatus(l.status);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/listings/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          price: editPrice === "" ? null : editPrice,
        }),
      });
      if (res.ok) {
        setListings((prev) => prev.map((l) =>
          l.id === editingId ? { ...l, status: editStatus, price: editPrice === "" ? null : editPrice } : l
        ));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async (id: string) => {
    if (!window.confirm("למחוק מודעה זו?")) return;
    const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    if (res.ok) setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const visible = filter
    ? listings.filter((l) =>
        l.book.title.toLowerCase().includes(filter.toLowerCase()) ||
        l.book.author.toLowerCase().includes(filter.toLowerCase()) ||
        (l.seller.name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
        l.seller.phone.includes(filter)
      )
    : listings;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F0F0F0]">
          מודעות ({listings.filter((l) => l.status === "available").length} זמינות / {listings.length} סה"כ)
        </h1>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="חפש לפי ספר, מוכר..."
          className="px-4 py-2 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm w-72"
        />
      </div>

      {loading ? (
        <div className="text-[#555] text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {visible.map((l) => (
            <div key={l.id} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F0F0F0] text-sm truncate">{l.book.title}</p>
                  <p className="text-xs text-[#888] truncate">{l.book.author}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "available" ? "bg-emerald-900/40 text-emerald-400" : "bg-[#2a2a2a] text-[#555]"}`}>
                      {l.status === "available" ? "זמין" : "נמכר"}
                    </span>
                    <span className="text-xs text-[#555]">{CONDITION_LABELS[l.condition] ?? l.condition}</span>
                    <span className="text-xs font-bold text-[#F5A623]">
                      {l.price !== null ? `₪${Number(l.price)}` : "חינם"}
                    </span>
                    <span className="text-xs text-[#555]">{l.seller.name ?? l.seller.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => editingId === l.id ? setEditingId(null) : startEdit(l)}
                    className="px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] hover:border-[#F5A623] text-[#888] hover:text-[#F5A623] rounded-lg transition-colors"
                  >
                    {editingId === l.id ? "ביטול" : "ערוך"}
                  </button>
                  <button
                    onClick={() => deleteListing(l.id)}
                    className="px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] hover:border-red-700 text-[#888] hover:text-red-400 rounded-lg transition-colors"
                  >
                    מחק
                  </button>
                </div>
              </div>

              {editingId === l.id && (
                <div className="border-t border-[#2a2a2a] p-4 bg-[#141414] flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-[#555] mb-1">מחיר (ריק = חינם)</label>
                    <input
                      type="number"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm w-32"
                      placeholder="חינם"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#555] mb-1">סטטוס</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as "available" | "sold")}
                      className="px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm"
                    >
                      <option value="available">זמין</option>
                      <option value="sold">נמכר</option>
                    </select>
                  </div>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-5 py-2 bg-[#F5A623] hover:bg-[#e0941a] disabled:opacity-60 text-black text-sm font-bold rounded-xl transition-colors"
                  >
                    {saving ? "שומר..." : "שמור"}
                  </button>
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && !loading && (
            <p className="text-center text-[#555] py-10 text-sm">לא נמצאו מודעות</p>
          )}
        </div>
      )}
    </div>
  );
}
