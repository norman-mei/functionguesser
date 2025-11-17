import { NextResponse } from 'next/server';

const password = process.env.SOLUTION_PASSWORD ?? 'aaa123!';

export async function POST(request: Request) {
  if (!password) {
    return NextResponse.json(
      { ok: false, message: 'Server password is not configured' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const provided = typeof body?.password === 'string' ? body.password : '';
  const ok = provided === password;

  return NextResponse.json(
    { ok, message: ok ? 'Password accepted' : 'Invalid password' },
    { status: ok ? 200 : 401 }
  );
}

export function GET() {
  return NextResponse.json(
    { ok: false, message: 'Method not allowed' },
    { status: 405 }
  );
}
