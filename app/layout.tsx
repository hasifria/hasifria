import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "הספרייה - ספרים יד שנייה",
  description: "קנה ומכור ספרים יד שנייה בישראל. מצא ספרים במחירים נוחים ממוכרים פרטיים בכל רחבי הארץ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-heebo antialiased">
        {children}
      </body>
    </html>
  );
}
