package secondaryports

import (
	"context"
	"request/internal/domain"
)

type ForStoringQueues interface {
	Save(ctx context.Context, request *domain.Queue) error
}

type ForReadingQueues interface {
	GetById(ctx context.Context, requestId string) (*domain.Queue, error)
	FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Queue, error)
	FindAll(ctx context.Context) ([]*domain.Queue, error)
}
