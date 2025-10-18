package primaryports

import (
	"context"

	"request/internal/domain"
)

type ForHandlingFormSubmissions interface {
	HandleRequestFormSubmission(ctx context.Context, formData RequestFormData) error
	HandleQueueFormSubmission(ctx context.Context, formData QueueFormData) error
}

type RequestFormData struct {
	Title         string
	Description   string
	RecipientID   string
	RecipientType domain.RequestRecipientType
	CreatedByID   string
}

type QueueFormData struct {
	Name        string
	Description string
	AdminIds    []string
	ChannelId   string
	CreatedById string
}
