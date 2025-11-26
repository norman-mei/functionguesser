import { NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const level = await prisma.level.findUnique({
      where: { id: params.id }
    });

    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const ratingAgg = await prisma.$queryRaw<
      { avgRating: number | null; ratingCount: number }[]
    >`SELECT AVG(rating) AS avgRating, COUNT(*) AS ratingCount FROM LevelRating WHERE levelId = ${params.id}`;
    const agg = ratingAgg[0];
    const userRating = user
      ? await prisma.$queryRaw<{ rating: number }[]>`
          SELECT rating FROM LevelRating WHERE levelId = ${params.id} AND userId = ${user.id} LIMIT 1
        `
      : [];

    return NextResponse.json({
      ...level,
      avgRating: agg?.avgRating ?? null,
      ratingCount: agg ? Number(agg.ratingCount) : 0,
      userRating: userRating[0]?.rating ?? null
    });
  } catch (error) {
    console.error('Error fetching level:', error);
    return NextResponse.json({ error: 'Failed to fetch level' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string; rating?: number };

    if (action === 'report') {
      const level = await prisma.level.update({
        where: { id: params.id },
        data: {
          reports: { increment: 1 }
        }
      });

      // Auto-takedown threshold
      const REPORT_THRESHOLD = 5;
      if (level.reports >= REPORT_THRESHOLD && level.visibility === 'PUBLIC') {
        await prisma.level.update({
          where: { id: params.id },
          data: { visibility: 'PRIVATE' } // Effectively hides it
        });

        // Check for auto-ban
        if (level.creatorId) {
          const hiddenLevelsCount = await prisma.level.count({
            where: {
              creatorId: level.creatorId,
              visibility: 'PRIVATE',
              reports: { gte: REPORT_THRESHOLD }
            }
          });

          const BAN_THRESHOLD = 3; // Ban after 3 levels are taken down
          if (hiddenLevelsCount >= BAN_THRESHOLD) {
            const existingBan = await prisma.bannedUser.findUnique({
              where: { userId: level.creatorId }
            });

            if (!existingBan) {
              await prisma.bannedUser.create({
                data: {
                  userId: level.creatorId,
                  reason: 'Multiple levels taken down due to reports.'
                }
              });
            }
          }
        }
      }

      return NextResponse.json({ success: true, reports: level.reports });
    }

    if (action === 'rate') {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'You must be logged in to rate levels.' }, { status: 401 });
      }

      const level = await prisma.level.findUnique({ where: { id: params.id } });
      if (!level) {
        return NextResponse.json({ error: 'Level not found' }, { status: 404 });
      }
      if (level.creatorId === user.id) {
        return NextResponse.json({ error: 'You cannot rate your own level.' }, { status: 400 });
      }

      const rating = Number(body.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
      }

      await prisma.$executeRaw`INSERT INTO LevelRating (id, rating, levelId, userId, createdAt, updatedAt)
        VALUES (${randomUUID()}, ${rating}, ${params.id}, ${user.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(levelId, userId)
        DO UPDATE SET rating = excluded.rating, updatedAt = CURRENT_TIMESTAMP;`;

      const ratingAgg = await prisma.$queryRaw<
        { avgRating: number | null; ratingCount: number }[]
      >`SELECT AVG(rating) AS avgRating, COUNT(*) AS ratingCount FROM LevelRating WHERE levelId = ${params.id}`;

      return NextResponse.json({
        success: true,
        avgRating: ratingAgg[0]?.avgRating ?? null,
        ratingCount: ratingAgg[0] ? Number(ratingAgg[0].ratingCount) : 0,
        userRating: rating
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error reporting level:', error);
    return NextResponse.json({ error: 'Failed to report level' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.level.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }
    if (existing.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, visibility } = body as { name?: string; visibility?: string };

    const updated = await prisma.level.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        visibility: visibility ?? existing.visibility
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating level:', error);
    return NextResponse.json({ error: 'Failed to update level' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.level.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }
    if (existing.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.level.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting level:', error);
    return NextResponse.json({ error: 'Failed to delete level' }, { status: 500 });
  }
}
