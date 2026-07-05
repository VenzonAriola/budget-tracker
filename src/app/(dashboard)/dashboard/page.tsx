'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency, MONTH_NAMES, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendChart, CategoryPieChart } from '@/components/dashboard/charts';
import { BudgetProgressList } from '@/components/dashboard/budget-progress';

interface Summary {
  income: number;
  expense: number;
  netBalance: number;
  savingsRate: number;
  categoryBreakdown: { name: string; color: string; value: number }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
  budgetProgress: {
    categoryId: string;
    categoryName: string;
    color: string;
    limit: number;
    spent: number;
    percentage: number;
  }[];
  transactionCount: number;
}

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<Summary>(`/api/dashboard/summary?month=${month}&year=${year}`).then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, [month, year]);

  const net = (summary?.income ?? 0) - (summary?.expense ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Monthly summary and spending overview.</p>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Net worth"
          value={summary?.netBalance ?? 0}
          icon={Wallet}
          accent="text-ink dark:text-white"
        />
        <SummaryCard label="Income" value={summary?.income ?? 0} icon={TrendingUp} accent="text-emerald-600" />
        <SummaryCard label="Expenses" value={summary?.expense ?? 0} icon={TrendingDown} accent="text-coral-600" />
        <SummaryCard
          label="Net this month"
          value={net}
          icon={PiggyBank}
          accent={net >= 0 ? 'text-emerald-600' : 'text-coral-600'}
          suffix={summary ? ` · ${summary.savingsRate}% saved` : ''}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs. expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <TrendChart data={summary?.monthlyTrend ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <CategoryPieChart data={summary?.categoryBreakdown ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget progress</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <BudgetProgressList items={summary?.budgetProgress ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className={cn('h-4 w-4', accent)} />
        </div>
        <p className={cn('mt-2 font-mono text-2xl font-semibold tabular-nums', accent)}>
          {formatCurrency(value)}
          {suffix && <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">{suffix}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
