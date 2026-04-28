"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/Header";

const FAQ_ITEMS = [
  {
    q: "האם הפרסום באתר בחינם?",
    a: "כן! פרסום מודעות לספרים הוא חינמי לחלוטין. אנחנו לא גובים עמלות מהמוכרים.",
  },
  {
    q: "איך מתבצעת העסקה?",
    a: "לאחר יצירת קשר בין הקונה למוכר דרך וואטסאפ, הצדדים מסכימים על מקום ושעת מפגש להעברת הספר והתשלום.",
  },
  {
    q: "מה קורה אם הספר לא תואם לתיאור?",
    a: "אנחנו ממליצים לבדוק את הספר לפני התשלום. האחריות על העסקה היא בין הקונה למוכר.",
  },
  {
    q: "האם המספר שלי מוצג לציבור?",
    a: "לא. מספר הטלפון שלך לא מוצג ברשימות. רק כאשר קונה לוחץ על כפתור הוואטסאפ נוצר קשר ישיר.",
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToS, setAgreedToS] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToS) { setError("יש לאשר את תנאי השימוש"); return; }
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

    const verifyUrl = `/verify?phone=${encodeURIComponent(data.phone ?? phone)}&mode=register${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""}`;
    router.push(verifyUrl);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#F5A623]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h1 className="text-2xl font-bold text-[#F0F0F0]">הרשמה</h1>
              <p className="text-[#888] text-sm mt-2">מלא את הפרטים כדי להתחיל</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">שם</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">כתובת</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="כתובת (עיר ורחוב בלי דירה)"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-1.5">מספר טלפון</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm select-none">🇮🇱</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-123-4567"
                    dir="ltr"
                    className="w-full pr-9 pl-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] text-[#F0F0F0] placeholder:text-[#555] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition text-center tracking-wider"
                    required
                  />
                </div>
              </div>

              {/* ToS + Privacy */}
              <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 space-y-3">
                <p className="text-xs text-[#888] leading-relaxed">
                  בהרשמה אתה מסכים ל
                  <button type="button" className="text-[#F5A623] hover:underline mx-1">תנאי השימוש</button>
                  ול
                  <button type="button" className="text-[#F5A623] hover:underline mx-1">מדיניות הפרטיות</button>
                  של הספרייה. המידע שלך לא יועבר לצד שלישי ללא הסכמתך.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setAgreedToS(!agreedToS)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0
                      ${agreedToS ? "bg-[#F5A623] border-[#F5A623]" : "bg-transparent border-[#444] hover:border-[#F5A623]"}`}
                  >
                    {agreedToS && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#a0a0a0]">קראתי ואני מסכים לתנאי השימוש</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim() || !address.trim() || !phone}
                className="w-full bg-[#F5A623] hover:bg-[#e0941a] active:bg-[#c07f14] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black font-bold py-3 rounded-xl"
              >
                {loading ? "שולח..." : "המשך לאימות"}
              </button>
            </form>

            <p className="text-center text-sm text-[#555] mt-5">
              כבר יש לך חשבון?{" "}
              <a
                href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="text-[#F5A623] hover:text-[#e0941a] font-medium"
              >
                כניסה
              </a>
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-4 text-center">שאלות נפוצות</h2>
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-right text-[#F0F0F0] font-medium text-sm"
                  >
                    <span>{item.q}</span>
                    <svg
                      className={`w-4 h-4 text-[#888] shrink-0 mr-3 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-[#888] leading-relaxed border-t border-[#2a2a2a]">
                      <p className="pt-3">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
