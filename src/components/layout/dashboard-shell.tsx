'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/accounts': 'Accounts',
  '/categories': 'Categories',
  '/budgets': 'Budgets',
  '/goals': 'Savings Goals',
  '/bills': 'Bills',
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = '/' + (pathname?.split('/')[1] ?? 'dashboard');
  const title = TITLES[segment] ?? 'Ledger';

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Navbar title={title} />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
