import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApprovalService, SortField } from './approval.service';
import { ApprovalDocument, ApprovalStatus, STATUS_LABEL } from './models/approval';

type ModalKind = 'APPROVE' | 'REJECT';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly service = inject(ApprovalService);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly documents = this.service.documents;
  protected readonly counts = this.service.counts;
  protected readonly loading = this.service.loading;
  protected readonly sort = this.service.sort;
  protected readonly order = this.service.order;
  protected readonly statusFilter = this.service.statusFilter;

  protected readonly selected = signal<ReadonlySet<number>>(new Set());
  protected readonly modal = signal<ModalKind | null>(null);
  protected readonly reason = signal('');

  protected readonly pendingDocs = computed(() =>
    this.documents().filter((d) => d.status === 'PENDING'),
  );

  protected readonly allPendingSelected = computed(() => {
    const pending = this.pendingDocs();
    return pending.length > 0 && pending.every((d) => this.selected().has(d.id));
  });

  protected readonly selectedCount = computed(() => this.selected().size);

  protected readonly modalCopy = computed(() => {
    const kind = this.modal();
    if (kind === 'APPROVE') {
      return { code: 'IT 03-2', title: 'ยืนยันการอนุมัติ', confirm: 'อนุมัติ', tone: 'approve' as const };
    }
    return { code: 'IT 03-3', title: 'ยืนยันการไม่อนุมัติ', confirm: 'ไม่อนุมัติ', tone: 'reject' as const };
  });

  ngOnInit(): void {
    this.service.load();
  }

  protected isSelectable(doc: ApprovalDocument): boolean {
    return doc.status === 'PENDING';
  }

  protected isSelected(id: number): boolean {
    return this.selected().has(id);
  }

  protected toggleRow(doc: ApprovalDocument): void {
    if (!this.isSelectable(doc)) return;
    this.selected.update((set) => {
      const next = new Set(set);
      next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id);
      return next;
    });
  }

  protected toggleAll(): void {
    this.selected.update((set) => {
      if (this.allPendingSelected()) return new Set();
      const next = new Set(set);
      for (const d of this.pendingDocs()) next.add(d.id);
      return next;
    });
  }

  protected openModal(kind: ModalKind): void {
    if (this.selectedCount() === 0) return;
    this.reason.set('');
    this.modal.set(kind);
  }

  protected closeModal(): void {
    this.modal.set(null);
  }

  protected confirm(): void {
    const kind = this.modal();
    if (!kind) return;
    const ids = this.selected();
    if (kind === 'APPROVE') this.service.approve(ids, this.reason().trim());
    else this.service.reject(ids, this.reason().trim());
    this.selected.set(new Set());
    this.modal.set(null);
  }

  protected statusClass(status: ApprovalStatus): string {
    return status.toLowerCase();
  }

  protected formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  protected sortBy(field: SortField): void {
    this.service.setSort(field);
  }

  protected setStatusFilter(status: string): void {
    this.selected.set(new Set());
    this.service.setStatusFilter(status);
  }

  protected quickAction(doc: ApprovalDocument, kind: ModalKind, event: Event): void {
    event.stopPropagation();
    this.selected.set(new Set([doc.id]));
    this.openModal(kind);
  }
}
