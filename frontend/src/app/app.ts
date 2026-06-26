import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ApprovalDocument, ModalKind } from './models/approval';
import { ApprovalService } from './approval.service';
import { MastheadComponent } from './components/masthead/masthead.component';
import { FilterToolbarComponent } from './components/filter-toolbar/filter-toolbar.component';
import { DocumentTableComponent, QuickActionEvent } from './components/document-table/document-table.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [MastheadComponent, FilterToolbarComponent, DocumentTableComponent, ConfirmModalComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly service = inject(ApprovalService);

  protected readonly selected = signal<ReadonlySet<number>>(new Set());
  protected readonly modal = signal<ModalKind | null>(null);
  protected readonly selectedCount = computed(() => this.selected().size);

  private readonly pendingDocs = computed(() =>
    this.service.documents().filter((d) => d.status === 'PENDING'),
  );

  ngOnInit(): void {
    this.service.load();
  }

  protected onFilterChange(): void {
    this.selected.set(new Set());
  }

  protected openModal(kind: ModalKind): void {
    if (this.selectedCount() === 0) return;
    this.modal.set(kind);
  }

  protected closeModal(): void {
    this.modal.set(null);
  }

  protected toggleRow(doc: ApprovalDocument): void {
    this.selected.update((set) => {
      const next = new Set(set);
      next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id);
      return next;
    });
  }

  protected toggleAll(): void {
    this.selected.update((set) => {
      const pending = this.pendingDocs();
      if (pending.every((d) => set.has(d.id))) return new Set();
      const next = new Set(set);
      for (const d of pending) next.add(d.id);
      return next;
    });
  }

  protected onQuickAction({ doc, kind }: QuickActionEvent): void {
    this.selected.set(new Set([doc.id]));
    this.openModal(kind);
  }

  protected confirm(reason: string): void {
    const kind = this.modal();
    if (!kind) return;
    const ids = this.selected();
    if (kind === 'APPROVE') this.service.approve(ids, reason);
    else this.service.reject(ids, reason);
    this.selected.set(new Set());
    this.modal.set(null);
  }
}
