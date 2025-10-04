package secondaryadapters

import (
	"context"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
)

type RequestsWriter struct{}

func (w *RequestsWriter) Save(ctx context.Context, request *domain.Request) error {
	return nil
}

type RequestsReader struct{}

func (r *RequestsReader) GetById(ctx context.Context, requestId string) (*domain.Request, error) {
	return &domain.Request{}, nil
}

func (r *RequestsReader) FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

func (r *RequestsReader) FindByAcceptedById(ctx context.Context, acceptedById string) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

func (r *RequestsReader) FindByRecipient(ctx context.Context, recipient domain.RequestRecipient) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

var _ secondaryports.ForStoringRequests = (*RequestsWriter)(nil)
var _ secondaryports.ForReadingRequests = (*RequestsReader)(nil)
