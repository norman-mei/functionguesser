import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';

import { prisma } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'fg_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_TTL_REMEMBER_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function generateFallbackUsername() {
  const num = Math.floor(Math.random() * 900000 + 100000);
  return `user-${num}`;
}

export async function claimAvailableUsername(desired?: string) {
  let candidate = desired?.trim();
  if (candidate) {
    const usernameLower = normalizeUsername(candidate);
    const existing = await prisma.user.findUnique({ where: { usernameLower } });
    if (!existing) {
      return { username: candidate, usernameLower };
    }
  }

  let attempts = 0;
  while (attempts < 8) {
    const fallback = generateFallbackUsername();
    const lower = normalizeUsername(fallback);
    const existing = await prisma.user.findUnique({ where: { usernameLower: lower } });
    if (!existing) {
      return { username: fallback, usernameLower: lower };
    }
    attempts++;
  }
  throw new Error('Unable to assign username');
}

function getCookieStore() {
  return cookies();
}

function buildCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  };
}

export async function createSession(userId: string, rememberMe = false) {
  const rawToken = randomBytes(48).toString('hex');
  const tokenHash = hashValue(rawToken);
  const ttl = rememberMe ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  const store = getCookieStore();
  store.set(SESSION_COOKIE_NAME, rawToken, buildCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const store = getCookieStore();
  const existing = store.get(SESSION_COOKIE_NAME)?.value;

  if (existing) {
    const tokenHash = hashValue(existing);
    await prisma.session.deleteMany({
      where: { tokenHash }
    });
  }

  store.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/'
  });
}

export async function getCurrentUser() {
  const store = getCookieStore();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashValue(token);
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!session) {
    store.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function createVerificationToken(userId: string) {
  const rawToken = randomBytes(48).toString('hex');
  const tokenHash = hashValue(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  const token = await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      type: 'EMAIL'
    }
  });

  return { token: rawToken, record: token };
}

export async function clearVerificationTokensForUser(userId: string) {
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: 'EMAIL'
    }
  });
}
