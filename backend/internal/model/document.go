package model

type Status string

const (
	StatusPending  Status = "PENDING"
	StatusApproved Status = "APPROVED"
	StatusRejected Status = "REJECTED"
)

type Document struct {
	ID          int64   `json:"id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Requester   string  `json:"requester"`
	SubmittedAt string  `json:"submittedAt"`
	Status      Status  `json:"status"`
	Reason      *string `json:"reason,omitempty"`
	DecidedAt   *string `json:"decidedAt,omitempty"`
}

type PagedResult struct {
	Data     []Document `json:"data"`
	Total    int        `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"pageSize"`
}
