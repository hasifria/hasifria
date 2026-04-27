"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push(`/verify?phone=${encodeURIComponent(data.phone)}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900">כניסה / הרשמה</h1>
              <p className="text-stone-500 text-sm mt-2">
                הזן את מספר הטלפון שלך ונשלח אליך קוד אימות
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  מספר טלפון
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm select-none">
                    🇮🇱
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-123-4567"
                    dir="ltr"
                    className="w-full pr-9 pl-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition text-center tracking-wider text-lg"
                    required
                    autoFocus
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
                disabled={loading || !phone}
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    שולח...
                  </span>
                ) : "שלח קוד אימות"}
              </button>
            </form>

            <p className="text-center text-xs text-stone-400 mt-6 leading-relaxed">
              בהמשך אתה מסכים ל
              <a href="/terms" className="text-amber-600 hover:underline">תנאי השימוש</a>
              {" "}ול
              <a href="/privacy" className="text-amber-600 hover:underline">מדיניות הפרטיות</a>
            </p>
          </div>

          <p className="text-center text-xs text-stone-400 mt-4">
            קוד לבדיקה: <span className="font-mono font-bold text-stone-500">1234</span>
          </p>
        </div>
      </main>
    </div>
  );
}
