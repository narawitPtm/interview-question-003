package repository

import (
	"context"

	"example.com/it03-approval/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DocumentRepo struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *DocumentRepo {
	return &DocumentRepo{db: db}
}

func (r *DocumentRepo) List(ctx context.Context, status string) ([]model.Document, error) {
	q := `
		SELECT id, code, name, requester,
		       to_char(submitted_at, 'YYYY-MM-DD'),
		       status, reason,
		       to_char(decided_at, 'YYYY-MM-DD')
		FROM documents`

	args := []any{}
	if status != "" {
		q += " WHERE status = $1"
		args = append(args, status)
	}
	q += " ORDER BY submitted_at DESC, id DESC"

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []model.Document
	for rows.Next() {
		var d model.Document
		if err := rows.Scan(
			&d.ID, &d.Code, &d.Name, &d.Requester,
			&d.SubmittedAt, &d.Status, &d.Reason, &d.DecidedAt,
		); err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}
	return docs, rows.Err()
}

func (r *DocumentRepo) Decide(ctx context.Context, ids []int, status model.Status, reason string) error {
	if len(ids) == 0 {
		return nil
	}
	_, err := r.db.Exec(ctx, `
		UPDATE documents
		SET status = $1, reason = $2, decided_at = CURRENT_DATE, updated_at = NOW()
		WHERE id = ANY($3) AND status = 'PENDING'
	`, status, reason, ids)
	return err
}
