package services

import (
	"context"
	"request/internal/app/ports/secondaryports"
)

type RequestService struct {
	viewRenderer secondaryports.ForRenderingViews
}

func NewRequestService(viewRenderer secondaryports.ForRenderingViews) *RequestService {
	return &RequestService{
		viewRenderer: viewRenderer,
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
