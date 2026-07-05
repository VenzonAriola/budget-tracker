import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validations';

function signedAmount(type: string, amount: number) {
  return type === 'EXPENSE' ? -amount : amount;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  const oldDelta = signedAmount(existing.type, Number(existing.amount));
  const newDelta = signedAmount(parsed.data.type, parsed.data.amount);

  const ops = [
    prisma.transaction.update({ where: { id }, data: parsed.data }),
  ];

  if (existing.accountId === parsed.data.accountId) {
    // Same account: apply the net difference
    ops.push(
      prisma.bankAccount.update({
        where: { id: parsed.data.accountId },
        data: { balance: { increment: newDelta - oldDelta } },
      }) as any
    );
  } else {
    // Moved to a different account: reverse old, apply new
    ops.push(
      prisma.bankAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: -oldDelta } },
      }) as any,
      prisma.bankAccount.update({
        where: { id: parsed.data.accountId },
        data: { balance: { increment: newDelta } },
      }) as any
    );
  }

  const [transaction] = await prisma.$transaction(ops as any);
  return NextResponse.json(transaction);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  const delta = signedAmount(existing.type, Number(existing.amount));

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    prisma.bankAccount.update({
      where: { id: existing.accountId },
      data: { balance: { increment: -delta } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
