import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: (session.user as { id: string }).id, isArchived: false },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const account = await prisma.bankAccount.create({
    data: { ...parsed.data, userId: (session.user as { id: string }).id },
  });

  return NextResponse.json(account, { status: 201 });
}
