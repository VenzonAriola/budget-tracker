'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import type { Transaction, BankAccount, Category } from '@prisma/client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TransactionRow = Transaction & { account: BankAccount; category: Category | null };

const columnHelper = createColumnHelper<TransactionRow>();

export function TransactionsTable({
  data,
  onEdit,
  onDelete,
}: {
  data: TransactionRow[];
  onEdit: (t: TransactionRow) => void;
  onDelete: (id: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => <span className="whitespace-nowrap text-sm">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor((row: TransactionRow) => row.description || row.merchant || '—', {
        id: 'description',
        header: 'Description',
        cell: (info) => (
          <div>
            <p className="text-sm font-medium">{info.getValue()}</p>
            {info.row.original.merchant && info.row.original.description && (
              <p className="text-xs text-muted-foreground">{info.row.original.merchant}</p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor((row: TransactionRow) => row.category?.name ?? 'Uncategorized', {
        id: 'category',
        header: 'Category',
        cell: (info) => (
          <Badge
            variant="secondary"
            style={
              info.row.original.category
                ? { backgroundColor: `${info.row.original.category.color}1A`, color: info.row.original.category.color }
                : undefined
            }
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('account.name', {
        id: 'account',
        header: 'Account',
        cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
          const type = info.row.original.type;
          const amount = Number(info.getValue());
          return (
            <span
              className={cn(
                'font-mono text-sm font-medium tabular-nums',
                type === 'INCOME' && 'text-emerald-600',
                type === 'EXPENSE' && 'text-coral-600'
              )}
            >
              {type === 'EXPENSE' ? '-' : type === 'INCOME' ? '+' : ''}
              {formatCurrency(amount)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(info.row.original)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-coral"
              onClick={() => onDelete(info.row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      }),
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <button
                    className={cn('flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer select-none')}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
              No transactions match your filters.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="ledger-row">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
