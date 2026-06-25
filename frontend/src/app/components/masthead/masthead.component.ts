import { Component, inject } from '@angular/core';
import { ApprovalService } from '../../approval.service';

@Component({
  selector: 'app-masthead',
  standalone: true,
  templateUrl: './masthead.component.html',
})
export class MastheadComponent {
  private readonly service = inject(ApprovalService);
  protected readonly counts = this.service.counts;
}
