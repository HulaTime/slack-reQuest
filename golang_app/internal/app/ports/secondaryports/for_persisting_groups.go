package secondaryports

import (
	"context"
	"request/internal/domain"
)

type ForStoringGroups interface {
	Save(ctx context.Context, group *domain.Group) error
}

type ForReadingGroups interface {
	GetById(ctx context.Context, requestId string) (*domain.Group, error)
	FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Group, error)
	FindAll(ctx context.Context) ([]*domain.Group, error)
}
