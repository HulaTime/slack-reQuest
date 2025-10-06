package secondaryports

import (
	"context"
	"request/internal/domain"
)

type ForStoringRequests interface {
	Save(ctx context.Context, request *domain.Request) error
}

type ForReadingRequests interface {
	GetById(ctx context.Context, requestId string) (*domain.Request, error)
	FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Request, error)
	FindByAcceptedById(ctx context.Context, acceptedById string) ([]*domain.Request, error)
	FindByRecipient(ctx context.Context, recipient domain.RequestRecipient) ([]*domain.Request, error)
}
