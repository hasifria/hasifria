import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תנאי שימוש — הספרייה",
  description: "תנאי השימוש של הספרייה — פלטפורמה לקנייה ומכירה של ספרים יד שנייה בישראל.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-[#F0F0F0] mb-8">תנאי שימוש</h1>
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-8 text-[#a0a0a0] leading-relaxed space-y-6 text-sm">
          <p className="text-[#888]">עודכן לאחרונה: ינואר 2026</p>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">1. קבלת התנאים</h2>
            <p>
              השימוש באתר הספרייה מהווה הסכמה לתנאי השימוש המפורטים כאן. אם אינך מסכים לתנאים אלה,
              אנא הימנע משימוש באתר.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">2. תיאור השירות</h2>
            <p>
              הספרייה היא פלטפורמה המאפשרת לאנשים פרטיים לרשום, לחפש ולמכור ספרים יד שנייה.
              האתר אינו צד לעסקאות בין הקונה למוכר ואינו אחראי לאיכות המוצרים, לתשלום, או לאספקה.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">3. הרשמה ומידע אישי</h2>
            <p>
              בעת הרשמה תתבקש לספק שם, מספר טלפון וכתובת. מידע זה משמש לצורך הפעלת השירות.
              מספר הטלפון שלך יוצג לקונים פוטנציאליים דרך כפתור הוואטסאפ בדף הספר.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">4. תוכן המודעות</h2>
            <p>
              המשתמש אחראי לדיוק ולאמינות המידע שמסר. אסור לפרסם מוצרים בלתי חוקיים, מוצרים מזויפים
              או תוכן מטעה. האתר שומר לעצמו את הזכות להסיר כל מודעה לפי שיקול דעתו.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">5. אחריות</h2>
            <p>
              האתר אינו אחראי לנזקים שנגרמו כתוצאה מעסקאות בין משתמשים. מומלץ לבדוק את הספר לפני
              ביצוע התשלום ולהיפגש במקומות ציבוריים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">6. שינויים בתנאים</h2>
            <p>
              האתר שומר לעצמו את הזכות לשנות תנאים אלה בכל עת. המשך השימוש באתר לאחר שינוי התנאים
              מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">7. יצירת קשר</h2>
            <p>
              לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו בכתובת: admin@webmanager.co.il
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
