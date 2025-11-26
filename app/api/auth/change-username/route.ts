import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser, normalizeUsername } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  username: z.string().min(2).max(32)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  const username = parsed.data.username.trim();
  const usernameLower = normalizeUsername(username);

  const existing = await prisma.user.findUnique({
    where: { usernameLower }
  });

  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      usernameLower
    }
  });

  return NextResponse.json({ message: 'Username updated.' });
}
