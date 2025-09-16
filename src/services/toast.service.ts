import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  add(toastInput: Omit<Toast, 'id'>): void {
    const id = this.idCounter++;
    const newToast: Toast = { ...toastInput, id };

    this.toasts.update(currentToasts => [...currentToasts, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, toastInput.duration || 4000);
  }

  remove(id: number): void {
    this.toasts.update(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }
}