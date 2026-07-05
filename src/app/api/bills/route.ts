import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { billSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bills = await prisma.bill.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = billSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const bill = await prisma.bill.create({
    data: { ...parsed.data, userId: (session.user as { id: string }).id },
  });

  return NextResponse.json(bill, { status: 201 });
}
