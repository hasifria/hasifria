"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string | null;
  phone: string;
  city: string | null;
  created_at: string;
  terms_accepted_at: string | null;
  is_blocked: boolean;
  _count: { listings: number };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isThisWeek(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = filter
    ? users.filter((u) =>
        (u.name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
        u.phone.includes(filter) ||
        (u.city ?? "").toLowerCase().includes(filter.toLowerCase())
      )
    : users;

  const totalListings = users.reduce((s, u) => s + u._count.listings, 0);
  const registeredThisWeek = users.filter((u) => isThisWeek(u.created_at)).length;
  const uniqueCities = new Set(users.map((u) => u.city).filter(Boolean)).size;

  const toggleBlock = async (user: User) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_blocked: !user.is_blocked }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const deleteUser = async (id: string, name: string | null) => {
    if (!window.confirm(`למחוק את המשתמש ${name ?? id}? פעולה זו תמחק גם את כל מודעותיו.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    const header = ["שם", "טלפון", "עיר", "תאריך הרשמה", "הסכמה לתנאי שימוש", "ספרים פורסמו", "חסום"];
    const rows = users.map((u) => [
      u.name ?? "",
      u.phone,
      u.city ?? "",
      formatDate(u.created_at),
      u.terms_accepted_at ? `כן – ${formatDate(u.terms_accepted_at)}` : "לא",
      String(u._count.listings),
      u.is_blocked ? "כן" : "לא",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סה"כ משתמשים', value: users.length },
          { label: "נרשמו השבוע", value: registeredThisWeek },
          { label: "ערים שונות", value: uniqueCities },
          { label: 'ספרים פורסמו סה"כ', value: totalListings },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#F5A623]">{stat.value}</p>
            <p className="text-xs text-[#888] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-[#F0F0F0]">משתמשים</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="חפש לפי שם, טלפון, עיר..."
            className="px-4 py-2 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] transition text-sm w-64"
          />
          <button
            onClick={exportCsv}
            className="px-4 py-2 text-sm font-medium bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F0F0F0] rounded-xl transition-colors border border-[#3a3a3a]"
          >
            ייצא לאקסל
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[#555] text-sm">טוען...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="bg-[#141414] text-[#888]">
                {["שם", "טלפון", "עיר", "תאריך הרשמה", "הסכמה לתנאי שימוש", "ספרים פורסמו", "פעולות"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} className={`border-t border-[#2a2a2a] ${u.is_blocked ? "bg-red-950/20" : "hover:bg-[#1a1a1a]"} transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#F0F0F0] font-medium">{u.name ?? "—"}</span>
                      {u.is_blocked && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-400 font-medium">חסום</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#888] font-mono text-xs">{u.phone}</td>
                  <td className="px-4 py-3 text-[#888]">{u.city ?? "—"}</td>
                  <td className="px-4 py-3 text-[#888] whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {u.terms_accepted_at ? (
                      <span className="text-emerald-400">כן – {formatDate(u.terms_accepted_at)}</span>
                    ) : (
                      <span className="text-[#555]">לא</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[#F5A623] font-bold">{u._count.listings}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleBlock(u)}
                        disabled={togglingId === u.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                          u.is_blocked
                            ? "border-emerald-800 text-emerald-400 hover:bg-emerald-900/20"
                            : "border-[#3a3a3a] text-[#888] hover:border-red-700 hover:text-red-400"
                        } disabled:opacity-50`}
                      >
                        {togglingId === u.id ? "..." : u.is_blocked ? "בטל חסימה" : "חסום"}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        disabled={deletingId === u.id}
                        className="px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] hover:border-red-700 text-[#888] hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === u.id ? "..." : "מחק"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#555]">לא נמצאו משתמשים</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
