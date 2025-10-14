package primaryports

import (
	"context"
	"request/internal/domain"
)

type ForManagingQueues interface {
	CreateQueue(ctx context.Context, name, description, createdById string) (*domain.Queue, error)
	GetQueue(ctx context.Context, queueId string) (*domain.Queue, error)
	ListQueues(ctx context.Context) ([]*domain.Queue, error)
	UpdateQueue(ctx context.Context, queue *domain.Queue) error
	DeleteQueue(ctx context.Context, queueId string) error
	AddQueueAdmin(ctx context.Context, queueId, userId, requestingUserId string) error
	RemoveQueueAdmin(ctx context.Context, queueId, userId, requestingUserId string) error
	AddQueueMember(ctx context.Context, queueId, userId, requestingUserId string) error
	RemoveQueueMember(ctx context.Context, queueId, userId, requestingUserId string) error
}
