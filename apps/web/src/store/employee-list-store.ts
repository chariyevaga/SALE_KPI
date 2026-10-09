import { create } from 'zustand';

import { useAuthStore } from './auth-store';

/** Filters of the employee list, applied from the filter drawer. */
export interface EmployeeFilters {
  status: 'all' | 'active' | 'inactive';
  managersOnly: boolean;
  erpLinkedOnly: boolean;
  withAvatarOnly: boolean;
  /** Default store (ADR-058); `null`: every store. */
  storeId: number | null;
}

export const EMPTY_EMPLOYEE_FILTERS: EmployeeFilters = {
  status: 'all',
  managersOnly: false,
  erpLinkedOnly: false,
  withAvatarOnly: false,
  storeId: null,
};

export const DEFAULT_EMPLOYEE_SORT = 'firstname-asc';

interface EmployeeListState {
  /** What is typed in the search box, before the debounce. */
  searchInput: string;
  filters: EmployeeFilters;
  sortValue: string;
  setSearchInput: (searchInput: string) => void;
  setFilters: (filters: EmployeeFilters) => void;
  setSortValue: (sortValue: string) => void;
  reset: () => void;
}

const INITIAL = {
  searchInput: '',
  filters: EMPTY_EMPLOYEE_FILTERS,
  sortValue: DEFAULT_EMPLOYEE_SORT,
};

/**
 * Search, filters and sort of the employee list. They live in memory, not in the page, so
 * opening an employee and coming back keeps them; a reload (F5) starts clean, as asked.
 */
export const useEmployeeListStore = create<EmployeeListState>((set) => ({
  ...INITIAL,
  setSearchInput: (searchInput) => set({ searchInput }),
  setFilters: (filters) => set({ filters }),
  setSortValue: (sortValue) => set({ sortValue }),
  reset: () => set(INITIAL),
}));

// The next person to sign in on this tab starts with an unfiltered list.
useAuthStore.subscribe((state, previous) => {
  if (previous.isAuthenticated && !state.isAuthenticated) {
    useEmployeeListStore.getState().reset();
  }
});
