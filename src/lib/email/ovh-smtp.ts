import nodemailer from 'nodemailer';

export function isOvhSmtpConfigured(): boolean {
  return Boolean(
    process.env.OVH_SMTP_USER?.trim() && process.env.OVH_SMTP_PASSWORD?.trim()
  );
}

export async function sendViaOvhSmtp(params: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isOvhSmtpConfigured()) {
    return { ok: false, error: 'OVH SMTP is not configured.' };
  }

  const user = process.env.OVH_SMTP_USER!.trim();
  const pass = process.env.OVH_SMTP_PASSWORD!.trim();
  const host = process.env.OVH_SMTP_HOST?.trim() || 'ssl0.ovh.net';
  const port = Number(process.env.OVH_SMTP_PORT || 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: user,
      to: params.to.join(', '),
      replyTo: params.replyTo ?? undefined,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OVH SMTP send failed.';
    return { ok: false, error: message };
  }
}
