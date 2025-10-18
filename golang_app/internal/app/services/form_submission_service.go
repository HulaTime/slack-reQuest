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

type FormSubmissionService struct {
	requestsWriter secondaryports.ForStoringRequests
	queuesWriter   secondaryports.ForStoringQueues
	messenger      secondaryports.ForMessagingUsers
	msgRenderer    secondaryports.ForRenderingMessages
}

var _ primaryports.ForHandlingFormSubmissions = (*FormSubmissionService)(nil)

func NewFormSubmissionService(
	requestsWriter secondaryports.ForStoringRequests,
	queuesWriter secondaryports.ForStoringQueues,
	messenger secondaryports.ForMessagingUsers,
	msgRenderer secondaryports.ForRenderingMessages,
) *FormSubmissionService {
	return &FormSubmissionService{
		requestsWriter: requestsWriter,
		queuesWriter:   queuesWriter,
		messenger:      messenger,
		msgRenderer:    msgRenderer,
	}
}

func (s *FormSubmissionService) HandleRequestFormSubmission(
	ctx context.Context,
	formData primaryports.RequestFormData,
) error {
	if formData.Title == "" {
		return fmt.Errorf("request title is required")
	}

	if formData.RecipientID == "" {
		return fmt.Errorf("recipient is required")
	}

	if !formData.RecipientType.Valid() {
		return fmt.Errorf("invalid recipient type")
	}

	recipient := &domain.RequestRecipient{
		ID:   formData.RecipientID,
		Type: formData.RecipientType,
	}

	request, err := domain.NewRequest(
		uuid.New().String(),
		formData.Title,
		formData.CreatedByID,
		recipient,
	)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	request.Description = formData.Description

	if err := s.requestsWriter.Save(ctx, &request); err != nil {
		slog.ErrorContext(ctx, "Failed to save request",
			slog.String("err", err.Error()),
			slog.String("requestId", request.ID))
		return fmt.Errorf("failed to save request: %w", err)
	}

	slog.InfoContext(ctx, "Request created",
		slog.String("requestId", request.ID),
		slog.String("createdBy", request.CreatedByID),
		slog.String("recipientType", string(request.Recipient.Type)),
		slog.String("recipientId", request.Recipient.ID))

	if err := s.sendNotification(ctx, &request); err != nil {
		slog.ErrorContext(ctx, "Failed to send notification",
			slog.String("err", err.Error()),
			slog.String("requestId", request.ID))
	}

	return nil
}

func (s *FormSubmissionService) HandleQueueFormSubmission(
	ctx context.Context,
	formData primaryports.QueueFormData,
) error {
	if formData.Name == "" {
		return fmt.Errorf("queue name is required")
	}

	if formData.ChannelId == "" {
		return fmt.Errorf("queue channel is required")
	}

	if formData.CreatedById == "" {
		return fmt.Errorf("creator ID is required")
	}

	queue := domain.NewQueue(
		uuid.New().String(),
		formData.Name,
		formData.CreatedById,
	)

	queue.ChannelId = formData.ChannelId
	queue.Description = formData.Description

	for _, adminId := range formData.AdminIds {
		if adminId != formData.CreatedById {
			if err := queue.AddAdmin(adminId); err != nil {
				slog.WarnContext(ctx, "Failed to add admin to queue",
					slog.String("err", err.Error()),
					slog.String("adminId", adminId))
			}
		}
	}

	if err := s.queuesWriter.Save(ctx, &queue); err != nil {
		slog.ErrorContext(ctx, "Failed to save queue",
			slog.String("err", err.Error()),
			slog.String("queueId", queue.ID))
		return fmt.Errorf("failed to save queue: %w", err)
	}

	slog.InfoContext(ctx, "Queue created",
		slog.String("queueId", queue.ID),
		slog.String("createdBy", queue.CreatedById),
		slog.String("channelId", queue.ChannelId),
		slog.Int("adminCount", len(queue.AdminIds)))

	return nil
}

func (s *FormSubmissionService) sendNotification(ctx context.Context, request *domain.Request) error {
	var channelId string

	switch request.Recipient.Type {
	case domain.RequestRecipientUser:
		channel, _, err := s.messenger.SendDirectMessage(ctx, request.Recipient.ID, "")
		if err != nil {
			return fmt.Errorf("failed to open DM channel: %w", err)
		}
		channelId = channel

	case domain.RequestRecipientChannel, domain.RequestRecipientQueue:
		channelId = request.Recipient.ID

	default:
		return fmt.Errorf("unknown recipient type: %s", request.Recipient.Type)
	}

	_, err := s.msgRenderer.RenderRequestNotification(ctx, channelId, request)
	if err != nil {
		return fmt.Errorf("failed to render notification: %w", err)
	}

	return nil
}
