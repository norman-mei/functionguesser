import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const scribble = await prisma.scribble.findUnique({ where: { id: params.id } });
    if (!scribble) {
      return NextResponse.json({ error: 'Scribble not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = body?.userId ?? 'anonymous';
    const userName = body?.userName ?? 'Guest';

    console.warn('Scribble report received', { scribbleId: params.id, userId, userName });
    return NextResponse.json({ message: 'Report received' }, { status: 200 });
  } catch (error) {
    console.error('Failed to record scribble report:', error);
    return NextResponse.json({ error: 'Unable to record report' }, { status: 500 });
  }
}
