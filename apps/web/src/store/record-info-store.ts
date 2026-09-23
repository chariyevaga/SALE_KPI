import { create } from 'zustand';

import type { AuditedTable } from '../types/api';

/** The record the app-wide record info panel describes (ADR-036). */
export interface RecordInfoTarget {
  tableName: AuditedTable;
  recordId: string;
  /** Shown under the panel title, e.g. the employee's name. */
  title: string;
}

interface RecordInfoState {
  target: RecordInfoTarget | null;
  open: (target: RecordInfoTarget) => void;
  close: () => void;
}

/**
 * One panel for the whole app: every RecordInfoButton opens it here, RecordInfoHost
 * renders it, so record info looks and behaves the same on every screen.
 */
export const useRecordInfoStore = create<RecordInfoState>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
