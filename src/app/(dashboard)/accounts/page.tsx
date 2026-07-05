'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Wallet, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { BankAccount } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountDialog } from '@/components/accounts/account-dialog';
import { useToast } from '@/components/ui/use-toast';

const TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit card',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
  OTHER: 'Other',
};

export default function AccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await apiFetch<BankAccount[]>('/api/accounts');
    setAccounts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Archive this account? Its transaction history is preserved.')) return;
    try {
      await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' });
      toast({ title: 'Account archived' });
      load();
    } catch (err) {
      toast({ title: 'Could not archive account', description: (err as Error).message, variant: 'destructive' });
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total balance across all accounts</p>
          <p className="font-mono text-3xl font-semibold tabular-nums">{formatCurrency(totalBalance)}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No accounts yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add a checking, savings, or cash account to start recording transactions.
            </p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Add your first account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: account.color }} />
              <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{TYPE_LABELS[account.type]}</p>
                  <p className="font-medium">{account.name}</p>
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {formatCurrency(account.balance as unknown as number, account.currency)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(account);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-coral">
                      <Trash2 className="mr-2 h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} account={editing} onSaved={load} />
    </div>
  );
}
