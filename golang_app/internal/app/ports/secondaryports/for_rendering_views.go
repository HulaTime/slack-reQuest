package secondaryports

import (
	"context"
	"request/internal/domain"
)

type RequestFormView struct {
	RecipientTypeOptions []RecipientTypeOption
}

type RecipientTypeOption struct {
	Value string
	Label string
}

type QueueFormView struct {
	InitialName        string
	InitialDescription string
}

type RequestDetailsView struct {
	Request            *domain.Request
	ShowAcceptButton   bool
	ShowRejectButton   bool
	ShowCompleteButton bool
}

type ForRenderingViews interface {
	RenderRequestForm(ctx context.Context, triggerId string, view RequestFormView) error
	RenderQueueForm(ctx context.Context, triggerId string, view QueueFormView) error
	RenderRequestNotification(ctx context.Context, userId string, request *domain.Request) (messageTs string, channelId string, error error)
	UpdateRequestNotification(ctx context.Context, channelId, messageTs string, request *domain.Request) error
}
