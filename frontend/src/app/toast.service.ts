import { Injectable, signal } from '@angular/core';
import { Toast, ToastKind } from './models/toast';

const DEFAULT_DURATION = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private nextId = 0;

  readonly toasts = this._toasts.asReadonly();

  show(message: string, kind: ToastKind = 'error', duration = DEFAULT_DURATION): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
