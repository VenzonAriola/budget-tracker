import { create } from 'zustand';

interface TransactionFilters {
  search: string;
  accountId: string | null;
  categoryId: string | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | null;
  dateFrom: string | null;
  dateTo: string | null;
  setSearch: (search: string) => void;
  setAccountId: (id: string | null) => void;
  setCategoryId: (id: string | null) => void;
  setType: (type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | null) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  reset: () => void;
}

const initialState = {
  search: '',
  accountId: null,
  categoryId: null,
  type: null,
  dateFrom: null,
  dateTo: null,
};

export const useFilterStore = create<TransactionFilters>((set) => ({
  ...initialState,
  setSearch: (search) => set({ search }),
  setAccountId: (accountId) => set({ accountId }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setType: (type) => set({ type }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  reset: () => set(initialState),
}));
