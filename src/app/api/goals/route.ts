import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { savingsGoalSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = savingsGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const goal = await prisma.savingsGoal.create({
    data: { ...parsed.data, userId: (session.user as { id: string }).id },
  });

  return NextResponse.json(goal, { status: 201 });
}
