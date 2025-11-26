import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  clearVerificationTokensForUser,
  createVerificationToken,
  claimAvailableUsername,
  hashPassword,
  normalizeEmail
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mailer';

const registerSchema = z
  .object({
    email: z.string().email(),
    username: z.string().min(2).max(32).optional(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const desiredUsername = parsed.data.username?.trim();

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
  }

  let usernameToUse = desiredUsername && desiredUsername.length > 0 ? desiredUsername : null;
  let usernamePair;
  try {
    usernamePair = await claimAvailableUsername(usernameToUse ?? undefined);
  } catch (err) {
    return NextResponse.json({ error: 'Unable to generate username. Try again.' }, { status: 500 });
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: usernamePair.username,
      usernameLower: usernamePair.usernameLower,
      passwordHash
    }
  });

  try {
    await clearVerificationTokensForUser(user.id);
    const { token } = await createVerificationToken(user.id);
    await sendVerificationEmail(user.email, token);
  } catch (error) {
    await prisma.user.delete({
      where: { id: user.id }
    });
    await clearVerificationTokensForUser(user.id);
    console.error('Failed to send verification email', error);
    return NextResponse.json(
      { error: 'Unable to send verification email. Please try again later.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Account created. Check your email for a verification link.'
  });
}
