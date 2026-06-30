import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export function isOvhSmtpConfigured(): boolean {
  return Boolean(
    process.env.OVH_SMTP_USER?.trim() && process.env.OVH_SMTP_PASSWORD?.trim()
  );
}

export function buildOvhSmtpTransportOptions(
  host: string,
  port: number
): SMTPTransport.Options {
  return {
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.OVH_SMTP_USER!.trim(),
      pass: process.env.OVH_SMTP_PASSWORD!.trim(),
    },
    tls: { minVersion: 'TLSv1.2' },
  };
}

/** Configurations SMTP OVH courantes (MX Plan / Email Pro). */
export function ovhSmtpAttempts(): Array<{ host: string; port: number; label: string }> {
  const customHost = process.env.OVH_SMTP_HOST?.trim();
  const customPort = process.env.OVH_SMTP_PORT ? Number(process.env.OVH_SMTP_PORT) : null;

  if (customHost && customPort) {
    return [{ host: customHost, port: customPort, label: `${customHost}:${customPort}` }];
  }

  return [
    { host: 'pro1.mail.ovh.net', port: 587, label: 'pro1.mail.ovh.net:587 (Email Pro)' },
    { host: 'pro2.mail.ovh.net', port: 587, label: 'pro2.mail.ovh.net:587 (Email Pro)' },
    { host: 'ssl0.ovh.net', port: 465, label: 'ssl0.ovh.net:465' },
    { host: 'smtp.mail.ovh.net', port: 587, label: 'smtp.mail.ovh.net:587' },
    { host: 'smtp.mail.ovh.net', port: 465, label: 'smtp.mail.ovh.net:465' },
  ];
}

export async function sendViaOvhSmtp(params: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
}): Promise<{ ok: true; via: string } | { ok: false; error: string }> {
  if (!isOvhSmtpConfigured()) {
    return { ok: false, error: 'OVH SMTP is not configured.' };
  }

  const user = process.env.OVH_SMTP_USER!.trim();
  let lastError = 'OVH SMTP send failed.';

  for (const attempt of ovhSmtpAttempts()) {
    const transporter = nodemailer.createTransport(buildOvhSmtpTransportOptions(attempt.host, attempt.port));

    try {
      await transporter.sendMail({
        from: user,
        to: params.to.join(', '),
        replyTo: params.replyTo ?? undefined,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      return { ok: true, via: attempt.label };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'OVH SMTP send failed.';
      if (!lastError.includes('535') && !lastError.includes('Authentication failed')) {
        return { ok: false, error: `${attempt.label}: ${lastError}` };
      }
    }
  }

  return {
    ok: false,
    error: `Authentication failed on all OVH SMTP servers. Check OVH_SMTP_USER and OVH_SMTP_PASSWORD (webmail OVH must accept the same password). Last: ${lastError}`,
  };
}
