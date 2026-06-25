package model

type Status string

const (
	StatusPending  Status = "PENDING"
	StatusApproved Status = "APPROVED"
	StatusRejected Status = "REJECTED"
)

type Document struct {
	ID          int     `json:"id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Requester   string  `json:"requester"`
	SubmittedAt string  `json:"submittedAt"`
	Status      Status  `json:"status"`
	Reason      *string `json:"reason,omitempty"`
	DecidedAt   *string `json:"decidedAt,omitempty"`
}
