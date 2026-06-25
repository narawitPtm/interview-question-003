import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApprovalDocument } from './models/approval';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly http = inject(HttpClient);

  private readonly _docs = signal<ApprovalDocument[]>([]);
  private readonly _loading = signal(false);

  readonly documents = this._docs.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly counts = computed(() => {
    const docs = this._docs();
    return {
      pending: docs.filter((d) => d.status === 'PENDING').length,
      approved: docs.filter((d) => d.status === 'APPROVED').length,
      rejected: docs.filter((d) => d.status === 'REJECTED').length,
    };
  });

  load(): void {
    this._loading.set(true);
    this.http.get<ApprovalDocument[]>('/api/documents').subscribe({
      next: (docs) => {
        this._docs.set(docs);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  approve(ids: Iterable<number>, reason: string): void {
    this.http
      .post<void>('/api/documents/approve', { ids: [...ids], reason })
      .subscribe({ next: () => this.load() });
  }

  reject(ids: Iterable<number>, reason: string): void {
    this.http
      .post<void>('/api/documents/reject', { ids: [...ids], reason })
      .subscribe({ next: () => this.load() });
  }
}
