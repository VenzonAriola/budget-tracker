import { formatCurrency, cn } from '@/lib/utils';

export function BudgetProgressList({
  items,
}: {
  items: { categoryId: string; categoryName: string; color: string; limit: number; spent: number; percentage: number }[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No budgets set for this month. Add one from the Budgets page to track spending against a limit.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const over = item.spent > item.limit;
        return (
          <div key={item.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.categoryName}</span>
              <span className={cn('font-mono tabular-nums', over ? 'text-coral-600' : 'text-muted-foreground')}>
                {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: over ? '#E2543D' : item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
