"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/Header";

function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}-****${phone.slice(-3)}`;
}

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const isRegisterMode = params.get("mode") === "register";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");
    if (value && index < 5) inputRefs[index + 1].current?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === "ArrowRight" && index > 0) inputRefs[index - 1].current?.focus();
    if (e.key === "ArrowLeft" && index < 5) inputRefs[index + 1].current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs[focusIndex].current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) {
      setError("יש להזין את כל 6 הספרות");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });

    let data: { error?: string; success?: boolean; phone?: string; isRegistration?: boolean } = {};
    try {
      data = await res.json();
    } catch {
      setLoading(false);
      setError("שגיאת תקשורת. אנא נסה שוב.");
      return;
    }

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה לא ידועה. אנא נסה שוב.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
      return;
    }

    if (data.isRegistration && data.phone) {
      router.push(`/seller/${encodeURIComponent(data.phone)}`);
    } else {
      router.push("/");
    }
    router.refresh();
  }

  async function handleResend() {
    if (resendCooldown > 0 || !phone) return;
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setResendCooldown(30);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    inputRefs[0].current?.focus();
  }

  const isComplete = digits.every(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            {/* Icon + title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900">קוד אימות</h1>
              <p className="text-stone-500 text-sm mt-2">
                שלחנו קוד בן 6 ספרות למספר
              </p>
              <p className="text-stone-800 font-semibold mt-1 dir-ltr" dir="ltr">
                {maskPhone(phone)}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* OTP boxes — LTR order */}
              <div className="flex justify-center gap-2 mb-2" dir="ltr">
                {digits.map((digit: any, i: any) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                      ${digit ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-200 bg-stone-50 text-stone-900"}
                      ${error ? "border-red-400 bg-red-50" : ""}
                      focus:border-amber-500 focus:ring-2 focus:ring-amber-100`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isComplete}
                className="w-full mt-6 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    מאמת...
                  </span>
                ) : "אמת קוד"}
              </button>
            </form>

            {/* Resend */}
            {!isRegisterMode && (
              <div className="text-center mt-5 text-sm text-stone-500">
                לא קיבלת קוד?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-amber-600 hover:text-amber-700 font-medium disabled:text-stone-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `שלח שוב (${resendCooldown}s)` : "שלח שוב"}
                </button>
              </div>
            )}

            <button
              onClick={() => router.push(isRegisterMode ? "/register" : "/login")}
              className="w-full mt-3 text-sm text-stone-400 hover:text-stone-600 transition-colors text-center"
            >
              ← {isRegisterMode ? "חזור להרשמה" : "שנה מספר טלפון"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
