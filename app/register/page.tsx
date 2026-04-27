"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), address: address.trim(), phone }),
    });

    let data: { error?: string; phone?: string } = {};
    try { data = await res.json(); } catch { /* empty */ }
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה. אנא נסה שוב.");
      return;
    }

    router.push(`/verify?phone=${encodeURIComponent(data.phone ?? phone)}&mode=register`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900">הרשמה</h1>
              <p className="text-stone-500 text-sm mt-2">
                מלא את הפרטים כדי להתחיל למכור
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">שם מלא</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">כתובת (עיר / שכונה)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="תל אביב, רמת גן..."
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">מספר טלפון</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm select-none">🇮🇱</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-123-4567"
                    dir="ltr"
                    className="w-full pr-9 pl-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-center tracking-wider"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim() || !address.trim() || !phone}
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-xl"
              >
                {loading ? "שולח..." : "המשך לאימות"}
              </button>
            </form>

            <p className="text-center text-sm text-stone-400 mt-5">
              כבר יש לך חשבון?{" "}
              <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">כניסה</a>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
