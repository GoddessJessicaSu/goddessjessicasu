import { Resend } from 'resend';
import { config } from '../config';
import { createServiceLogger } from '../logger';

const log = createServiceLogger('mail');

const resend = new Resend(config.resend.apiKey);

export async function sendMagicLinkEmail(email: string, token: string) {
  log.info({ to: email }, 'Sending magic link email');
  const url = `${config.isDev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/auth/verify?token=${token}`;

  const { error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to: email,
    subject: `Your login link for ${process.env.NEXT_PUBLIC_SITE_NAME || 'Goddess OS'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #000; color: #fff;">
        <h1 style="color: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#D4AF37'}; font-size: 24px;">
          ${process.env.NEXT_PUBLIC_SITE_NAME || 'Goddess OS'}
        </h1>
        <p>Click the link below to sign in. This link expires in 15 minutes.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 32px; background: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#D4AF37'}; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Sign In
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #888;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send magic link email: ${error.message}`);
  }
}

export async function sendPurchaseReceiptEmail(email: string, mediaTitle: string, tokensSpent: number) {
  const { error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to: email,
    subject: `Purchase confirmation — ${mediaTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #000; color: #fff;">
        <h1 style="color: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#D4AF37'}; font-size: 24px;">Purchase Confirmed</h1>
        <p>You purchased <strong>${mediaTitle}</strong> for <strong>${tokensSpent} ${process.env.NEXT_PUBLIC_TOKEN_NAME || 'tokens'}</strong>.</p>
        <p>You can access it anytime from your vault.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send purchase receipt email: ${error.message}`);
  }
}
