import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { buildContactRateLimitKey, consumeRateLimit } from '@/lib/rate-limit';
import { getRedis } from '@/lib/redis';
import { getClientIp, isSameOriginRequest } from '@/lib/request-ip';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(200),
  service: z.string().trim().min(2, 'Please select a service.').max(120),
  message: z.string().trim().min(10, 'Please describe your project (at least 10 characters).').max(4000),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid inquiry fields.' },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  try {
    const rate = await consumeRateLimit(getRedis(), buildContactRateLimitKey(ip), 5, 3600);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'You have submitted several briefs recently. Please wait before sending another.',
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }
  } catch (err) {
    console.warn('[api/contact] Redis rate limit skipped:', err instanceof Error ? err.message : err);
  }

  const db = getDb();
  const [inserted] = await db
    .insert(schema.contactInquiries)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      service: parsed.data.service,
      message: parsed.data.message,
      status: 'new',
      ipAddress: ip,
    })
    .returning({ id: schema.contactInquiries.id });

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
