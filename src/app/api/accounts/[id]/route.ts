import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validations';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = accountSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.bankAccount.findFirst({
    where: { id, userId: (session.user as { id: string }).id },
  });
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const account = await prisma.bankAccount.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(account);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.bankAccount.findFirst({
    where: { id, userId: (session.user as { id: string }).id },
  });
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  // Soft-delete (archive) to preserve transaction history/integrity
  await prisma.bankAccount.update({ where: { id }, data: { isArchived: true } });

  return NextResponse.json({ success: true });
}
