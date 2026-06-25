import { Component, computed, inject, input, output } from '@angular/core';
import { ApprovalDocument, ModalKind } from '../../models/approval';
import { ApprovalService, SortField } from '../../approval.service';
import { StatusPillComponent } from '../status-pill/status-pill.component';

export interface QuickActionEvent {
  doc: ApprovalDocument;
  kind: ModalKind;
}

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [StatusPillComponent],
  templateUrl: './document-table.component.html',
})
export class DocumentTableComponent {
  private readonly service = inject(ApprovalService);

  readonly selected = input.required<ReadonlySet<number>>();
  readonly toggleRow = output<ApprovalDocument>();
  readonly toggleAll = output<void>();
  readonly quickAction = output<QuickActionEvent>();

  protected readonly documents = this.service.documents;
  protected readonly loading = this.service.loading;
  protected readonly sort = this.service.sort;
  protected readonly order = this.service.order;

  protected readonly pendingDocs = computed(() =>
    this.documents().filter((d) => d.status === 'PENDING'),
  );

  protected readonly allPendingSelected = computed(() => {
    const pending = this.pendingDocs();
    return pending.length > 0 && pending.every((d) => this.selected().has(d.id));
  });

  protected isSelectable(doc: ApprovalDocument): boolean {
    return doc.status === 'PENDING';
  }

  protected isSelected(id: number): boolean {
    return this.selected().has(id);
  }

  protected sortBy(field: SortField): void {
    this.service.setSort(field);
  }

  protected formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  protected onToggleRow(doc: ApprovalDocument): void {
    if (!this.isSelectable(doc)) return;
    this.toggleRow.emit(doc);
  }

  protected onQuickAction(doc: ApprovalDocument, kind: ModalKind, event: Event): void {
    event.stopPropagation();
    this.quickAction.emit({ doc, kind });
  }
}
