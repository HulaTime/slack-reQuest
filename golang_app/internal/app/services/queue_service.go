package services

import (
	"context"
	"fmt"
	"log/slog"

	"request/internal/app/ports/primaryports"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"

	"github.com/google/uuid"
)

type QueueService struct {
	queuesWriter secondaryports.ForStoringQueues
	queuesReader secondaryports.ForReadingQueues
}

var _ primaryports.ForManagingQueues = (*QueueService)(nil)

func NewQueueService(
	queuesWriter secondaryports.ForStoringQueues,
	queuesReader secondaryports.ForReadingQueues,
) *QueueService {
	return &QueueService{
		queuesWriter: queuesWriter,
		queuesReader: queuesReader,
	}
}

func (s *QueueService) CreateQueue(ctx context.Context, name, description, createdById string) (*domain.Queue, error) {
	if name == "" {
		return nil, fmt.Errorf("queue name is required")
	}

	if createdById == "" {
		return nil, fmt.Errorf("creator user ID is required")
	}

	queueId := uuid.New().String()
	queue := domain.NewQueue(queueId, name, createdById)
	queue.Description = description

	err := s.queuesWriter.Save(ctx, &queue)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save queue",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId),
			slog.String("name", name))
		return nil, fmt.Errorf("failed to create queue: %w", err)
	}

	slog.InfoContext(ctx, "Queue created successfully",
		slog.String("queueId", queueId),
		slog.String("name", name),
		slog.String("createdBy", createdById))

	return &queue, nil
}

func (s *QueueService) GetQueue(ctx context.Context, queueId string) (*domain.Queue, error) {
	if queueId == "" {
		return nil, fmt.Errorf("queue ID is required")
	}

	queue, err := s.queuesReader.GetById(ctx, queueId)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to get queue",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId))
		return nil, fmt.Errorf("failed to get queue: %w", err)
	}

	return queue, nil
}

func (s *QueueService) ListQueues(ctx context.Context) ([]*domain.Queue, error) {
	queues, err := s.queuesReader.FindAll(ctx)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to list queues",
			slog.String("err", err.Error()))
		return nil, fmt.Errorf("failed to list queues: %w", err)
	}

	slog.DebugContext(ctx, "Retrieved queues",
		slog.Int("count", len(queues)))

	return queues, nil
}

func (s *QueueService) UpdateQueue(ctx context.Context, queue *domain.Queue) error {
	if queue == nil {
		return fmt.Errorf("queue cannot be nil")
	}

	if queue.ID == "" {
		return fmt.Errorf("queue ID is required")
	}

	existingQueue, err := s.queuesReader.GetById(ctx, queue.ID)
	if err != nil {
		return fmt.Errorf("queue not found: %w", err)
	}

	if existingQueue == nil {
		return fmt.Errorf("queue not found: %s", queue.ID)
	}

	err = s.queuesWriter.Save(ctx, queue)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to update queue",
			slog.String("err", err.Error()),
			slog.String("queueId", queue.ID))
		return fmt.Errorf("failed to update queue: %w", err)
	}

	slog.InfoContext(ctx, "Queue updated successfully",
		slog.String("queueId", queue.ID),
		slog.String("name", queue.Name))

	return nil
}

func (s *QueueService) DeleteQueue(ctx context.Context, queueId string) error {
	if queueId == "" {
		return fmt.Errorf("queue ID is required")
	}

	queue, err := s.queuesReader.GetById(ctx, queueId)
	if err != nil {
		return fmt.Errorf("queue not found: %w", err)
	}

	if queue == nil {
		return fmt.Errorf("queue not found: %s", queueId)
	}

	slog.WarnContext(ctx, "Queue deletion not implemented - requires cascading delete logic",
		slog.String("queueId", queueId))

	return fmt.Errorf("queue deletion not yet implemented")
}

func (s *QueueService) AddQueueAdmin(ctx context.Context, queueId, userId, requestingUserId string) error {
	if queueId == "" {
		return fmt.Errorf("queue ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	if requestingUserId == "" {
		return fmt.Errorf("requesting user ID is required")
	}

	queue, err := s.queuesReader.GetById(ctx, queueId)
	if err != nil {
		return fmt.Errorf("queue not found: %w", err)
	}

	if !queue.CanBeModifiedBy(requestingUserId) {
		slog.WarnContext(ctx, "Unauthorized attempt to add queue admin",
			slog.String("queueId", queueId),
			slog.String("requestingUserId", requestingUserId))
		return fmt.Errorf("user is not authorized to modify this queue")
	}

	err = queue.AddAdmin(userId)
	if err != nil {
		return fmt.Errorf("failed to add admin: %w", err)
	}

	err = s.queuesWriter.Save(ctx, queue)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save queue after adding admin",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId),
			slog.String("userId", userId))
		return fmt.Errorf("failed to save queue: %w", err)
	}

	slog.InfoContext(ctx, "Admin added to queue",
		slog.String("queueId", queueId),
		slog.String("userId", userId),
		slog.String("addedBy", requestingUserId))

	return nil
}

func (s *QueueService) RemoveQueueAdmin(ctx context.Context, queueId, userId, requestingUserId string) error {
	if queueId == "" {
		return fmt.Errorf("queue ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	if requestingUserId == "" {
		return fmt.Errorf("requesting user ID is required")
	}

	queue, err := s.queuesReader.GetById(ctx, queueId)
	if err != nil {
		return fmt.Errorf("queue not found: %w", err)
	}

	if !queue.CanBeModifiedBy(requestingUserId) {
		slog.WarnContext(ctx, "Unauthorized attempt to remove queue admin",
			slog.String("queueId", queueId),
			slog.String("requestingUserId", requestingUserId))
		return fmt.Errorf("user is not authorized to modify this queue")
	}

	err = queue.RemoveAdmin(userId)
	if err != nil {
		return fmt.Errorf("failed to remove admin: %w", err)
	}

	err = s.queuesWriter.Save(ctx, queue)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save queue after removing admin",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId),
			slog.String("userId", userId))
		return fmt.Errorf("failed to save queue: %w", err)
	}

	slog.InfoContext(ctx, "Admin removed from queue",
		slog.String("queueId", queueId),
		slog.String("userId", userId),
		slog.String("removedBy", requestingUserId))

	return nil
}

func (s *QueueService) AddQueueMember(ctx context.Context, queueId, userId, requestingUserId string) error {
	if queueId == "" {
		return fmt.Errorf("queue ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	if requestingUserId == "" {
		return fmt.Errorf("requesting user ID is required")
	}

	queue, err := s.queuesReader.GetById(ctx, queueId)
	if err != nil {
		return fmt.Errorf("queue not found: %w", err)
	}

	if !queue.CanBeModifiedBy(requestingUserId) {
		slog.WarnContext(ctx, "Unauthorized attempt to add queue member",
			slog.String("queueId", queueId),
			slog.String("requestingUserId", requestingUserId))
		return fmt.Errorf("user is not authorized to modify this queue")
	}

	err = queue.AddMember(userId)
	if err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}

	err = s.queuesWriter.Save(ctx, queue)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save queue after adding member",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId),
			slog.String("userId", userId))
		return fmt.Errorf("failed to save queue: %w", err)
	}

	slog.InfoContext(ctx, "Member added to queue",
		slog.String("queueId", queueId),
		slog.String("userId", userId),
		slog.String("addedBy", requestingUserId))

	return nil
}

func (s *QueueService) RemoveQueueMember(ctx context.Context, queueId, userId, requestingUserId string) error {
	if queueId == "" {
		return fmt.Errorf("queue ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	if requestingUserId == "" {
		return fmt.Errorf("requesting user ID is required")
	}

	queue, err := s.queuesReader.GetById(ctx, queueId)
	if err != nil {
		return fmt.Errorf("queue not found: %w", err)
	}

	if !queue.CanBeModifiedBy(requestingUserId) {
		slog.WarnContext(ctx, "Unauthorized attempt to remove queue member",
			slog.String("queueId", queueId),
			slog.String("requestingUserId", requestingUserId))
		return fmt.Errorf("user is not authorized to modify this queue")
	}

	err = queue.RemoveMember(userId)
	if err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}

	err = s.queuesWriter.Save(ctx, queue)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save queue after removing member",
			slog.String("err", err.Error()),
			slog.String("queueId", queueId),
			slog.String("userId", userId))
		return fmt.Errorf("failed to save queue: %w", err)
	}

	slog.InfoContext(ctx, "Member removed from queue",
		slog.String("queueId", queueId),
		slog.String("userId", userId),
		slog.String("removedBy", requestingUserId))

	return nil
}
