import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { savingsGoalSchema } from '@/lib/validations';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = savingsGoalSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const status =
    parsed.data.currentAmount !== undefined && parsed.data.currentAmount >= Number(existing.targetAmount)
      ? 'COMPLETED'
      : existing.status;

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: { ...parsed.data, status },
  });

  return NextResponse.json(goal);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  await prisma.savingsGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
