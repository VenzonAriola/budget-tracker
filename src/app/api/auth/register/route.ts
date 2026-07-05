import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Seed default categories for the new user
    await prisma.category.createMany({
      data: [
        { userId: user.id, name: 'Salary', type: 'INCOME', icon: 'Landmark', color: '#1FAA75' },
        { userId: user.id, name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingCart', color: '#E2543D' },
        { userId: user.id, name: 'Rent', type: 'EXPENSE', icon: 'Home', color: '#6C63F5' },
        { userId: user.id, name: 'Transport', type: 'EXPENSE', icon: 'Car', color: '#E8A63A' },
        { userId: user.id, name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#5750D6' },
      ],
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
