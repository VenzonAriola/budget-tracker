import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { billSchema } from '@/lib/validations';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = billSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.bill.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof body.isPaid === 'boolean') data.isPaid = body.isPaid;

  const bill = await prisma.bill.update({ where: { id }, data });
  return NextResponse.json(bill);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.bill.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

  await prisma.bill.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
