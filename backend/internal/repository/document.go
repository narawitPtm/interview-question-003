package repository

import (
	"context"
	"fmt"

	"example.com/it03-approval/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DocumentRepo struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *DocumentRepo {
	return &DocumentRepo{db: db}
}

var sortCols = map[string]string{
	"code":        "d.code",
	"name":        "d.name",
	"requester":   "d.requester",
	"submittedAt": "d.submitted_at",
	"status":      "ds.code",
}

type ListParams struct {
	Status   string
	Sort     string
	Order    string
	Page     int
	PageSize int
}

func (r *DocumentRepo) List(ctx context.Context, p ListParams) (model.PagedResult, error) {
	col, ok := sortCols[p.Sort]
	if !ok {
		col = "d.submitted_at"
	}
	if p.Order != "asc" {
		p.Order = "desc"
	}

	join := " FROM documents d JOIN document_statuses ds ON ds.id = d.status_id"
	where := ""
	countArgs := []any{}
	dataArgs := []any{}
	if p.Status != "" {
		where = " WHERE ds.code = $1"
		countArgs = append(countArgs, p.Status)
		dataArgs = append(dataArgs, p.Status)
	}

	// safe: col is from whitelist, order is "asc" or "desc"
	orderBy := fmt.Sprintf(" ORDER BY %s %s, d.id %s", col, p.Order, p.Order)

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*)"+join+where, countArgs...).Scan(&total); err != nil {
		return model.PagedResult{}, err
	}

	offset := (p.Page - 1) * p.PageSize
	n := len(dataArgs) + 1
	limit := fmt.Sprintf(" LIMIT $%d OFFSET $%d", n, n+1)
	dataArgs = append(dataArgs, p.PageSize, offset)

	q := `SELECT d.id, d.code, d.name, d.requester,
			     to_char(d.submitted_at, 'YYYY-MM-DD'),
			     ds.code, d.reason,
			     to_char(d.decided_at, 'YYYY-MM-DD')` + join + where + orderBy + limit

	rows, err := r.db.Query(ctx, q, dataArgs...)
	if err != nil {
		return model.PagedResult{}, err
	}
	defer rows.Close()

	docs := []model.Document{}
	for rows.Next() {
		var d model.Document
		if err := rows.Scan(
			&d.ID, &d.Code, &d.Name, &d.Requester,
			&d.SubmittedAt, &d.Status, &d.Reason, &d.DecidedAt,
		); err != nil {
			return model.PagedResult{}, err
		}
		docs = append(docs, d)
	}
	if err := rows.Err(); err != nil {
		return model.PagedResult{}, err
	}

	return model.PagedResult{
		Data:     docs,
		Total:    total,
		Page:     p.Page,
		PageSize: p.PageSize,
	}, nil
}

func (r *DocumentRepo) Decide(ctx context.Context, ids []int64, status model.Status, reason string) error {
	if len(ids) == 0 {
		return nil
	}
	_, err := r.db.Exec(ctx, `
		UPDATE documents
		SET status_id  = (SELECT id FROM document_statuses WHERE code = $1),
		    reason     = $2,
		    decided_at = CURRENT_DATE,
		    updated_at = NOW()
		WHERE id = ANY($3)
		  AND status_id = (SELECT id FROM document_statuses WHERE code = 'PENDING')
	`, status, reason, ids)
	return err
}
