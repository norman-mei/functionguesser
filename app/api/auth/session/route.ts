import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  if (!user.username) {
    const { claimAvailableUsername } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');
    try {
      const pair = await claimAvailableUsername();
      await prisma.user.update({
        where: { id: user.id },
        data: { username: pair.username, usernameLower: pair.usernameLower }
      });
      user.username = pair.username;
    } catch (err) {
      console.error('Unable to assign username during session fetch', err);
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    }
  });
}
