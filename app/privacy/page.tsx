import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות פרטיות — הספרייה",
  description: "מדיניות הפרטיות של הספרייה — כיצד אנו אוספים ומגינים על המידע האישי שלך.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-[#F0F0F0] mb-2">מדיניות פרטיות</h1>
        <p className="text-[#555] text-sm mb-8">עודכן לאחרונה: ינואר 2026</p>

        <div className="space-y-1 text-[#a0a0a0] text-sm leading-relaxed">

          <Section n="1" title="מידע שנאסף">
            <p>אנו אוספים את המידע הבא בעת השימוש באתר:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 pr-2">
              <li>
                <strong className="text-[#c0c0c0]">מספר טלפון</strong> — לצורך אימות זהות באמצעות
                קוד SMS חד-פעמי (OTP) בלבד. אין סיסמה, ואין שמירה של הקוד לאחר האימות.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">שם</strong> — שם תצוגה בדף החנות שלך ובמודעות.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">כתובת ועיר</strong> — לצורך הצגת מיקום המוכר לקונים.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">פרטי ספרים</strong> — כותרת, מחבר, מצב, מחיר ותמונת עטיפה
                שהעלית בעצמך.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">נתוני שימוש</strong> — נתונים טכניים אנונימיים
                כגון עמודים שנצפו, זמני גישה, וסוג הדפדפן — לצורך שיפור השירות.
              </li>
            </ul>
          </Section>

          <Section n="2" title="מטרות איסוף המידע">
            <ul className="list-disc list-inside space-y-1.5 pr-2">
              <li>
                <strong className="text-[#c0c0c0]">אימות זהות</strong> — אימות מספר הטלפון שלך בכניסה
                ובהרשמה, למניעת הרשמות פיקטיביות.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">הצגת המפרסם</strong> — הצגת שמך ועירך בדפי הספרים
                שלך, ואפשרות לקונים ליצור עמך קשר בוואטסאפ.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">שיפור השירות</strong> — ניתוח דפוסי שימוש כדי לשפר
                את חוויית המשתמש ואת ביצועי האתר.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">אבטחה</strong> — זיהוי פעילות חשודה ומניעת שימוש
                לרעה בפלטפורמה.
              </li>
            </ul>
          </Section>

          <Section n="3" title="שיתוף מידע עם צדדים שלישיים">
            <p>
              אנו <strong className="text-[#c0c0c0]">אינם מוכרים</strong> את המידע האישי שלך לצדדים
              שלישיים לעולם. מידע אישי עשוי להיות משותף רק במקרים הבאים:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 pr-2">
              <li>
                <strong className="text-[#c0c0c0]">לפי דין</strong> — כאשר נדרשים על-כך על-ידי רשות
                מוסמכת או בית משפט.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">למניעת תרמית</strong> — לגורמי אכיפה, במקרים חריגים
                של חשד לפשע או הונאה.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">לספק SMS</strong> — מספר הטלפון שלך מועבר לשירות
                שליחת ה-SMS (Twilio) לצורך שליחת קוד האימות בלבד, ואינו נשמר אצלם לאחר מכן.
              </li>
            </ul>
          </Section>

          <Section n="4" title="עוגיות (Cookies)">
            <p>האתר משתמש בשני סוגי עוגיות:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 pr-2">
              <li>
                <strong className="text-[#c0c0c0]">עוגיית session</strong> — שומרת את מצב ההתחברות שלך
                בין ביקורים. פגה לאחר 7 ימים או ביציאה. ללא עוגייה זו לא תוכל להתחבר לאתר.
              </li>
              <li>
                <strong className="text-[#c0c0c0]">Google Analytics</strong> — אנו עשויים להשתמש
                ב-Google Analytics לאיסוף נתונים סטטיסטיים אנונימיים על השימוש באתר (עמודים
                פופולריים, מדינות מבקרים וכד׳). נתונים אלה אינם מקושרים לזהותך האישית.
                ניתן לבטל את הצטרפות ל-Analytics באמצעות{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F5A623] hover:underline"
                >
                  הכלי של Google
                </a>.
              </li>
            </ul>
          </Section>

          <Section n="5" title="אבטחת המידע">
            <p>
              אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע האישי שלך, לרבות הצפנת תעבורת הרשת
              (HTTPS), אחסון בבסיס נתונים מאובטח, ומגבלות גישה פנימיות. עם זאת, אין ביכולתנו
              להבטיח אבטחה מוחלטת של כל מידע המועבר דרך האינטרנט. אנא הודע לנו מיידית אם
              אתה חושד בפגיעה באבטחת חשבונך.
            </p>
          </Section>

          <Section n="6" title="משך שמירת המידע">
            <p>
              המידע שלך נשמר כל עוד חשבונך פעיל. אם תבקש למחוק את חשבונך — נמחק את פרטיך
              האישיים (שם, טלפון, כתובת) תוך 30 יום. מודעות שפרסמת יוסרו במקביל. נתוני שימוש
              אנונימיים (ללא קישור לזהותך) עשויים להישמר לצורכי סטטיסטיקה.
            </p>
          </Section>

          <Section n="7" title="זכויות המשתמש">
            <p>כמשתמש, יש לך הזכות ל:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 pr-2">
              <li><strong className="text-[#c0c0c0]">עיון</strong> — לקבל עותק של המידע האישי שנשמר עליך.</li>
              <li><strong className="text-[#c0c0c0]">תיקון</strong> — לתקן מידע שגוי או לא מדויק.</li>
              <li><strong className="text-[#c0c0c0]">מחיקה</strong> — לבקש מחיקת חשבונך וכל המידע הקשור בו.</li>
            </ul>
            <p className="mt-2">
              לכל פנייה בנושאי פרטיות, עיון, תיקון, או מחיקה — פנה אלינו בכתובת:{" "}
              <a href="mailto:admin@hasifria.net" className="text-[#F5A623] hover:underline">
                admin@hasifria.net
              </a>
              . נטפל בפנייתך תוך 30 יום.
            </p>
          </Section>

          <Section n="8" title="שינויים במדיניות">
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו בדף זה עם תאריך העדכון.
              המשך השימוש באתר לאחר פרסום שינויים מהווה הסכמה למדיניות המעודכנת.
            </p>
          </Section>

          <Section n="9" title="פנו אלינו">
            <p>
              לכל שאלה, פנייה, או בקשה בנושא פרטיות — ניתן לפנות אלינו בכתובת:{" "}
              <a href="mailto:admin@hasifria.net" className="text-[#F5A623] hover:underline">
                admin@hasifria.net
              </a>
            </p>
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
