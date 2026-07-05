import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMonthRange } from '@/lib/utils';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);
  const { start, end } = getMonthRange(month, year);

  const [monthTransactions, accounts, budgets, last6MonthsTx] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { category: true },
    }),
    prisma.bankAccount.findMany({ where: { userId, isArchived: false } }),
    prisma.budget.findMany({ where: { userId, month, year }, include: { category: true } }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: new Date(year, month - 6, 1) },
        type: { in: ['INCOME', 'EXPENSE'] },
      },
      select: { amount: true, type: true, date: true },
    }),
  ]);

  const income = monthTransactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTransactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const netBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  // Category breakdown (expenses only) for pie chart
  const categoryMap = new Map<string, { name: string; color: string; value: number }>();
  monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const key = t.category?.id ?? 'uncategorized';
      const name = t.category?.name ?? 'Uncategorized';
      const color = t.category?.color ?? '#94A3B8';
      const existing = categoryMap.get(key);
      if (existing) existing.value += Number(t.amount);
      else categoryMap.set(key, { name, color, value: Number(t.amount) });
    });

  // 6-month trend
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    trendMap.set(key, { income: 0, expense: 0 });
  }
  last6MonthsTx.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = trendMap.get(key);
    if (!entry) return;
    if (t.type === 'INCOME') entry.income += Number(t.amount);
    else entry.expense += Number(t.amount);
  });
  const monthlyTrend = Array.from(trendMap.entries()).map(([key, val]) => {
    const [y, m] = key.split('-').map(Number);
    return {
      month: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' }),
      ...val,
    };
  });

  // Budget progress
  const budgetProgress = budgets.map((b) => {
    const spent = monthTransactions
      .filter((t) => t.type === 'EXPENSE' && t.categoryId === b.categoryId)
      .reduce((s, t) => s + Number(t.amount), 0);
    return {
      categoryId: b.categoryId,
      categoryName: b.category.name,
      color: b.category.color,
      limit: Number(b.amount),
      spent,
      percentage: Math.min(100, Math.round((spent / Number(b.amount)) * 100)),
    };
  });

  return NextResponse.json({
    income,
    expense,
    netBalance,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => b.value - a.value),
    monthlyTrend,
    budgetProgress,
    accountCount: accounts.length,
    transactionCount: monthTransactions.length,
  });
}
