import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Generate bill-due notifications for bills due within 3 days that don't have one yet
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);

  const upcomingBills = await prisma.bill.findMany({
    where: { userId, isPaid: false, autoRemind: true, dueDate: { lte: soon } },
  });

  for (const bill of upcomingBills) {
    const exists = await prisma.notification.findFirst({
      where: { userId, type: 'BILL_DUE', title: bill.name, isRead: false },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'BILL_DUE',
          title: bill.name,
          message: `${bill.name} is due ${bill.dueDate.toLocaleDateString()}`,
        },
      });
    }
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { id, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  } else if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
