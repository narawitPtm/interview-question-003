-- +goose Up
CREATE TABLE document_statuses (
  id       SMALLINT     PRIMARY KEY,
  code     VARCHAR(20)  NOT NULL UNIQUE,
  label_th VARCHAR(100) NOT NULL
);

INSERT INTO document_statuses (id, code, label_th) VALUES
  (1, 'PENDING',  'รออนุมัติ'),
  (2, 'APPROVED', 'อนุมัติ'),
  (3, 'REJECTED', 'ไม่อนุมัติ');

ALTER TABLE documents ADD COLUMN status_id SMALLINT REFERENCES document_statuses(id);

UPDATE documents d
SET status_id = ds.id
FROM document_statuses ds
WHERE ds.code = d.status::text;

ALTER TABLE documents ALTER COLUMN status_id SET NOT NULL;
ALTER TABLE documents DROP COLUMN status;
DROP TYPE approval_status;

CREATE INDEX IF NOT EXISTS idx_documents_status_id ON documents (status_id);

-- +goose Down
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE documents ADD COLUMN status approval_status;
UPDATE documents d SET status = ds.code::approval_status FROM document_statuses ds WHERE ds.id = d.status_id;
ALTER TABLE documents ALTER COLUMN status SET NOT NULL;
ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE documents DROP COLUMN status_id;
DROP TABLE document_statuses;
