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

type Permissions struct {
	CanAccept   bool
	CanReject   bool
	CanComplete bool
}

type ForRenderingModals interface {
	RenderRequestForm(ctx context.Context, triggerId string, view RequestFormView) error
	UpdateRequestForm(ctx context.Context, viewId string, recipientType domain.RequestRecipientType) error
	RenderQueueForm(ctx context.Context, triggerId string, view QueueFormView) error
	RenderQueueSelector(ctx context.Context, triggerId string, queues []*domain.Queue) error
	RenderRequestList(ctx context.Context, viewId string, requests []*domain.Request) error
	RenderRequestDetail(ctx context.Context, triggerId string, request *domain.Request, userPermissions Permissions) error
}
