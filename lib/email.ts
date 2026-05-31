import nodemailer from "nodemailer";

export async function sendNewUserEmail(user: {
  name: string | null;
  phone: string;
  city: string | null;
  address: string | null;
}) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !smtpUser || !pass) return;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: smtpUser, pass },
  });

  const registrationTime = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
  const location = user.city ?? user.address?.split(/[,،]/)[0]?.trim() ?? "לא צוין";

  await transporter.sendMail({
    from: smtpUser,
    to: "admin@webmanager.co.il",
    subject: "משתמש חדש נרשם לספרייה",
    text: [
      `שם: ${user.name ?? "לא צוין"}`,
      `טלפון: ${user.phone}`,
      `עיר: ${location}`,
      `זמן הרשמה: ${registrationTime}`,
      `הסכים לתנאי שימוש: כן`,
    ].join("\n"),
  });
}
