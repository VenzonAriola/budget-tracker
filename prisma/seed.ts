import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@ledger.app' },
    update: {},
    create: { name: 'Demo User', email: 'demo@ledger.app', password },
  });

  const checking = await prisma.bankAccount.create({
    data: { userId: user.id, name: 'Everyday Checking', type: 'CHECKING', balance: 3250.55, color: '#1FAA75' },
  });
  const savings = await prisma.bankAccount.create({
    data: { userId: user.id, name: 'High-Yield Savings', type: 'SAVINGS', balance: 12500, color: '#6C63F5' },
  });

  const categories = await Promise.all(
    [
      { name: 'Salary', type: 'INCOME' as const, color: '#1FAA75', icon: 'Landmark' },
      { name: 'Groceries', type: 'EXPENSE' as const, color: '#E2543D', icon: 'ShoppingCart' },
      { name: 'Rent', type: 'EXPENSE' as const, color: '#6C63F5', icon: 'Home' },
      { name: 'Transport', type: 'EXPENSE' as const, color: '#E8A63A', icon: 'Car' },
      { name: 'Entertainment', type: 'EXPENSE' as const, color: '#5750D6', icon: 'Film' },
    ].map((c) => prisma.category.create({ data: { ...c, userId: user.id } }))
  );

  const [salary, groceries, rent, transport, entertainment] = categories;

  await prisma.transaction.createMany({
    data: [
      { userId: user.id, accountId: checking.id, categoryId: salary.id, type: 'INCOME', amount: 4500, description: 'Monthly salary', date: new Date() },
      { userId: user.id, accountId: checking.id, categoryId: rent.id, type: 'EXPENSE', amount: 1500, description: 'Rent', date: new Date() },
      { userId: user.id, accountId: checking.id, categoryId: groceries.id, type: 'EXPENSE', amount: 320.45, merchant: 'Whole Foods', date: new Date() },
      { userId: user.id, accountId: checking.id, categoryId: transport.id, type: 'EXPENSE', amount: 85, merchant: 'Shell', date: new Date() },
      { userId: user.id, accountId: checking.id, categoryId: entertainment.id, type: 'EXPENSE', amount: 45.99, merchant: 'Netflix', date: new Date() },
    ],
  });

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: groceries.id, amount: 500, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      { userId: user.id, categoryId: rent.id, amount: 1500, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    ],
  });

  await prisma.savingsGoal.create({
    data: { userId: user.id, name: 'Emergency Fund', targetAmount: 10000, currentAmount: 4200, color: '#6C63F5' },
  });

  await prisma.bill.create({
    data: {
      userId: user.id,
      name: 'Netflix',
      amount: 15.99,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      frequency: 'MONTHLY',
    },
  });

  console.log('Seed complete. Demo login: demo@ledger.app / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
