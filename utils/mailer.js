import nodemailer from "nodemailer";
import { buildBookingEmail } from "./email-templates.js";

export function makeTransport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure =
    (process.env.SMTP_SECURE ?? "").toString().toLowerCase() === "true"
      ? true
      : port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // <-- make sure no spaces if using Gmail App Password
    },
    tls: { minVersion: "TLSv1.2" }, // optional hardening
  });
}

export async function sendBookingEmails({
  studentEmail,
  studentName,
  therapistEmail,
  therapistName,
  dateLabel,
  timeLabel,
  timezone = "UTC",
  sessionType = "Online",
  topic,
  joinLink,
  locationAddress,
  manageLink,
}) {
  const transporter = makeTransport();
  const messages = [];

  // build only if studentEmail exists
  if (studentEmail) {
    const pkg = buildBookingEmail({
      recipientRole: "student",
      studentName,
      therapistName,
      dateLabel,
      timeLabel,
      timezone,
      sessionType,
      topic,
      joinLink,
      locationAddress,
      manageLink,
      durationMinutes: 45,
    });

    messages.push({
      to: studentEmail,
      subject: pkg.subject,
      html: pkg.html,
      text: pkg.text,
      from:
        process.env.MAIL_FROM ||
        process.env.EMAIL_FROM ||
        `"Counselling" <no-reply@yourapp.com>`,
    });
  }

  // build only if therapistEmail exists
  if (therapistEmail) {
    const pkg = buildBookingEmail({
      recipientRole: "therapist",
      studentName,
      therapistName,
      dateLabel,
      timeLabel,
      timezone,
      sessionType,
      topic,
      joinLink,
      locationAddress,
      manageLink,
      durationMinutes: 45,
    });

    messages.push({
      to: therapistEmail,
      subject: pkg.subject,
      html: pkg.html,
      text: pkg.text,
      from:
        process.env.MAIL_FROM ||
        process.env.EMAIL_FROM ||
        `"Counselling" <no-reply@yourapp.com>`,
    });
  }

  for (const msg of messages) {
    try {
      await transporter.sendMail(msg);
    } catch (e) {
      console.error("Email send failed:", msg.to, e);
    }
  }
}
