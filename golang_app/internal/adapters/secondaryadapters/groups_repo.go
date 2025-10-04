package secondaryadapters

import (
	"context"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
)

type GroupsWriter struct{}

func (w *GroupsWriter) Save(ctx context.Context, request *domain.Request) error {
	return nil
}

type GroupsReader struct{}

func (r *GroupsReader) GetById(ctx context.Context, requestId string) (*domain.Request, error) {
	return &domain.Request{}, nil
}

func (r *GroupsReader) FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

func (r *GroupsReader) FindByAcceptedById(ctx context.Context, acceptedById string) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

func (r *GroupsReader) FindByRecipient(ctx context.Context, recipient domain.RequestRecipient) ([]*domain.Request, error) {
	return []*domain.Request{}, nil
}

var _ secondaryports.ForStoringRequests = (*GroupsWriter)(nil)
var _ secondaryports.ForReadingRequests = (*GroupsReader)(nil)
