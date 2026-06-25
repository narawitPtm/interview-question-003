import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalKind } from '../../models/approval';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  readonly kind = input.required<ModalKind>();
  readonly selectedCount = input.required<number>();
  readonly close = output<void>();
  readonly confirm = output<string>();

  protected readonly reason = signal('');

  protected readonly copy = computed(() =>
    this.kind() === 'APPROVE'
      ? { code: 'IT 03-2', title: 'ยืนยันการอนุมัติ', confirm: 'อนุมัติ' }
      : { code: 'IT 03-3', title: 'ยืนยันการไม่อนุมัติ', confirm: 'ไม่อนุมัติ' },
  );

  protected onConfirm(): void {
    this.confirm.emit(this.reason().trim());
    this.reason.set('');
  }
}
