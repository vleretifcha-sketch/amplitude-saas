import { NextResponse } from 'next/server';
import { sendSubscriptionAdminNotification } from '@/lib/email/subscription-notify';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = request.headers.get('x-internal-secret')?.trim();
  const expected = process.env.INTERNAL_NOTIFY_SECRET?.trim();

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    userId?: string;
    planLabel?: string | null;
    amountLabel?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.userId?.trim()) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const result = await sendSubscriptionAdminNotification({
    userId: body.userId,
    planLabel: body.planLabel,
    amountLabel: body.amountLabel,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, recipients: result.recipients }, { status: 502 });
  }

  return NextResponse.json({ ok: true, recipients: result.recipients, id: result.id });
}
