'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@prisma/client';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await apiFetch<Category[]>('/api/categories');
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Transactions using it will become uncategorized.')) return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      toast({ title: 'Category deleted' });
      load();
    } catch (err) {
      toast({ title: 'Could not delete category', description: (err as Error).message, variant: 'destructive' });
    }
  }

  const groups: Record<string, Category[]> = { INCOME: [], EXPENSE: [], TRANSFER: [] };
  categories.forEach((c) => groups[c.type]?.push(c));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Organize transactions and set monthly limits per category.</p>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Tag className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No categories yet</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Add your first category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map(
            (type) =>
              groups[type].length > 0 && (
                <div key={type} className="space-y-3">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {type === 'INCOME' ? 'Income' : type === 'EXPENSE' ? 'Expenses' : 'Transfers'}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groups[type].map((category) => (
                      <Card key={category.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              <Tag className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-medium">{category.name}</p>
                              {category.monthlyLimit && (
                                <Badge variant="secondary" className="mt-0.5">
                                  Limit {formatCurrency(category.monthlyLimit as unknown as number)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditing(category);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-coral"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} onSaved={load} />
    </div>
  );
}
