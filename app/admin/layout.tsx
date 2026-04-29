import Link from "next/link";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";

const ADMIN_TABS = [
  { href: "/admin/seo",      label: "SEO" },
  { href: "/admin/books",    label: "ספרים" },
  { href: "/admin/listings", label: "מודעות" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth check inline — no helper dependency
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.userId) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-8 text-center" dir="rtl">
        <div>
          <p className="text-2xl mb-4">🔒</p>
          <p className="text-[#888] text-sm mb-4">יש להתחבר תחילה</p>
          <Link href="/login?redirect=/admin/seo" className="text-[#F5A623] hover:underline text-sm">כניסה</Link>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });
  const superPhone = process.env.SUPER_USER_PHONE;

  if (!superPhone) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-8 text-center" dir="rtl">
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-8 max-w-sm">
          <p className="text-2xl mb-3">⚠️</p>
          <p className="text-red-400 font-bold mb-2">SUPER_USER_PHONE לא מוגדר</p>
          <p className="text-[#888] text-sm">הוסף את המשתנה SUPER_USER_PHONE ל-.env ול-Vercel Environment Variables</p>
        </div>
      </div>
    );
  }

  if (!user || user.phone !== superPhone) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-8 text-center" dir="rtl">
        <div>
          <p className="text-2xl mb-4">⛔</p>
          <p className="text-[#888] text-sm">אין הרשאה לדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <div className="bg-[#141414] border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 py-2">
          {ADMIN_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-4 py-2 text-sm rounded-lg text-[#888] hover:text-[#F0F0F0] hover:bg-[#2a2a2a] transition-colors font-medium"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
