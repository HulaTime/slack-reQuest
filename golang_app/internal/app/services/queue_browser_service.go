package services

import (
	"context"
	"fmt"
	"log/slog"

	"request/internal/app/ports/primaryports"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
)

type QueueBrowserService struct {
	queuesReader   secondaryports.ForReadingQueues
	requestsReader secondaryports.ForReadingRequests
}

var _ primaryports.ForBrowsingQueues = (*QueueBrowserService)(nil)

func NewQueueBrowserService(
	queuesReader secondaryports.ForReadingQueues,
	requestsReader secondaryports.ForReadingRequests,
) *QueueBrowserService {
	return &QueueBrowserService{
		queuesReader:   queuesReader,
		requestsReader: requestsReader,
	}
}

func (s *QueueBrowserService) ListQueuesByChannel(
	ctx context.Context,
	channelId string,
) ([]*domain.Queue, error) {
	if channelId == "" {
		return nil, fmt.Errorf("channel ID is required")
	}

	queues, err := s.queuesReader.FindByChannelId(ctx, channelId)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to list queues by channel",
			slog.String("err", err.Error()),
			slog.String("channelId", channelId))
		return nil, fmt.Errorf("failed to list queues: %w", err)
	}

	slog.DebugContext(ctx, "Retrieved queues by channel",
		slog.String("channelId", channelId),
		slog.Int("count", len(queues)))

	return queues, nil
}

func (s *QueueBrowserService) GetQueueRequests(
	ctx context.Context,
	queueId string,
	statuses []domain.RequestStatus,
) ([]*domain.Request, error) {
	if queueId == "" {
		return nil, fmt.Errorf("queue ID is required")
	}

	requests, err := s.requestsReader.FindByRecipientAndStatuses(
		ctx,
		queueId,
		domain.RequestRecipientQueue,
		statuses,
	)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to get queue requests",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId))
		return nil, fmt.Errorf("failed to get requests: %w", err)
	}

	slog.DebugContext(ctx, "Retrieved queue requests",
		slog.String("queueId", queueId),
		slog.Int("statusCount", len(statuses)),
		slog.Int("count", len(requests)))

	return requests, nil
}
