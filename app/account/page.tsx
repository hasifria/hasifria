"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";

const ISRAELI_CITIES = [
  "אבן יהודה", "אור יהודה", "אור עקיבא", "אילת", "אלעד",
  "אריאל", "אשדוד", "אשקלון", "באר שבע", "בית שאן",
  "בית שמש", "בני ברק", "בת ים", "גבעתיים", "גדרה",
  "דימונה", "הוד השרון", "הרצליה", "חדרה", "חולון",
  "חיפה", "יבנה", "ירושלים", "כפר סבא", "כרמיאל",
  "לוד", "מודיעין-מכבים-רעות", "מגדל העמק", "מעלה אדומים",
  "נהריה", "נס ציונה", "נצרת", "נשר", "נתיבות", "נתניה",
  "עכו", "עפולה", "פתח תקווה", "צפת", "קריית אונו",
  "קריית ביאליק", "קריית גת", "קריית ים", "קריית מוצקין",
  "קריית שמונה", "ראש העין", "ראשון לציון", "רחובות",
  "רמלה", "רמת גן", "רמת השרון", "רעננה", "שדרות",
  "תל אביב-יפו",
];

type User = {
  id: string;
  name: string | null;
  phone: string;
  city: string | null;
  address: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.id) {
          router.replace("/login?redirect=/account");
          return;
        }
        setUser(data);
        setName(data.name ?? "");
        setCity(data.city ?? "");
        setAddress(data.address ?? "");
        setLoading(false);
      })
      .catch(() => router.replace("/login?redirect=/account"));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!name.trim()) { setError("יש להזין שם"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), city, address: address.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "שגיאה בשמירה");
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("שגיאת תקשורת. אנא נסה שוב.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f0f]" />;

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]" dir="rtl">
      <Header />
      <main className="flex-1 px-4 py-10">
        <div className="max-w-sm mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#F0F0F0]">החשבון שלי</h1>
            <p className="text-[#888] text-sm mt-1">עדכן את הפרטים שלך</p>
          </div>

          <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">שם</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">עיר</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                >
                  <option value="">בחר עיר</option>
                  {ISRAELI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">כתובת</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="רחוב ומספר בית"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">טלפון</label>
                <input
                  type="tel"
                  value={user?.phone ?? ""}
                  readOnly
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#141414] text-[#555] outline-none cursor-not-allowed text-center tracking-wider"
                />
                <p className="text-xs text-[#555] mt-1">מספר הטלפון אינו ניתן לשינוי</p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-900/30 border border-emerald-800 rounded-xl px-4 py-3 text-sm text-emerald-400">
                  הפרטים עודכנו בהצלחה ✓
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black font-bold py-3 rounded-xl"
              >
                {saving ? "שומר..." : "שמור"}
              </button>
            </form>
          </div>

          {user && (
            <div className="mt-4 text-center">
              <Link
                href={`/seller/${user.phone}`}
                className="text-sm text-[#888] hover:text-[#F5A623] transition-colors"
              >
                לצפייה בחנות שלי ←
              </Link>
            </div>
          )}
        </div>
      </main>
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-[#555] py-8 px-4 text-center text-sm">
        <p>© 2026 הספריה — קנה ומכור ספרים יד שניה בישראל</p>
      </footer>
    </div>
  );
}
