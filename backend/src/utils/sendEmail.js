// backend/src/utils/sendEmail.js
import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  // Тягаем настройки из .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Ethereal не использует SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  console.log("📨 Email sent:", info.messageId);
  console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}
