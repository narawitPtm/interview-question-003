import { Component, inject, input, output } from '@angular/core';
import { ModalKind } from '../../models/approval';
import { ApprovalService } from '../../approval.service';

@Component({
  selector: 'app-filter-toolbar',
  standalone: true,
  templateUrl: './filter-toolbar.component.html',
})
export class FilterToolbarComponent {
  private readonly service = inject(ApprovalService);

  readonly selectedCount = input.required<number>();
  readonly filterChange = output<void>();
  readonly openModal = output<ModalKind>();

  protected readonly statusFilter = this.service.statusFilter;

  protected setStatusFilter(status: string): void {
    this.service.setStatusFilter(status);
    this.filterChange.emit();
  }
}
