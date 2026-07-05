'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, type AccountFormValues } from '@/lib/validations';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { BankAccount } from '@prisma/client';

const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'OTHER'] as const;
const SWATCHES = ['#1FAA75', '#6C63F5', '#E2543D', '#E8A63A', '#12172B'];

export function AccountDialog({
  open,
  onOpenChange,
  account,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount | null;
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
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          balance: Number(account.balance),
          color: account.color,
          currency: account.currency,
        }
      : { name: '', type: 'CHECKING', balance: 0, color: '#1FAA75', currency: 'USD' },
  });

  const color = watch('color');

  async function onSubmit(values: AccountFormValues) {
    try {
      if (account) {
        await apiFetch(`/api/accounts/${account.id}`, { method: 'PATCH', body: JSON.stringify(values) });
        toast({ title: 'Account updated' });
      } else {
        await apiFetch('/api/accounts', { method: 'POST', body: JSON.stringify(values) });
        toast({ title: 'Account created' });
      }
      reset();
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
          <DialogTitle>{account ? 'Edit account' : 'Add account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account name</Label>
            <Input id="name" placeholder="Everyday Checking" {...register('name')} />
            {errors.name && <p className="text-xs text-coral">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Account type</Label>
            <Select
              defaultValue={account?.type ?? 'CHECKING'}
              onValueChange={(v) => setValue('type', v as AccountFormValues['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">{account ? 'Current balance' : 'Starting balance'}</Label>
            <Input id="balance" type="number" step="0.01" {...register('balance')} />
            {errors.balance && <p className="text-xs text-coral">{errors.balance.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {SWATCHES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setValue('color', c)}
                  className="h-7 w-7 rounded-full ring-offset-2 transition-shadow"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                  aria-label={`Choose ${c}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : account ? 'Save changes' : 'Add account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
