// Toasts slice — just a list. Auto-dismissal lives in useToastLifecycle
// so we don't run setTimeout inside an immer producer.

import type { AppSlice } from '../store';
import type { Toast, ToastKind } from '../types';
import { uid } from '../helpers';

export interface ToastSlice {
  toasts: Toast[];
  toast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
}

export const createToastSlice: AppSlice<ToastSlice> = (set) => ({
  toasts: [],
  toast: (message, kind = 'info') => set((s) => {
    s.toasts.push({ id: uid(), message, kind });
  }),
  dismissToast: (id) => set((s) => {
    s.toasts = s.toasts.filter((t) => t.id !== id);
  }),
});
