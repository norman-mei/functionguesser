import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
  userId: z.string()
});

const deleteSchema = z.object({
  userId: z.string()
});

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const scribble = await prisma.scribble.findUnique({
            where: { id: params.id },
            include: {
                creator: {
                    select: { username: true },
                },
            },
        });

        if (!scribble) {
            return NextResponse.json({ error: 'Scribble not found' }, { status: 404 });
        }

        return NextResponse.json(scribble);
    } catch (error) {
        console.error('Failed to fetch scribble:', error);
        return NextResponse.json({ error: 'Failed to fetch scribble' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const scribble = await prisma.scribble.findUnique({ where: { id: params.id } });
    if (!scribble) {
      return NextResponse.json({ error: 'Scribble not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }
    const { userId } = parsed.data;
    if (scribble.creatorId && scribble.creatorId !== userId) {
      return NextResponse.json({ error: 'Not allowed to delete this scribble' }, { status: 403 });
    }

    await prisma.scribble.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Failed to delete scribble:', error);
    return NextResponse.json({ error: 'Failed to delete scribble' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const scribble = await prisma.scribble.findUnique({ where: { id: params.id } });
    if (!scribble) {
      return NextResponse.json({ error: 'Scribble not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { points, userId } = parsed.data;
    if (scribble.creatorId && scribble.creatorId !== userId) {
      return NextResponse.json({ error: 'Not allowed to edit this scribble' }, { status: 403 });
    }

    const createdAt = new Date(scribble.createdAt).getTime();
    const windowMs = 15 * 60 * 1000;
    if (Date.now() - createdAt > windowMs) {
      return NextResponse.json({ error: 'Edit window has expired (15 minutes after publish)' }, { status: 403 });
    }

    const updated = await prisma.scribble.update({
      where: { id: params.id },
      data: { points: JSON.stringify(points) }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update scribble:', error);
    return NextResponse.json({ error: 'Failed to update scribble' }, { status: 500 });
  }
}
