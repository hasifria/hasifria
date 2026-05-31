import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות פרטיות — הספרייה",
  description: "מדיניות הפרטיות של הספרייה — כיצד אנו מגינים על המידע האישי שלך.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-[#F0F0F0] mb-8">מדיניות פרטיות</h1>
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-8 text-[#a0a0a0] leading-relaxed space-y-6 text-sm">
          <p className="text-[#888]">עודכן לאחרונה: ינואר 2026</p>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">1. מידע שאנו אוספים</h2>
            <p>
              אנו אוספים את המידע הבא בעת הרשמה לאתר: שם מלא, מספר טלפון וכתובת מגורים.
              מידע זה משמש אך ורק לצורך הפעלת השירות.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">2. שימוש במידע</h2>
            <p>
              המידע האישי שלך משמש ל: הפעלת חשבון המשתמש, הצגת מודעות הספרים שלך, ויצירת קשר
              עם קונים פוטנציאליים דרך וואטסאפ. מספר הטלפון שלך יוצג לקונים המעוניינים ליצור
              עמך קשר.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">3. שיתוף מידע</h2>
            <p>
              אנו לא מוכרים, מסחרים, או מעבירים את המידע האישי שלך לצדדים שלישיים ללא הסכמתך,
              למעט במקרים הנדרשים על פי חוק.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">4. אבטחת מידע</h2>
            <p>
              אנו נוקטים באמצעים סבירים להגנה על המידע האישי שלך. עם זאת, אין ביכולתנו להבטיח
              אבטחה מוחלטת של מידע המועבר דרך האינטרנט.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">5. קובצי Cookie</h2>
            <p>
              האתר משתמש ב-Session Cookie לצורך שמירת מצב ההתחברות. קובצי Cookie אלה נמחקים
              בסוף הפעלת הדפדפן או לאחר 7 ימים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">6. זכויות המשתמש</h2>
            <p>
              יש לך הזכות לבקש גישה, תיקון, או מחיקה של המידע האישי שלך. לפניות בנושא פרטיות,
              אנא צור קשר בכתובת: admin@webmanager.co.il
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#F0F0F0] mb-3">7. שינויים במדיניות</h2>
            <p>
              אנו שומרים לעצמנו את הזכות לעדכן מדיניות פרטיות זו. שינויים מהותיים יפורסמו באתר.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
