import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  claimAvailableUsername,
  createSession,
  normalizeEmail,
  normalizeUsername,
  verifyPassword
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const identifier = parsed.data.identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  const user = isEmail
    ? await prisma.user.findUnique({
        where: { email: normalizeEmail(identifier) }
      })
    : await prisma.user.findUnique({
        where: { usernameLower: normalizeUsername(identifier) }
      });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.username) {
    try {
      const pair = await claimAvailableUsername();
      await prisma.user.update({
        where: { id: user.id },
        data: { username: pair.username, usernameLower: pair.usernameLower }
      });
      user.username = pair.username;
    } catch (err) {
      console.error('Unable to assign username to legacy user', err);
    }
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { error: 'Please verify your email before logging in.' },
      { status: 403 }
    );
  }

  await createSession(user.id, Boolean(parsed.data.rememberMe));

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    }
  });
}
