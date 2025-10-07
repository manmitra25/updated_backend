// src/utils/email-templates.js
export function buildBookingEmail({
  recipientRole = "student", // "student" | "therapist"
  studentName = "Student",
  therapistName = "Therapist",
  dateLabel,                 // e.g., "2025-10-02" or "Thu, Oct 2, 2025"
  timeLabel,                 // e.g., "10:00 AM"
  timezone = "UTC",          // e.g., "Asia/Kolkata"
  sessionType = "Online",    // "Online" | "In-person"
  topic,                     // e.g., "Stress / Anxiety"
  durationMinutes = 45,
  joinLink,                  // for online sessions
  locationAddress,           // for in-person sessions
  manageLink,                // booking management URL
  supportEmail = "manmitra25@gmail.com",
  brand = {
    appName: "Counselling",
    logoUrl: "https://yourapp.com/logo.png",
    primaryHex: "#3B82F6",
  },
}) {
  const title = "Your session is confirmed";
  const subject =
    recipientRole === "therapist"
      ? `New session confirmed with ${studentName} — ${dateLabel} at ${timeLabel}`
      : `Session confirmed — ${dateLabel} at ${timeLabel}`;

  const ctaPrimaryLabel =
    sessionType.toLowerCase() === "online" ? "Join Session" : "View Details";

  const sessionLine =
    sessionType.toLowerCase() === "online"
      ? `<a href="${joinLink}" style="color:${brand.primaryHex}; text-decoration:none;">Join link</a>`
      : `${escapeHtml(locationAddress || "Location TBA")}`;

  const whoLine =
    recipientRole === "therapist"
      ? `<strong>Client:</strong> ${escapeHtml(studentName)}`
      : `<strong>Therapist:</strong> ${escapeHtml(therapistName)}`;

  const detailsRows = `
    <tr>
      <td style="padding:8px 0;"><strong>Date:</strong></td>
      <td style="padding:8px 0;">${escapeHtml(dateLabel)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;"><strong>Time:</strong></td>
      <td style="padding:8px 0;">${escapeHtml(timeLabel)} <span style="color:#6b7280;">(${escapeHtml(timezone)})</span></td>
    </tr>
    <tr>
      <td style="padding:8px 0;"><strong>Duration:</strong></td>
      <td style="padding:8px 0;">${durationMinutes} minutes</td>
    </tr>
    <tr>
      <td style="padding:8px 0;"><strong>Session type:</strong></td>
      <td style="padding:8px 0;">${escapeHtml(sessionType)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;"><strong>Topic:</strong></td>
      <td style="padding:8px 0;">${escapeHtml(topic || "General")}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; vertical-align:top;"><strong>${sessionType.toLowerCase()==="online" ? "Online:" : "Location:"}</strong></td>
      <td style="padding:8px 0;">${sessionLine}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;">${whoLine.split("</strong>")[0]}</td>
      <td style="padding:8px 0;">${whoLine.split("</strong>")[1]}</td>
    </tr>
  `;

  const manageBlock = manageLink
    ? `
      <a href="${manageLink}"
         style="display:inline-block; padding:12px 18px; border-radius:10px; background:#111827; color:#ffffff; text-decoration:none; font-weight:600;">
        Manage booking
      </a>
    `
    : "";

  const primaryCta =
    sessionType.toLowerCase() === "online" && joinLink
      ? `
        <a href="${joinLink}"
           style="display:inline-block; padding:12px 18px; border-radius:10px; background:${brand.primaryHex}; color:#ffffff; text-decoration:none; font-weight:600;">
          ${ctaPrimaryLabel}
        </a>
      `
      : manageBlock;

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>${escapeHtml(subject)}</title>
      <style>
        /* Mobile tweaks */
        @media (max-width: 600px) {
          .container { width: 100% !important; padding: 0 16px !important; }
          .card { padding: 16px !important; }
          .header-logo { height: 28px !important; }
          .btn { width: 100% !important; text-align: center !important; }
        }
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          body { background: #0b0f16 !important; color: #e5e7eb !important; }
          .card { background: #111827 !important; border-color:#1f2937 !important; }
          .muted { color:#9ca3af !important; }
          a { color: ${brand.primaryHex} !important; }
          .btn-secondary { background:#1f2937 !important; color:#e5e7eb !important; }
        }
      </style>
    </head>
    <body style="margin:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#111827;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px; max-width:100%;">
              <!-- Header -->
              <tr>
                <td align="left" style="padding:12px 0 16px;">
                  <img src="${brand.logoUrl}" alt="${escapeHtml(brand.appName)}" class="header-logo" style="height:32px; display:block;" />
                </td>
              </tr>

              <!-- Card -->
              <tr>
                <td class="card" style="background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; padding:24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:${brand.primaryHex}1a; color:${brand.primaryHex}; font-weight:700; font-size:12px; letter-spacing:.4px; text-transform:uppercase;">
                          Confirmed
                        </div>
                        <h1 style="margin:12px 0 4px; font-size:22px; line-height:1.3;">${escapeHtml(title)}</h1>
                        <p class="muted" style="margin:0 0 16px; color:#6b7280;">Thanks for booking with ${escapeHtml(brand.appName)}.</p>
                      </td>
                    </tr>

                    <!-- Details -->
                    <tr>
                      <td>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                          ${detailsRows}
                        </table>
                      </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                      <td style="padding-top:20px;">
                        ${primaryCta || ""}
                        ${manageLink ? `
                          <div style="height:8px;"></div>
                          <a class="btn btn-secondary" href="${manageLink}"
                             style="display:inline-block; padding:10px 16px; border-radius:10px; background:#f3f4f6; color:#111827; text-decoration:none; font-weight:600;">
                            Manage booking
                          </a>
                        ` : ""}
                      </td>
                    </tr>

                    <!-- Policy -->
                    <tr>
                      <td style="padding-top:18px;">
                        <p class="muted" style="margin:0; color:#6b7280; font-size:13px;">
                          You can cancel or reschedule up to <strong>24 hours</strong> before the start time.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:16px 8px 0; text-align:left;">
                  <p class="muted" style="margin:0 0 6px; color:#6b7280; font-size:12px;">
                    Need help? Contact <a href="mailto:${supportEmail}" style="color:${brand.primaryHex}; text-decoration:none;">${supportEmail}</a>
                  </p>
                  <p class="muted" style="margin:0; color:#9ca3af; font-size:12px;">
                    © ${new Date().getUTCFullYear()} ${escapeHtml(brand.appName)}. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const text = [
    recipientRole === "therapist"
      ? `New session confirmed with ${studentName}`
      : `Your session is confirmed`,
    "",
    `Date: ${dateLabel}`,
    `Time: ${timeLabel} (${timezone})`,
    `Duration: ${durationMinutes} minutes`,
    `Session type: ${sessionType}`,
    topic ? `Topic: ${topic}` : "",
    sessionType.toLowerCase() === "online" && joinLink ? `Join: ${joinLink}` : "",
    sessionType.toLowerCase() === "in-person" && locationAddress ? `Location: ${locationAddress}` : "",
    recipientRole === "therapist" ? `Client: ${studentName}` : `Therapist: ${therapistName}`,
    manageLink ? `Manage booking: ${manageLink}` : "",
    "",
    `You can cancel or reschedule up to 24 hours before the start time.`,
    `Support: ${supportEmail}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
