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
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#F5A623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-[#F0F0F0]">כניסה</h1>
              <p className="text-[#888] text-sm mt-2">
                הזן את מספר הטלפון שלך ונשלח אליך קוד אימות
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">
                  מספר טלפון
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none">
                    🇮🇱
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-123-4567"
                    dir="ltr"
                    className="w-full pr-9 pl-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition text-center tracking-wider text-lg"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black font-bold py-3 rounded-xl"
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

            <p className="text-center text-xs text-[#555] mt-6 leading-relaxed">
              אין לך חשבון?{" "}
              <a href="/register" className="text-[#F5A623] hover:text-[#e0941a]">הרשמה</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
