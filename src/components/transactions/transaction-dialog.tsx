'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BankAccount, Category, Transaction } from '@prisma/client';
import { transactionSchema, type TransactionFormValues } from '@/lib/validations';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

function toDateInputValue(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  accounts: BankAccount[];
  categories: Category[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          accountId: transaction.accountId,
          categoryId: transaction.categoryId ?? undefined,
          type: transaction.type,
          amount: Number(transaction.amount),
          description: transaction.description ?? '',
          merchant: transaction.merchant ?? '',
          date: new Date(transaction.date),
          tags: transaction.tags,
        }
      : {
          accountId: accounts[0]?.id ?? '',
          type: 'EXPENSE',
          amount: 0,
          description: '',
          merchant: '',
          date: new Date(),
          tags: [],
        },
  });

  useEffect(() => {
    if (open) {
      reset(
        transaction
          ? {
              accountId: transaction.accountId,
              categoryId: transaction.categoryId ?? undefined,
              type: transaction.type,
              amount: Number(transaction.amount),
              description: transaction.description ?? '',
              merchant: transaction.merchant ?? '',
              date: new Date(transaction.date),
              tags: transaction.tags,
            }
          : {
              accountId: accounts[0]?.id ?? '',
              type: 'EXPENSE',
              amount: 0,
              description: '',
              merchant: '',
              date: new Date(),
              tags: [],
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  const type = watch('type');
  const filteredCategories = categories.filter((c) => c.type === type);

  async function onSubmit(values: TransactionFormValues) {
    try {
      if (transaction) {
        await apiFetch(`/api/transactions/${transaction.id}`, { method: 'PATCH', body: JSON.stringify(values) });
        toast({ title: 'Transaction updated' });
      } else {
        await apiFetch('/api/transactions', { method: 'POST', body: JSON.stringify(values) });
        toast({ title: 'Transaction added' });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast({ title: 'Something went wrong', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setValue('type', t)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  type === t ? 'border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink' : 'border-input'
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount')} />
            {errors.amount && <p className="text-xs text-coral">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                defaultValue={transaction?.accountId ?? accounts[0]?.id}
                onValueChange={(v) => setValue('accountId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && <p className="text-xs text-coral">{errors.accountId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                defaultValue={transaction?.categoryId ?? undefined}
                onValueChange={(v) => setValue('categoryId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant (optional)</Label>
            <Input id="merchant" placeholder="Whole Foods" {...register('merchant')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Note (optional)</Label>
            <Input id="description" placeholder="Weekly groceries" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              defaultValue={toDateInputValue(transaction?.date ?? new Date())}
              onChange={(e) => setValue('date', new Date(e.target.value))}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
