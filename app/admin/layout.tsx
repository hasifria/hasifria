import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { requireSuperUser } from "@/lib/superuser";

const ADMIN_TABS = [
  { href: "/admin/seo",      label: "SEO" },
  { href: "/admin/books",    label: "ספרים" },
  { href: "/admin/listings", label: "מודעות" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const su = await requireSuperUser();
  if (!su) redirect("/");

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
