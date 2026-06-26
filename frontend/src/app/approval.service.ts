import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApprovalDocument } from './models/approval';
import { ToastService } from './toast.service';

export type SortField = 'code' | 'name' | 'requester' | 'submittedAt' | 'status';
export type SortOrder = 'asc' | 'desc';

interface PagedResult {
  data: ApprovalDocument[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  private readonly _docs = signal<ApprovalDocument[]>([]);
  private readonly _loading = signal(false);
  private readonly _total = signal(0);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _sort = signal<SortField>('submittedAt');
  private readonly _order = signal<SortOrder>('desc');
  private readonly _statusFilter = signal('');

  readonly documents = this._docs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly order = this._order.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this._total() / this._pageSize())));

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
    const params: Record<string, string> = {
      page: String(this._page()),
      pageSize: String(this._pageSize()),
      sort: this._sort(),
      order: this._order(),
    };
    if (this._statusFilter()) params['status'] = this._statusFilter();
    this.http.get<PagedResult>('/api/documents', { params }).subscribe({
      next: (res) => {
        this._docs.set(res.data);
        this._total.set(res.total);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.toast.error('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      },
    });
  }

  setSort(field: SortField): void {
    if (this._sort() === field) {
      this._order.update((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      this._sort.set(field);
      this._order.set('desc');
    }
    this._page.set(1);
    this.load();
  }

  setStatusFilter(status: string): void {
    this._statusFilter.set(status);
    this._page.set(1);
    this.load();
  }

  setPage(page: number): void {
    const max = this.totalPages();
    if (page < 1 || page > max) return;
    this._page.set(page);
    this.load();
  }

  approve(ids: Iterable<number>, reason: string): void {
    const count = [...ids].length;
    this.http.post<void>('/api/documents/approve', { ids: [...ids], reason }).subscribe({
      next: () => {
        this.toast.success(`อนุมัติ ${count} รายการสำเร็จ`);
        this.load();
      },
      error: () => this.toast.error('อนุมัติไม่สำเร็จ กรุณาลองใหม่'),
    });
  }

  reject(ids: Iterable<number>, reason: string): void {
    const count = [...ids].length;
    this.http.post<void>('/api/documents/reject', { ids: [...ids], reason }).subscribe({
      next: () => {
        this.toast.success(`ไม่อนุมัติ ${count} รายการสำเร็จ`);
        this.load();
      },
      error: () => this.toast.error('บันทึกการปฏิเสธไม่สำเร็จ กรุณาลองใหม่'),
    });
  }
}
