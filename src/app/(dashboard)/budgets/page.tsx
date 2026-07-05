'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, PiggyBank } from 'lucide-react';
import type { Budget, Category } from '@prisma/client';
import { budgetSchema, type BudgetFormValues } from '@/lib/validations';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency, MONTH_NAMES } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

type BudgetRow = Budget & { category: Category };

export default function BudgetsPage() {
  const { toast } = useToast();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { month, year, amount: 0, categoryId: '' },
  });

  const load = useCallback(async () => {
    const [b, c] = await Promise.all([
      apiFetch<BudgetRow[]>(`/api/budgets?month=${month}&year=${year}`),
      apiFetch<Category[]>('/api/categories'),
    ]);
    setBudgets(b);
    setCategories(c.filter((cat) => cat.type === 'EXPENSE'));
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(values: BudgetFormValues) {
    try {
      await apiFetch('/api/budgets', { method: 'POST', body: JSON.stringify(values) });
      toast({ title: 'Budget saved' });
      reset({ month, year, amount: 0, categoryId: '' });
      setDialogOpen(false);
      load();
    } catch (err) {
      toast({ title: 'Could not save budget', description: (err as Error).message, variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this budget?')) return;
    await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
    toast({ title: 'Budget removed' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Set spending limits for {MONTH_NAMES[month - 1]} {year}.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Set budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set monthly budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(v) => setValue('categoryId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-coral">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monthly limit</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-xs text-coral">{errors.amount.message}</p>}
              </div>
              <input type="hidden" {...register('month')} value={month} />
              <input type="hidden" {...register('year')} value={year} />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save budget'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PiggyBank className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No budgets set for this month</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Set your first budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{b.category.name}</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">{formatCurrency(b.amount as unknown as number)}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-coral" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
