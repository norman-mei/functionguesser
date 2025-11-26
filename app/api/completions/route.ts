import { NextResponse } from 'next/server';
import { ChallengeCategory } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type CompletionType = 'daily' | 'weekly' | 'monthly' | 'regular' | 'timed';

const mapType = (type: CompletionType): ChallengeCategory => {
  switch (type) {
    case 'daily':
      return 'DAILY';
    case 'weekly':
      return 'WEEKLY';
    case 'monthly':
      return 'MONTHLY';
    case 'timed':
      return 'TIMED';
    case 'regular':
    default:
      return 'REGULAR';
  }
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        type?: CompletionType;
        key?: string;
        periodStart?: number;
      }
    | null;

  if (!body?.type || !body?.key || typeof body.periodStart !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const type = body.type;
  const key = body.key.slice(0, 120); // cap key length
  const periodStart = new Date(body.periodStart);

  try {
    await prisma.challengeCompletion.upsert({
      where: {
        userId_type_key: {
          userId: user.id,
          type: mapType(type),
          key
        }
      },
      update: {},
      create: {
        userId: user.id,
        type: mapType(type),
        key,
        periodStart
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unable to record completion' }, { status: 500 });
  }
}
