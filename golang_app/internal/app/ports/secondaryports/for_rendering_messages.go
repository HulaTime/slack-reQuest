package secondaryports

import (
	"context"

	"request/internal/domain"
)

type ForRenderingMessages interface {
	RenderRequestNotification(ctx context.Context, channelId string, request *domain.Request) (messageTs string, error error)
	UpdateRequestNotification(ctx context.Context, channelId string, messageTs string, request *domain.Request) error
}
