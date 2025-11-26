import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const attemptSchema = z.object({
    userId: z.string().optional(),
    userName: z.string().optional(),
    functionTex: z.string(),
    accuracy: z.number(),
});

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { userId, userName, functionTex, accuracy } = attemptSchema.parse(body);

        const attempt = await prisma.scribbleAttempt.create({
            data: {
                scribbleId: params.id,
                userId,
                userName,
                functionTex,
                accuracy,
            },
        });

        return NextResponse.json(attempt);
    } catch (error) {
        console.error('Failed to record attempt:', error);
        return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const attempts = await prisma.scribbleAttempt.findMany({
            where: { scribbleId: params.id },
            orderBy: { accuracy: 'desc' },
            take: 50,
            include: {
                user: {
                    select: { username: true },
                },
            },
        });

        return NextResponse.json(attempts);
    } catch (error) {
        console.error('Failed to fetch attempts:', error);
        return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }
}
