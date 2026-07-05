import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validations';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: parsed.data.categoryId,
          month: parsed.data.month,
          year: parsed.data.year,
        },
      },
      update: { amount: parsed.data.amount },
      create: { ...parsed.data, userId },
      include: { category: true },
    });
    return NextResponse.json(budget, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save budget' }, { status: 500 });
  }
}
