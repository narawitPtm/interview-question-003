package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"example.com/it03-approval/internal/handler"
	"example.com/it03-approval/internal/repository"
	"example.com/it03-approval/migrations"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL env var is required")
	}

	ctx := context.Background()

	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer db.Close()

	if err := runMigration(ctx, db); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	repo := repository.New(db)
	h := handler.New(repo)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/documents", h.List)
	mux.HandleFunc("POST /api/documents/approve", h.Approve)
	mux.HandleFunc("POST /api/documents/reject", h.Reject)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}

func runMigration(ctx context.Context, db *pgxpool.Pool) error {
	sql, err := migrations.FS.ReadFile("001_init.sql")
	if err != nil {
		return err
	}
	_, err = db.Exec(ctx, string(sql))
	return err
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
