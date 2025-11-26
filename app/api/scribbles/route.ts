import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createScribbleSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
  creatorId: z.string().optional(),
  creatorName: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { points, creatorId, creatorName } = createScribbleSchema.parse(body);

    const scribble = await prisma.scribble.create({
      data: {
        points: JSON.stringify(points),
        creatorId,
        creatorName
      }
    });

    return NextResponse.json(scribble);
  } catch (error) {
    console.error('Failed to create scribble:', error);
    return NextResponse.json({ error: 'Failed to create scribble' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 20;
    const creatorId = searchParams.get('creatorId');

    const scribbles = await prisma.scribble.findMany({
      take: limit,
      where: creatorId ? { creatorId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { attempts: true }
        }
      }
    });

    return NextResponse.json(scribbles);
  } catch (error) {
    console.error('Failed to fetch scribbles:', error);
    return NextResponse.json({ error: 'Failed to fetch scribbles' }, { status: 500 });
  }
}
