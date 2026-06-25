package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"example.com/it03-approval/internal/model"
	"example.com/it03-approval/internal/repository"
)

type DocumentHandler struct {
	repo *repository.DocumentRepo
}

func New(repo *repository.DocumentRepo) *DocumentHandler {
	return &DocumentHandler{repo: repo}
}

func (h *DocumentHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(q.Get("pageSize"))
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	result, err := h.repo.List(r.Context(), repository.ListParams{
		Status:   q.Get("status"),
		Sort:     q.Get("sort"),
		Order:    q.Get("order"),
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, result)
}

type decideRequest struct {
	IDs    []int64   `json:"ids"`
	Reason string    `json:"reason"`
}

func (h *DocumentHandler) Approve(w http.ResponseWriter, r *http.Request) {
	h.decide(w, r, model.StatusApproved)
}

func (h *DocumentHandler) Reject(w http.ResponseWriter, r *http.Request) {
	h.decide(w, r, model.StatusRejected)
}

func (h *DocumentHandler) decide(w http.ResponseWriter, r *http.Request, status model.Status) {
	var req decideRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	if len(req.IDs) == 0 {
		http.Error(w, "ids required", http.StatusBadRequest)
		return
	}
	if err := h.repo.Decide(r.Context(), req.IDs, status, req.Reason); err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
