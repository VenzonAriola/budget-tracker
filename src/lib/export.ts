import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction, BankAccount, Category } from '@prisma/client';

type TransactionRow = Transaction & { account: BankAccount; category: Category | null };

export function exportTransactionsToCSV(transactions: TransactionRow[]) {
  const rows = transactions.map((t) => ({
    Date: formatDate(t.date),
    Type: t.type,
    Description: t.description ?? '',
    Merchant: t.merchant ?? '',
    Category: t.category?.name ?? 'Uncategorized',
    Account: t.account.name,
    Amount: Number(t.amount).toFixed(2),
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportTransactionsToPDF(transactions: TransactionRow[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Transactions', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${formatDate(new Date())}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Type', 'Description', 'Category', 'Account', 'Amount']],
    body: transactions.map((t) => [
      formatDate(t.date),
      t.type,
      t.description ?? t.merchant ?? '—',
      t.category?.name ?? 'Uncategorized',
      t.account.name,
      formatCurrency(t.amount as unknown as number),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [18, 23, 43] },
  });

  doc.save(`transactions-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
