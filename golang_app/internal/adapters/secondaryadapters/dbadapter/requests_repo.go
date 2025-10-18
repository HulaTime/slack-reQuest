package dbadapter

import (
	"context"
	"fmt"
	"time"

	"request/internal/app/ports/secondaryports"
	"request/internal/domain"

	"gorm.io/gorm"
)

// Determines table structure and changes will generate migrations via atlas
type RequestDTO struct {
	ID              string    `gorm:"not null;primaryKey;type:varchar;size:50"`
	Title           string    `gorm:"not null;type:varchar;size:255"`
	Description     string    `gorm:"type:varchar;size:500"`
	AcceptedByID    string    `gorm:"index"`
	CreatedByID     string    `gorm:"not null;index"`
	RecipientID     string    `gorm:"not null;index"`
	RecipientType   string    `gorm:"not null"`
	Status          string    `gorm:"not null;index"`
	RejectionReason string    `gorm:"type:varchar;size:500"`
	CreatedAt       time.Time `gorm:"not null"`
	UpdatedAt       time.Time `gorm:"not null"`
}

// Used to set the table name by gorm + atlas
func (RequestDTO) TableName() string {
	return "requests"
}

func (dto *RequestDTO) ToDomain() *domain.Request {
	return &domain.Request{
		ID:              dto.ID,
		Title:           dto.Title,
		Description:     dto.Description,
		AcceptedByID:    dto.AcceptedByID,
		CreatedByID:     dto.CreatedByID,
		Recipient:       &domain.RequestRecipient{
			ID:   dto.RecipientID,
			Type: domain.RequestRecipientType(dto.RecipientType),
		},
		Status:          domain.RequestStatus(dto.Status),
		RejectionReason: dto.RejectionReason,
		CreatedAt:       dto.CreatedAt,
		UpdatedAt:       dto.UpdatedAt,
	}
}

func NewRequestDTO(request *domain.Request) *RequestDTO {
	return &RequestDTO{
		ID:              request.ID,
		Title:           request.Title,
		Description:     request.Description,
		AcceptedByID:    request.AcceptedByID,
		CreatedByID:     request.CreatedByID,
		RecipientID:     request.Recipient.ID,
		RecipientType:   string(request.Recipient.Type),
		Status:          string(request.Status),
		RejectionReason: request.RejectionReason,
		CreatedAt:       request.CreatedAt,
		UpdatedAt:       request.UpdatedAt,
	}
}

type RequestsWriter struct {
	db *gorm.DB
}

func NewRequestsWriter(db *gorm.DB) *RequestsWriter {
	return &RequestsWriter{db: db}
}

func (w *RequestsWriter) Save(ctx context.Context, request *domain.Request) error {
	dto := NewRequestDTO(request)
	if err := w.db.WithContext(ctx).Save(dto).Error; err != nil {
		return fmt.Errorf("failed to save request: %w", err)
	}
	return nil
}

type RequestsReader struct {
	db *gorm.DB
}

func NewRequestsReader(db *gorm.DB) *RequestsReader {
	return &RequestsReader{db: db}
}

func (r *RequestsReader) GetById(ctx context.Context, requestId string) (*domain.Request, error) {
	var dto RequestDTO
	if err := r.db.WithContext(ctx).First(&dto, "id = ?", requestId).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("request not found: %s", requestId)
		}
		return nil, fmt.Errorf("failed to get request: %w", err)
	}
	return dto.ToDomain(), nil
}

func (r *RequestsReader) FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Request, error) {
	var dtos []RequestDTO
	if err := r.db.WithContext(ctx).Find(&dtos, "created_by_id = ?", createdById).Error; err != nil {
		return nil, fmt.Errorf("failed to find requests by created_by_id: %w", err)
	}

	requests := make([]*domain.Request, len(dtos))
	for i, dto := range dtos {
		requests[i] = dto.ToDomain()
	}
	return requests, nil
}

func (r *RequestsReader) FindByAcceptedById(ctx context.Context, acceptedById string) ([]*domain.Request, error) {
	var dtos []RequestDTO
	if err := r.db.WithContext(ctx).Find(&dtos, "accepted_by_id = ?", acceptedById).Error; err != nil {
		return nil, fmt.Errorf("failed to find requests by accepted_by_id: %w", err)
	}

	requests := make([]*domain.Request, len(dtos))
	for i, dto := range dtos {
		requests[i] = dto.ToDomain()
	}
	return requests, nil
}

func (r *RequestsReader) FindByRecipient(ctx context.Context, recipient domain.RequestRecipient) ([]*domain.Request, error) {
	var dtos []RequestDTO
	if err := r.db.WithContext(ctx).Find(&dtos, "recipient_id = ? AND recipient_type = ?", recipient.ID, string(recipient.Type)).Error; err != nil {
		return nil, fmt.Errorf("failed to find requests by recipient: %w", err)
	}

	requests := make([]*domain.Request, len(dtos))
	for i, dto := range dtos {
		requests[i] = dto.ToDomain()
	}
	return requests, nil
}

func (r *RequestsReader) FindByRecipientAndStatuses(
	ctx context.Context,
	recipientId string,
	recipientType domain.RequestRecipientType,
	statuses []domain.RequestStatus,
) ([]*domain.Request, error) {
	var dtos []RequestDTO

	query := r.db.WithContext(ctx).Where("recipient_id = ? AND recipient_type = ?", recipientId, string(recipientType))

	if len(statuses) > 0 {
		statusStrings := make([]string, len(statuses))
		for i, status := range statuses {
			statusStrings[i] = string(status)
		}
		query = query.Where("status IN ?", statusStrings)
	}

	if err := query.Find(&dtos).Error; err != nil {
		return nil, fmt.Errorf("failed to find requests by recipient and statuses: %w", err)
	}

	requests := make([]*domain.Request, len(dtos))
	for i, dto := range dtos {
		requests[i] = dto.ToDomain()
	}
	return requests, nil
}

var _ secondaryports.ForStoringRequests = (*RequestsWriter)(nil)
var _ secondaryports.ForReadingRequests = (*RequestsReader)(nil)
