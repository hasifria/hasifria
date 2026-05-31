import Link from "next/link";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | הספריה",
  description: "מדיניות הפרטיות של אתר הספריה — כיצד אנו אוספים, משתמשים ומגינים על המידע של משתמשינו.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-[#F5A623] transition-colors mb-8">
          ← חזרה
        </Link>

        <h1 className="text-3xl font-bold text-[#F0F0F0] mb-1">מדיניות הפרטיות של אתר הספריה</h1>
        <p className="text-[#555] text-sm mb-8">עדכון אחרון: מאי 2026</p>

        <div className="space-y-2 text-sm text-[#a0a0a0] leading-relaxed">

          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6 space-y-2">
            <p>
              במדיניות זו נסביר כיצד אתר הספריה (להלן: האתר) אוסף, משתמש ומגן על המידע של משתמשיו.
            </p>
            <ul className="list-disc list-inside space-y-1 pr-1">
              <li>המדיניות מנוסחת בלשון זכר מטעמי נוחות בלבד וחלה על כל המגדרים.</li>
              <li>אם אינך מסכים למדיניות פרטיות זו, הנך נדרש להפסיק את השימוש באתר.</li>
              <li>
                בכל שאלה הנוגעת למדיניות הפרטיות ניתן לפנות אלינו בכתובת:{" "}
                <a href="mailto:admin@hasifria.net" className="text-[#F5A623] hover:underline">
                  admin@hasifria.net
                </a>
              </li>
            </ul>
          </div>

          <Section n="1" title="מידע שנאסף מהמשתמשים">
            <p className="font-medium text-[#c0c0c0]">א. מידע שנמסר מרצון בעת ההרשמה:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 pr-1">
              <li>מספר טלפון סלולארי — לצורך אימות זהות בלבד באמצעות קוד חד-פעמי (SMS OTP)</li>
              <li>שם פרטי ושם משפחה</li>
              <li>כתובת מגורים ועיר</li>
              <li>פרטי ספרים שמפרסם המשתמש</li>
            </ul>
            <p className="font-medium text-[#c0c0c0] mt-3">ב. מידע הנאסף אוטומטית:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 pr-1">
              <li>כתובת IP ונתוני מכשיר (סוג דפדפן, מערכת הפעלה)</li>
              <li>מידע גאוגרפי כללי לצורך הצגת ספרים באזור המשתמש</li>
              <li>דפים שנצפו, זמן שהייה ונתיב גלישה — לצורכי שיפור השירות</li>
            </ul>
            <p className="mt-3 text-[#888]">
              האתר אינו אוסף סיסמאות. הכניסה לאתר מתבצעת באמצעות קוד SMS חד-פעמי בלבד.<br />
              מסירת פרטים שגויים או של אדם אחר ללא הרשאה מהווה הפרת תנאי השימוש ועבירה על החוק.
            </p>
          </Section>

          <Section n="2" title="מטרות איסוף המידע">
            <ul className="list-disc list-inside space-y-1 pr-1">
              <li>אימות זהות המשתמש בעת כניסה לאתר</li>
              <li>הצגת פרטי המפרסם לצד מודעות הספרים</li>
              <li>שיפור חוויית השימוש והתפעול השוטף</li>
              <li>מניעת שימוש לרעה ואבטחת האתר</li>
              <li>מענה לפניות תמיכה</li>
            </ul>
          </Section>

          <Section n="3" title="שיתוף מידע עם צדדים שלישיים">
            <p>האתר לא ימכור, ישכיר או ישתף מידע אישי עם צדדים שלישיים למטרות מסחריות.</p>
            <p className="mt-2">מידע אישי עשוי להיות משותף רק במקרים הבאים:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 pr-1">
              <li>לפי דרישות כל דין או צו שיפוטי</li>
              <li>לצורכי הליכים משפטיים</li>
              <li>לשם מניעה או טיפול בתרמית, הונאה, שימוש לרעה או סוגיות אבטחה</li>
              <li>ספק שליחת SMS — לצורך משלוח קוד אימות בלבד, ללא שמירת נתונים מצידו</li>
              <li>בהסכמה מפורשת של המשתמש</li>
            </ul>
          </Section>

          <Section n="4" title="עוגיות וטכנולוגיות מוטמעות">
            <ul className="list-disc list-inside space-y-1 pr-1">
              <li>האתר עשוי להשתמש בעוגיות (cookies) לצורך שמירת הגדרות המשתמש ושיפור חווית השימוש.</li>
              <li>ניתן לנטרל עוגיות בהגדרות הדפדפן, אך הדבר עשוי להשפיע על תפקוד חלק מתכונות האתר.</li>
              <li>האתר עשוי להשתמש בכלי ניתוח סטטיסטי (כגון Google Analytics) לצורכי שיפור השירות — מידע זה אינו מזהה אישית.</li>
            </ul>
          </Section>

          <Section n="5" title="אבטחת המידע">
            <ul className="list-disc list-inside space-y-1 pr-1">
              <li>האתר נוקט אמצעי אבטחה מקובלים להגנה על המידע האישי.</li>
              <li>הגישה למידע מוגבלת לאנשים הזקוקים לו לצורך מתן השירות בלבד.</li>
              <li>מספרי טלפון מאוחסנים בצורה מאובטחת ואינם חשופים לציבור.</li>
              <li>
                המשתמש מתבקש לדווח על כל חשד לפעילות חריגה לכתובת:{" "}
                <a href="mailto:admin@hasifria.net" className="text-[#F5A623] hover:underline">
                  admin@hasifria.net
                </a>
              </li>
            </ul>
          </Section>

          <Section n="6" title="משך שמירת המידע">
            <ul className="list-disc list-inside space-y-1 pr-1">
              <li>המידע ישמר כל עוד המשתמש עושה שימוש באתר.</li>
              <li>לאחר מחיקת החשבון, מידע בסיסי עשוי להישמר לתקופה הנדרשת לצרכים משפטיים ואבטחה.</li>
              <li>קודי SMS חד-פעמיים אינם נשמרים לאחר שימוש.</li>
            </ul>
          </Section>

          <Section n="7" title="זכויות המשתמש">
            <p>על פי חוק הגנת הפרטיות, התשמ&quot;א – 1981, כל משתמש זכאי:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pr-1">
              <li>לעיין במידע שנשמר אודותיו</li>
              <li>לבקש תיקון מידע שגוי או חלקי</li>
              <li>לבקש מחיקת מידע אישי</li>
            </ul>
            <p className="mt-2">
              לבקשות עיון, תיקון או מחיקה יש לפנות בכתב לכתובת:{" "}
              <a href="mailto:admin@hasifria.net" className="text-[#F5A623] hover:underline">
                admin@hasifria.net
              </a>
            </p>
            <p className="mt-1 text-[#555]">
              גם לאחר בקשת מחיקה, חלק מהמידע עשוי להישמר לצרכים משפטיים ולפי דרישות הדין.
            </p>
          </Section>

          <Section n="8" title="שינויים במדיניות">
            <ul className="list-disc list-inside space-y-1 pr-1">
              <li>האתר רשאי לעדכן מדיניות זו מעת לעת.</li>
              <li>שינויים מהותיים יפורסמו באתר עם עדכון תאריך &quot;עדכון אחרון&quot; בראש המסמך.</li>
              <li>המשך השימוש באתר לאחר הפרסום מהווה הסכמה לשינויים.</li>
            </ul>
          </Section>

          <Section n="9" title="פנו אלינו">
            <p>לכל שאלה, בקשה או תלונה הנוגעת למדיניות הפרטיות:</p>
            <p className="mt-2">
              דוא&quot;ל:{" "}
              <a href="mailto:admin@hasifria.net" className="text-[#F5A623] hover:underline">
                admin@hasifria.net
              </a>
            </p>
            <p className="mt-1 text-[#555]">נשתדל להגיב לכל פנייה תוך 14 ימי עסקים.</p>
          </Section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6 space-y-2">
      <h2 className="text-base font-bold text-[#F0F0F0]">{n}. {title}</h2>
      {children}
    </div>
  );
}
