-- +goose Up
-- +goose StatementBegin
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- +goose StatementEnd

CREATE TABLE IF NOT EXISTS documents (
  id           BIGSERIAL       PRIMARY KEY,
  code         VARCHAR(20)     NOT NULL UNIQUE,
  name         VARCHAR(255)    NOT NULL,
  requester    VARCHAR(100)    NOT NULL,
  submitted_at DATE            NOT NULL DEFAULT CURRENT_DATE,
  status       approval_status NOT NULL DEFAULT 'PENDING',
  reason       TEXT,
  decided_at   DATE,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);

INSERT INTO documents (code, name, requester, submitted_at, status, reason, decided_at) VALUES
  ('DOC-001', 'ขอซื้อครุภัณฑ์คอมพิวเตอร์',        'สมชาย ใจดี',    '2025-01-10', 'PENDING',  NULL,                    NULL),
  ('DOC-002', 'ขออนุมัติเดินทางไปอบรม',             'วิภา รักเรียน',  '2025-01-12', 'APPROVED', 'ตรวจสอบแล้วถูกต้อง',    '2025-01-14'),
  ('DOC-003', 'ขอจัดซื้อวัสดุสำนักงาน',            'ประสิทธิ์ ดีมาก','2025-01-15', 'PENDING',  NULL,                    NULL),
  ('DOC-004', 'ขออนุมัติล่วงเวลา',                 'มาลี สุขใจ',     '2025-01-16', 'REJECTED', 'งบประมาณไม่เพียงพอ',    '2025-01-17'),
  ('DOC-005', 'ขอจัดซื้อเครื่องพิมพ์',             'สุรชัย เก่งงาน', '2025-01-18', 'PENDING',  NULL,                    NULL),
  ('DOC-006', 'ขออนุมัติค่าใช้จ่ายในการประชุม',    'นภา ใสสะอาด',   '2025-01-19', 'APPROVED', 'อนุมัติตามระเบียบ',     '2025-01-20'),
  ('DOC-007', 'ขอซื้อซอฟต์แวร์ลิขสิทธิ์',         'ธนา มั่นคง',     '2025-01-20', 'PENDING',  NULL,                    NULL),
  ('DOC-008', 'ขออนุมัติปรับปรุงสำนักงาน',         'รัตนา ขยันดี',   '2025-01-21', 'REJECTED', 'ไม่อยู่ในแผนงานปีนี้',  '2025-01-22'),
  ('DOC-009', 'ขอจัดซื้ออุปกรณ์เครือข่าย',        'พิชัย ตั้งใจ',   '2025-01-22', 'PENDING',  NULL,                    NULL),
  ('DOC-010', 'ขออนุมัติจัดกิจกรรมสัมมนา',        'อรอุมา ร่าเริง', '2025-01-23', 'PENDING',  NULL,                    NULL)
ON CONFLICT (code) DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS documents;
DROP TYPE IF EXISTS approval_status;
