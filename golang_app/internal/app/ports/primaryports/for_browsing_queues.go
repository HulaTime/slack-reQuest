package primaryports

import (
	"context"

	"request/internal/domain"
)

type ForBrowsingQueues interface {
	ListQueuesByChannel(ctx context.Context, channelId string) ([]*domain.Queue, error)
	GetQueueRequests(ctx context.Context, queueId string, statuses []domain.RequestStatus) ([]*domain.Request, error)
}
