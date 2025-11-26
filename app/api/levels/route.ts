import { NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const creatorId = searchParams.get('creatorId');
  const sort = searchParams.get('sort') ?? 'newest';

  try {
    const whereClause: any = {
      OR: [{ name: { contains: search } }, { creatorName: { contains: search } }]
    };

    const user = await getCurrentUser();

    if (creatorId) {
      whereClause.creatorId = creatorId;
      if (!user || user.id !== creatorId) {
        whereClause.visibility = 'PUBLIC';
      }
    } else {
      whereClause.visibility = 'PUBLIC';
    }

    const levels = await prisma.level.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { username: true } } }
    });

    const levelIds = levels.map((l) => l.id);

    const ratingStats = levelIds.length
      ? await prisma.$queryRaw<
          { levelId: string; avgRating: number | null; ratingCount: number }[]
        >`SELECT levelId, AVG(rating) AS avgRating, COUNT(*) AS ratingCount FROM LevelRating WHERE levelId IN (${Prisma.join(levelIds)}) GROUP BY levelId`
      : [];
    const ratingMap = new Map(
      ratingStats.map((r) => [r.levelId, { avgRating: r.avgRating ?? null, ratingCount: Number(r.ratingCount) }])
    );

    const userRatingRows =
      user && levelIds.length
        ? await prisma.$queryRaw<{ levelId: string; rating: number }[]>`
            SELECT levelId, rating FROM LevelRating
            WHERE userId = ${user.id} AND levelId IN (${Prisma.join(levelIds)})
          `
        : [];
    const userRatingMap = new Map(userRatingRows.map((r) => [r.levelId, r.rating]));

    let mappedLevels = levels.map((l) => {
      const rating = ratingMap.get(l.id);
      return {
        ...l,
        creatorName: l.creator?.username || l.creatorName || 'Anonymous',
        avgRating: rating?.avgRating ?? null,
        ratingCount: rating?.ratingCount ?? 0,
        userRating: userRatingMap.get(l.id) ?? null
      };
    });

    if (sort === 'popular') {
      mappedLevels = mappedLevels.sort((a, b) => {
        if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
        const avgA = a.avgRating ?? 0;
        const avgB = b.avgRating ?? 0;
        if (avgB !== avgA) return avgB - avgA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      mappedLevels = mappedLevels.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json(mappedLevels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a level.' }, { status: 401 });
    }

    const banned = await prisma.bannedUser.findUnique({
      where: { userId: user.id }
    });

    if (banned) {
      return NextResponse.json({ error: 'Your account has been banned from posting levels.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, functionTex, difficulty, isTimed, timeLimit, zoomLimit, visibility } = body;

    const badWords = [
      'badword',
      'offensive',
      'inappropriate',
      'spam',
      'penis',
      'vagina',
      'sex',
      'fuck',
      'shit',
      'bitch',
      'ass',
      'dick',
      'cock',
      'pussy',
      'whore',
      'slut',
      'nigger',
      'faggot',
      'retard',
      'cunt',
      'bastard',
      'damn',
      'crap',
      'piss',
      'tit',
      'boob',
      'anal',
      'anus',
      'rectum',
      'scrotum',
      'testicle',
      'wank',
      'jizz',
      'cum',
      'sperm',
      'orgasm',
      'masturbate',
      'porn',
      'hentai',
      'xxx',
      'nude',
      'naked',
      'kill',
      'suicide',
      'murder',
      'death',
      'die',
      'rape',
      'abuse',
      'terrorist',
      'bomb'
    ];
    const containsBadWord = (text: string) => {
      const lower = text.toLowerCase();
      return badWords.some((word) => lower.includes(word));
    };

    if (containsBadWord(name)) {
      return NextResponse.json({ error: 'Inappropriate content detected in name.' }, { status: 400 });
    }

    const level = await prisma.level.create({
      data: {
        name,
        creatorName: user.username,
        creatorId: user.id,
        functionTex,
        difficulty,
        isTimed,
        timeLimit,
        zoomLimit,
        visibility: visibility || 'PUBLIC'
      }
    });

    return NextResponse.json(level);
  } catch (error) {
    console.error('Error creating level:', error);
    return NextResponse.json({ error: 'Failed to create level' }, { status: 500 });
  }
}
