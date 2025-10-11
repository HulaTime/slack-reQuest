package services

import (
	"context"
	"log/slog"
	"request/internal/app/ports/primaryports"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
)

type RequestService struct {
	viewRenderer  secondaryports.ForRenderingViews
	requestWriter secondaryports.ForStoringRequests
}

var _ primaryports.ForHandlingRequests = (*RequestService)(nil)

func NewRequestService(viewRenderer secondaryports.ForRenderingViews, requestWriter secondaryports.ForStoringRequests) *RequestService {
	return &RequestService{
		viewRenderer:  viewRenderer,
		requestWriter: requestWriter,
	}
}

func (s *RequestService) OpenNewRequestForm(ctx context.Context, triggerId string) error {
	view := secondaryports.RequestFormView{
		RecipientTypeOptions: []secondaryports.RecipientTypeOption{
			{Value: "user", Label: "User"},
			{Value: "channel", Label: "Channel"},
			{Value: "queue", Label: "Queue"},
		},
	}

	return s.viewRenderer.RenderRequestForm(ctx, triggerId, view)
}

func (s *RequestService) CreateRequest(ctx context.Context, r *domain.Request) error {
	err := s.requestWriter.Save(ctx, r)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save a request", slog.String("err", err.Error()))
		return err
	}

	return nil
}

func (s *RequestService) UpdateRequest(ctx context.Context, r *domain.Request) error {
	return nil
}

func (s *RequestService) DeleteRequest(ctx context.Context, requestId string) error {
	return nil
}
