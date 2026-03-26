import { Resend } from "resend";
import { config } from "../config";
import { createServiceLogger } from "../logger";

const log = createServiceLogger("mail");

const resend = new Resend(config.resend.apiKey);

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Goddess OS";
const tokenName = process.env.NEXT_PUBLIC_TOKEN_NAME || "GRACE";
const primaryColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#D4AF37";
const accentColor = process.env.NEXT_PUBLIC_ACCENT_COLOR || "#8B0000";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">
        <!-- Gold top line -->
        <tr><td style="height: 1px; background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);"></td></tr>

        <!-- Main card -->
        <tr><td style="background-color: #0a0a0a; border-left: 1px solid rgba(212,175,55,0.15); border-right: 1px solid rgba(212,175,55,0.15); padding: 48px 40px;">

          <!-- Logo / Site name -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom: 32px;">
              <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: rgba(212,175,55,0.5);">${siteName}</span>
            </td></tr>
          </table>

          ${content}

        </td></tr>

        <!-- Gold bottom line -->
        <tr><td style="height: 1px; background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);"></td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding: 24px 0;">
          <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 10px; letter-spacing: 2px; color: rgba(245,240,232,0.15); text-transform: uppercase;">
            ${siteName}
          </span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMagicLinkEmail(email: string, token: string) {
  log.info({ to: email }, "Sending magic link email");
  const url = `${config.isDev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_SITE_URL}/auth/verify?token=${token}`;

  const html = emailWrapper(`
    <!-- Heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 8px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(212,175,55,0.4);">Private Access</span>
      </td></tr>
      <tr><td align="center" style="padding-bottom: 24px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 26px; color: ${primaryColor};">Sign In</span>
      </td></tr>
      <tr><td align="center" style="padding-bottom: 32px;">
        <div style="width: 40px; height: 1px; background-color: rgba(212,175,55,0.3);"></div>
      </td></tr>
    </table>

    <!-- Body text -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 32px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 14px; color: rgba(245,240,232,0.45); line-height: 1.7;">
          Click the button below to securely sign in.<br />This link expires in 15 minutes.
        </span>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 36px;">
        <a href="${url}" style="display: inline-block; padding: 14px 48px; background-color: ${accentColor}; color: rgba(245,240,232,0.9); text-decoration: none; font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; border-radius: 2px;">
          Sign In
        </a>
      </td></tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 24px;">
        <div style="width: 100%; height: 1px; background-color: rgba(212,175,55,0.1);"></div>
      </td></tr>
    </table>

    <!-- Footer note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 11px; color: rgba(245,240,232,0.2); line-height: 1.6;">
          If you didn&rsquo;t request this link, you can safely ignore this email.
        </span>
      </td></tr>
    </table>
  `);

  const { error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to: email,
    subject: `Your sign-in link — ${siteName}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send magic link email: ${error.message}`);
  }
}

export async function sendPurchaseDownloadEmail(
  email: string,
  mediaTitle: string,
  downloads: Array<{ url: string; label: string }>,
) {
  const bodyStyle =
    "font-family: 'Georgia', 'Times New Roman', serif; font-size: 14px; color: rgba(245,240,232,0.55); line-height: 1.9;";
  const accentStyle = "color: rgba(245,240,232,0.8);";

  const isSingle = downloads.length === 1;

  const downloadButtonsHtml = isSingle
    ? `<!-- Single download button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom: 8px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; color: rgba(245,240,232,0.35);">&#127909; Download here (valid for 24 hours):</span>
      </td></tr>
      <tr><td align="center" style="padding-bottom: 32px;">
        <a href="${downloads[0].url}" style="display: inline-block; padding: 14px 48px; background-color: ${accentColor}; color: rgba(245,240,232,0.9); text-decoration: none; font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; border-radius: 2px;">
          &#128279; Download Now
        </a>
      </td></tr>
    </table>`
    : `<!-- Multiple download buttons -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom: 12px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; color: rgba(245,240,232,0.35);">&#127909; Your files (valid for 24 hours):</span>
      </td></tr>
      ${downloads.map((d, i) => `
      <tr><td align="center" style="padding-bottom: ${i < downloads.length - 1 ? '12' : '32'}px;">
        <a href="${d.url}" style="display: inline-block; width: 80%; max-width: 360px; padding: 12px 24px; background-color: ${accentColor}; color: rgba(245,240,232,0.9); text-decoration: none; font-family: 'Georgia', 'Times New Roman', serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; border-radius: 2px; text-align: center;">
          &#128279; File ${i + 1} &mdash; ${escapeHtml(d.label)}
        </a>
      </td></tr>`).join('')}
    </table>`;

  const html = emailWrapper(`
    <!-- Heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 8px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(212,175,55,0.4);">Your Content</span>
      </td></tr>
      <tr><td align="center" style="padding-bottom: 24px;">
        <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 26px; color: ${primaryColor};">${escapeHtml(mediaTitle)}</span>
      </td></tr>
      <tr><td align="center" style="padding-bottom: 32px;">
        <div style="width: 40px; height: 1px; background-color: rgba(212,175,55,0.3);"></div>
      </td></tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${bodyStyle} padding-bottom: 6px;">Hey little one,</td></tr>
      <tr><td style="${bodyStyle} padding-bottom: 20px;">Your ${isSingle ? 'video is' : 'videos are'} ready for you.</td></tr>
      <tr><td style="${bodyStyle} padding-bottom: 6px;">I know you are begging to see what I've prepared for you.</td></tr>
      <tr><td style="${bodyStyle} ${accentStyle} padding-bottom: 28px;">Good boy.</td></tr>
    </table>

    ${downloadButtonsHtml}

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom: 24px;">
        <div style="width: 100%; height: 1px; background-color: rgba(212,175,55,0.1);"></div>
      </td></tr>
    </table>

    <!-- Closing copy -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${bodyStyle} padding-bottom: 24px;">
        Enjoy every second of it &mdash; and feel free to release yourself. &#128166;<br />
        That's what it's made for. &#128139;
      </td></tr>
      <tr><td style="${bodyStyle} padding-bottom: 24px;">
        When you've finished, reply to this email.<br />
        Tell me how you liked it &mdash; what made you feel the most.<br />
        I want to know&hellip; so I can make the next one even better for you. &#128151;
      </td></tr>
    </table>

    <!-- Telegram -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom: 24px;">
        <div style="width: 100%; height: 1px; background-color: rgba(212,175,55,0.1);"></div>
      </td></tr>
      <tr><td style="${bodyStyle} padding-bottom: 28px;">Also don&rsquo;t forget to join my Telegram group &mdash; the link is on my <a href="${config.isDev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: ${primaryColor}; text-decoration: none;">Contact &amp; FAQ</a> page.</td></tr>
    </table>

    <!-- Signature -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${bodyStyle} ${accentStyle}">
        Jessica Su<br />
        <span style="color: rgba(245,240,232,0.4);">Your dream goddess &#128096;</span>
      </td></tr>
    </table>
  `);

  const { error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to: email,
    subject: `Your download is ready — ${escapeHtml(mediaTitle)}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send download email: ${error.message}`);
  }
}
