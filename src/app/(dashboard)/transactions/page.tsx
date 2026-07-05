'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Download, FileText, X } from 'lucide-react';
import type { Transaction, BankAccount, Category } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { useFilterStore } from '@/store/filter-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { exportTransactionsToCSV, exportTransactionsToPDF } from '@/lib/export';
import { useToast } from '@/components/ui/use-toast';

type TransactionRow = Transaction & { account: BankAccount; category: Category | null };

export default function TransactionsPage() {
  const { toast } = useToast();
  const filters = useFilterStore();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);

  const loadReferenceData = useCallback(async () => {
    const [accs, cats] = await Promise.all([
      apiFetch<BankAccount[]>('/api/accounts'),
      apiFetch<Category[]>('/api/categories'),
    ]);
    setAccounts(accs);
    setCategories(cats);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.type) params.set('type', filters.type);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    params.set('page', String(page));
    params.set('pageSize', '20');

    const data = await apiFetch<{ transactions: TransactionRow[]; pageCount: number }>(
      `/api/transactions?${params.toString()}`
    );
    setTransactions(data.transactions);
    setPageCount(data.pageCount || 1);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction? This will adjust the account balance.')) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      toast({ title: 'Transaction deleted' });
      loadTransactions();
    } catch (err) {
      toast({ title: 'Could not delete transaction', description: (err as Error).message, variant: 'destructive' });
    }
  }

  const hasActiveFilters = filters.search || filters.accountId || filters.categoryId || filters.type;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description or merchant…"
            className="pl-9"
            value={filters.search}
            onChange={(e) => {
              filters.setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportTransactionsToCSV(transactions)}>
                <FileText className="mr-2 h-4 w-4" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTransactionsToPDF(transactions)}>
                <FileText className="mr-2 h-4 w-4" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add transaction
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.type ?? 'all'} onValueChange={(v) => filters.setType(v === 'all' ? null : (v as any))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.accountId ?? 'all'} onValueChange={(v) => filters.setAccountId(v === 'all' ? null : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.categoryId ?? 'all'} onValueChange={(v) => filters.setCategoryId(v === 'all' ? null : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => filters.reset()}>
            <X className="h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading transactions…</p>
        ) : (
          <TransactionsTable
            data={transactions}
            onEdit={(t) => {
              setEditing(t);
              setDialogOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
        accounts={accounts}
        categories={categories}
        onSaved={loadTransactions}
      />
    </div>
  );
}
