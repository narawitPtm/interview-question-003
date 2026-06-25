# IT 03 — Document Approval System

Web application for managing document approval workflows. Built with Go (backend) and Angular (frontend).

---

## Features

### IT 03-1 — Document List
- Table of all submitted documents with code, name, requester, date, and approval status
- **Filter by status** — All / Pending / Approved / Rejected tabs (server-side)
- **Sortable columns** — click any column header to sort ascending/descending; default sort is submitted date descending
- Status summary counters in the header (pending / approved / rejected)
- Skeleton loading state on first load

### IT 03-2 — Approve
- Select one or more pending documents via checkboxes, then click **อนุมัติ**
- Or use the per-row quick action button (appears on hover)
- Enter an optional reason in the confirmation modal
- Only documents with status `PENDING` can be approved — enforced in both UI and SQL

### IT 03-3 — Reject
- Same flow as approve but marks documents as **ไม่อนุมัติ**
- Reason field available in the confirmation modal

### Bulk actions
- Select all pending documents at once with the header checkbox
- Approve or reject multiple documents in a single request

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go, `net/http`, `pgx/v5` |
| Database | PostgreSQL 17 (`BIGSERIAL` primary key) |
| Migrations | goose v3 (embedded, runs on startup) |
| Frontend | Angular 22, signals, standalone components |
| Serving | nginx (proxies `/api/*` to backend) |
| Container | Docker Compose |

---

## Run with Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

This single command:
1. Starts PostgreSQL 17
2. Builds and starts the Go backend — runs database migrations automatically on startup
3. Builds the Angular app and serves it via nginx

Open **http://localhost:4200**

To stop:
```bash
docker compose down
```

---

## Run locally (without Docker)

### Prerequisites

- Go 1.25+
- Node.js 22+
- PostgreSQL running locally

### 1. Database

```sql
CREATE DATABASE it03;
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if needed
go run ./cmd/server
```

Migrations run automatically on startup. Server listens on `:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Angular dev server starts on **http://localhost:4200** and proxies `/api/*` to `localhost:8080`.

---

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/documents` | List documents (paginated, sorted, filtered) |
| `POST` | `/api/documents/approve` | Approve documents by ID |
| `POST` | `/api/documents/reject` | Reject documents by ID |

### GET /api/documents

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `pageSize` | `20` | Items per page (max 100) |
| `sort` | `submittedAt` | Column: `code`, `name`, `requester`, `submittedAt`, `status` |
| `order` | `desc` | `asc` or `desc` |
| `status` | _(all)_ | Filter: `PENDING`, `APPROVED`, `REJECTED` |

Response:
```json
{ "data": [...], "total": 10, "page": 1, "pageSize": 20 }
```

### POST /api/documents/approve — /reject

```json
{ "ids": [1, 2, 3], "reason": "ตรวจสอบแล้วถูกต้อง" }
```

Only `PENDING` documents are updated. Already-decided documents are silently skipped.

---

## ER Diagram

```
┌─────────────────────────────────────────────────┐
│                document_statuses                 │
├──────────┬─────────────┬────────────────────────┤
│ id       │ SMALLINT    │ PK                     │
│ code     │ VARCHAR(20) │ UNIQUE NOT NULL         │
│ label_th │ VARCHAR(100)│ NOT NULL               │
└──────────┴─────────────┴────────────────────────┘
           │ 1
           │
           │ N
┌─────────────────────────────────────────────────┐
│                   documents                      │
├─────────────────┬──────────────┬────────────────┤
│ id              │ BIGSERIAL    │ PK             │
│ code            │ VARCHAR(20)  │ UNIQUE NOT NULL│
│ name            │ VARCHAR(255) │ NOT NULL       │
│ requester       │ VARCHAR(100) │ NOT NULL       │
│ submitted_at    │ DATE         │ NOT NULL       │
│ status_id       │ SMALLINT     │ FK → document_statuses.id │
│ reason          │ TEXT         │ nullable       │
│ decided_at      │ DATE         │ nullable       │
│ created_at      │ TIMESTAMPTZ  │ NOT NULL       │
│ updated_at      │ TIMESTAMPTZ  │ NOT NULL       │
└─────────────────┴──────────────┴────────────────┘
```

**document_statuses seed data:**

| id | code | label_th |
|---|---|---|
| 1 | `PENDING` | รออนุมัติ |
| 2 | `APPROVED` | อนุมัติ |
| 3 | `REJECTED` | ไม่อนุมัติ |

---

## Project Structure

```
backend/
  cmd/server/main.go        # entry point, migrations, routing
  internal/handler/         # HTTP handlers
  internal/repository/      # database queries
  internal/model/           # shared types
  migrations/               # goose SQL migrations (embedded)

frontend/
  src/app/
    app.ts                  # root component
    app.html                # template
    app.scss                # styles
    approval.service.ts     # state, HTTP, sort/filter/pagination
    models/approval.ts      # TypeScript types
```
