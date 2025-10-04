package secondaryadapters

import (
	"context"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
)

type QueuesWriter struct{}

func (w *QueuesWriter) Save(ctx context.Context, request *domain.Request) error {
	return nil
}

type QueuesReader struct{}

func (r *QueuesReader) GetById(ctx context.Context, requestId string) (*domain.Request, error) {
	return &domain.Request{}, nil
}

func (r *QueuesReader) FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

func (r *QueuesReader) FindByAcceptedById(ctx context.Context, acceptedById string) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

func (r *QueuesReader) FindByRecipient(ctx context.Context, recipient domain.RequestRecipient) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

var _ secondaryports.ForStoringRequests = (*QueuesWriter)(nil)
var _ secondaryports.ForReadingRequests = (*QueuesReader)(nil)
