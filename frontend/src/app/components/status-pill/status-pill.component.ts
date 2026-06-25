import { Component, computed, input } from '@angular/core';
import { ApprovalStatus, STATUS_LABEL } from '../../models/approval';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  template: `
    <span class="pill" [class]="'pill--' + statusClass()">
      <span class="pill__dot"></span>{{ label() }}
    </span>
  `,
})
export class StatusPillComponent {
  readonly status = input.required<ApprovalStatus>();
  protected readonly statusClass = computed(() => this.status().toLowerCase());
  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
}
