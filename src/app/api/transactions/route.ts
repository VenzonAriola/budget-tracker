import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validations';
import type { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') ?? undefined;
  const accountId = searchParams.get('accountId') ?? undefined;
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo = searchParams.get('dateTo') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(accountId && { accountId }),
    ...(categoryId && { categoryId }),
    ...(type && { type: type as Prisma.EnumTransactionTypeFilter['equals'] }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { merchant: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...((dateFrom || dateTo) && {
      date: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { accountId, type, amount } = parsed.data;

  const account = await prisma.bankAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const balanceDelta = type === 'EXPENSE' ? -amount : amount;

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({ data: { ...parsed.data, userId } }),
    prisma.bankAccount.update({
      where: { id: accountId },
      data: { balance: { increment: balanceDelta } },
    }),
  ]);

  return NextResponse.json(transaction, { status: 201 });
}
