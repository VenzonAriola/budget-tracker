'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryFormValues } from '@/lib/validations';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { Category } from '@prisma/client';

const SWATCHES = ['#6C63F5', '#1FAA75', '#E2543D', '#E8A63A', '#5750D6', '#12172B'];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          monthlyLimit: category.monthlyLimit ? Number(category.monthlyLimit) : undefined,
        }
      : { name: '', type: 'EXPENSE', icon: 'Tag', color: '#6C63F5' },
  });

  const color = watch('color');

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (category) {
        await apiFetch(`/api/categories/${category.id}`, { method: 'PATCH', body: JSON.stringify(values) });
        toast({ title: 'Category updated' });
      } else {
        await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(values) });
        toast({ title: 'Category created' });
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
          <DialogTitle>{category ? 'Edit category' : 'Add category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category name</Label>
            <Input id="name" placeholder="Groceries" {...register('name')} />
            {errors.name && <p className="text-xs text-coral">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              defaultValue={category?.type ?? 'EXPENSE'}
              onValueChange={(v) => setValue('type', v as CategoryFormValues['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyLimit">Monthly budget limit (optional)</Label>
            <Input id="monthlyLimit" type="number" step="0.01" placeholder="500.00" {...register('monthlyLimit')} />
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
              {isSubmitting ? 'Saving…' : category ? 'Save changes' : 'Add category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
