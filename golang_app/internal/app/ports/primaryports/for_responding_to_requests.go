package primaryports

import (
	"context"
	"request/internal/domain"
)

type ForRespondingToRequests interface {
	AcceptRequest(ctx context.Context, requestId, userId string) error
	RejectRequest(ctx context.Context, requestId, userId, reason string) error
	CompleteRequest(ctx context.Context, requestId, userId string) error
	GetRequestDetails(ctx context.Context, requestId string) (*domain.Request, error)
	ListUserRequests(ctx context.Context, userId string) ([]*domain.Request, error)
	ListRecipientRequests(ctx context.Context, recipientId string, recipientType domain.RequestRecipientType) ([]*domain.Request, error)
}
