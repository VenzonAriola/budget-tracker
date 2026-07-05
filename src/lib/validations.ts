import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'OTHER']),
  balance: z.coerce.number().finite(),
  color: z.string().default('#1FAA75'),
  currency: z.string().default('USD'),
});
export type AccountFormValues = z.infer<typeof accountSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(40),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  icon: z.string().default('Tag'),
  color: z.string().default('#6C63F5'),
  monthlyLimit: z.coerce.number().nonnegative().optional().nullable(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const transactionSchema = z.object({
  accountId: z.string().min(1, 'Select an account'),
  categoryId: z.string().min(1, 'Select a category').optional().nullable(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().max(200).optional(),
  merchant: z.string().max(100).optional(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});
export type BudgetFormValues = z.infer<typeof budgetSchema>;

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(60),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().nonnegative().default(0),
  targetDate: z.coerce.date().optional().nullable(),
  color: z.string().default('#6C63F5'),
});
export type SavingsGoalFormValues = z.infer<typeof savingsGoalSchema>;

export const billSchema = z.object({
  name: z.string().min(1, 'Bill name is required').max(60),
  amount: z.coerce.number().positive(),
  dueDate: z.coerce.date(),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  autoRemind: z.boolean().default(true),
});
export type BillFormValues = z.infer<typeof billSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;
