'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Receipt, Trash2, Check } from 'lucide-react';
import type { Bill } from '@prisma/client';
import { billSchema, type BillFormValues } from '@/lib/validations';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function BillsPage() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: { name: '', amount: 0, dueDate: new Date(), frequency: 'MONTHLY', autoRemind: true },
  });

  const autoRemind = watch('autoRemind');

  const load = useCallback(async () => {
    const data = await apiFetch<Bill[]>('/api/bills');
    setBills(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(values: BillFormValues) {
    try {
      await apiFetch('/api/bills', { method: 'POST', body: JSON.stringify(values) });
      toast({ title: 'Bill added' });
      reset();
      setDialogOpen(false);
      load();
    } catch (err) {
      toast({ title: 'Could not add bill', description: (err as Error).message, variant: 'destructive' });
    }
  }

  async function togglePaid(bill: Bill) {
    await apiFetch(`/api/bills/${bill.id}`, { method: 'PATCH', body: JSON.stringify({ isPaid: !bill.isPaid }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bill?')) return;
    await apiFetch(`/api/bills/${id}`, { method: 'DELETE' });
    toast({ title: 'Bill deleted' });
    load();
  }

  const sorted = [...bills].sort((a, b) => Number(a.isPaid) - Number(b.isPaid));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Track recurring bills and get reminders before they're due.</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add bill</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bill name</Label>
                <Input id="name" placeholder="Netflix" {...register('name')} />
                {errors.name && <p className="text-xs text-coral">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-xs text-coral">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" {...register('dueDate')} />
                {errors.dueDate && <p className="text-xs text-coral">{errors.dueDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select defaultValue="MONTHLY" onValueChange={(v) => setValue('frequency', v as BillFormValues['frequency'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRemind">Remind me before it's due</Label>
                <Switch id="autoRemind" checked={autoRemind} onCheckedChange={(v) => setValue('autoRemind', v)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add bill'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No bills tracked yet</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Add your first bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((bill) => {
            const overdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
            return (
              <Card key={bill.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePaid(bill)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                        bill.isPaid ? 'border-emerald bg-emerald text-white' : 'border-muted-foreground'
                      )}
                      aria-label="Toggle paid"
                    >
                      {bill.isPaid && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <p className={cn('text-sm font-medium', bill.isPaid && 'text-muted-foreground line-through')}>
                        {bill.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(bill.dueDate)} · {bill.frequency.charAt(0) + bill.frequency.slice(1).toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {overdue && <Badge variant="coral">Overdue</Badge>}
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {formatCurrency(bill.amount as unknown as number)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-coral" onClick={() => handleDelete(bill.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
