export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ModalKind = 'APPROVE' | 'REJECT';

export interface ApprovalDocument {
  id: number;
  code: string;
  name: string;
  requester: string;
  submittedAt: string;
  status: ApprovalStatus;
  reason?: string;
  decidedAt?: string;
}

export const STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติ',
  REJECTED: 'ไม่อนุมัติ',
};
