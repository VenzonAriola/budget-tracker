'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Target, Trash2 } from 'lucide-react';
import type { SavingsGoal } from '@prisma/client';
import { savingsGoalSchema, type SavingsGoalFormValues } from '@/lib/validations';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function GoalsPage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contribution, setContribution] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SavingsGoalFormValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: { name: '', targetAmount: 0, currentAmount: 0, color: '#6C63F5' },
  });

  const load = useCallback(async () => {
    const data = await apiFetch<SavingsGoal[]>('/api/goals');
    setGoals(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(values: SavingsGoalFormValues) {
    try {
      await apiFetch('/api/goals', { method: 'POST', body: JSON.stringify(values) });
      toast({ title: 'Savings goal created' });
      reset();
      setDialogOpen(false);
      load();
    } catch (err) {
      toast({ title: 'Could not create goal', description: (err as Error).message, variant: 'destructive' });
    }
  }

  async function handleContribute(goal: SavingsGoal) {
    const amount = parseFloat(contribution);
    if (!amount || amount <= 0) return;
    await apiFetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ currentAmount: Number(goal.currentAmount) + amount }),
    });
    toast({ title: 'Contribution added' });
    setContributingId(null);
    setContribution('');
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this savings goal?')) return;
    await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
    toast({ title: 'Goal deleted' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Set targets and track progress toward what matters.</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New savings goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal name</Label>
                <Input id="name" placeholder="Emergency fund" {...register('name')} />
                {errors.name && <p className="text-xs text-coral">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target amount</Label>
                <Input id="targetAmount" type="number" step="0.01" {...register('targetAmount')} />
                {errors.targetAmount && <p className="text-xs text-coral">{errors.targetAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Starting amount</Label>
                <Input id="currentAmount" type="number" step="0.01" {...register('currentAmount')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date (optional)</Label>
                <Input id="targetDate" type="date" {...register('targetDate')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create goal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No savings goals yet</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Create your first goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
            return (
              <Card key={goal.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      {goal.targetDate && (
                        <p className="text-xs text-muted-foreground">Target {formatDate(goal.targetDate)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {goal.status === 'COMPLETED' && <Badge variant="emerald">Complete</Badge>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-coral" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono tabular-nums">
                      {formatCurrency(goal.currentAmount as unknown as number)} of{' '}
                      {formatCurrency(goal.targetAmount as unknown as number)}
                    </span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>

                  {contributingId === goal.id ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={contribution}
                        onChange={(e) => setContribution(e.target.value)}
                        className="h-9"
                      />
                      <Button size="sm" onClick={() => handleContribute(goal)}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setContributingId(goal.id)}
                      disabled={goal.status === 'COMPLETED'}
                    >
                      Add contribution
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
