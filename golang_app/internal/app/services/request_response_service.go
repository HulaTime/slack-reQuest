package services

import (
	"context"
	"fmt"
	"log/slog"

	"request/internal/app/ports/primaryports"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
)

type RequestResponseService struct {
	requestsWriter secondaryports.ForStoringRequests
	requestsReader secondaryports.ForReadingRequests
	queuesReader   secondaryports.ForReadingQueues
	messenger      secondaryports.ForMessagingUsers
}

var _ primaryports.ForRespondingToRequests = (*RequestResponseService)(nil)

func NewRequestResponseService(
	requestsWriter secondaryports.ForStoringRequests,
	requestsReader secondaryports.ForReadingRequests,
	queuesReader secondaryports.ForReadingQueues,
	messenger secondaryports.ForMessagingUsers,
) *RequestResponseService {
	return &RequestResponseService{
		requestsWriter: requestsWriter,
		requestsReader: requestsReader,
		queuesReader:   queuesReader,
		messenger:      messenger,
	}
}

func (s *RequestResponseService) AcceptRequest(ctx context.Context, requestId, userId string) error {
	if requestId == "" {
		return fmt.Errorf("request ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	request, err := s.requestsReader.GetById(ctx, requestId)
	if err != nil {
		return fmt.Errorf("request not found: %w", err)
	}

	canRespond, err := s.canUserRespondToRequest(ctx, request, userId)
	if err != nil {
		return fmt.Errorf("failed to check authorization: %w", err)
	}

	if !canRespond {
		slog.WarnContext(ctx, "Unauthorized attempt to accept request",
			slog.String("requestId", requestId),
			slog.String("userId", userId),
			slog.String("recipientType", string(request.Recipient.Type)),
			slog.String("recipientId", request.Recipient.ID))
		return fmt.Errorf("user is not authorized to respond to this request")
	}

	err = request.Accept(userId)
	if err != nil {
		return fmt.Errorf("failed to accept request: %w", err)
	}

	err = s.requestsWriter.Save(ctx, request)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save accepted request",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
		return fmt.Errorf("failed to save request: %w", err)
	}

	slog.InfoContext(ctx, "Request accepted",
		slog.String("requestId", requestId),
		slog.String("acceptedBy", userId),
		slog.String("createdBy", request.CreatedByID))

	err = s.notifyRequestCreator(ctx, request, "accepted")
	if err != nil {
		slog.ErrorContext(ctx, "Failed to notify request creator",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
	}

	return nil
}

func (s *RequestResponseService) RejectRequest(ctx context.Context, requestId, userId string) error {
	if requestId == "" {
		return fmt.Errorf("request ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	request, err := s.requestsReader.GetById(ctx, requestId)
	if err != nil {
		return fmt.Errorf("request not found: %w", err)
	}

	canRespond, err := s.canUserRespondToRequest(ctx, request, userId)
	if err != nil {
		return fmt.Errorf("failed to check authorization: %w", err)
	}

	if !canRespond {
		slog.WarnContext(ctx, "Unauthorized attempt to reject request",
			slog.String("requestId", requestId),
			slog.String("userId", userId))
		return fmt.Errorf("user is not authorized to respond to this request")
	}

	err = request.Reject()
	if err != nil {
		return fmt.Errorf("failed to reject request: %w", err)
	}

	err = s.requestsWriter.Save(ctx, request)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save rejected request",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
		return fmt.Errorf("failed to save request: %w", err)
	}

	slog.InfoContext(ctx, "Request rejected",
		slog.String("requestId", requestId),
		slog.String("rejectedBy", userId),
		slog.String("createdBy", request.CreatedByID))

	err = s.notifyRequestCreator(ctx, request, "rejected")
	if err != nil {
		slog.ErrorContext(ctx, "Failed to notify request creator",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
	}

	return nil
}

func (s *RequestResponseService) CompleteRequest(ctx context.Context, requestId, userId string) error {
	if requestId == "" {
		return fmt.Errorf("request ID is required")
	}

	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	request, err := s.requestsReader.GetById(ctx, requestId)
	if err != nil {
		return fmt.Errorf("request not found: %w", err)
	}

	if !request.CanBeCompletedBy(userId) {
		slog.WarnContext(ctx, "Unauthorized attempt to complete request",
			slog.String("requestId", requestId),
			slog.String("userId", userId),
			slog.String("acceptedBy", request.AcceptedByID),
			slog.String("createdBy", request.CreatedByID))
		return fmt.Errorf("user is not authorized to complete this request")
	}

	err = request.Complete()
	if err != nil {
		return fmt.Errorf("failed to complete request: %w", err)
	}

	err = s.requestsWriter.Save(ctx, request)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to save completed request",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
		return fmt.Errorf("failed to save request: %w", err)
	}

	slog.InfoContext(ctx, "Request completed",
		slog.String("requestId", requestId),
		slog.String("completedBy", userId),
		slog.String("createdBy", request.CreatedByID),
		slog.String("acceptedBy", request.AcceptedByID))

	err = s.notifyRequestStakeholders(ctx, request, "completed", userId)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to notify stakeholders",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
	}

	return nil
}

func (s *RequestResponseService) GetRequestDetails(ctx context.Context, requestId string) (*domain.Request, error) {
	if requestId == "" {
		return nil, fmt.Errorf("request ID is required")
	}

	request, err := s.requestsReader.GetById(ctx, requestId)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to get request details",
			slog.String("err", err.Error()),
			slog.String("requestId", requestId))
		return nil, fmt.Errorf("failed to get request: %w", err)
	}

	return request, nil
}

func (s *RequestResponseService) ListUserRequests(ctx context.Context, userId string) ([]*domain.Request, error) {
	if userId == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	requests, err := s.requestsReader.FindByCreatedById(ctx, userId)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to list user requests",
			slog.String("err", err.Error()),
			slog.String("userId", userId))
		return nil, fmt.Errorf("failed to list requests: %w", err)
	}

	slog.DebugContext(ctx, "Retrieved user requests",
		slog.String("userId", userId),
		slog.Int("count", len(requests)))

	return requests, nil
}

func (s *RequestResponseService) ListRecipientRequests(ctx context.Context, recipientId string, recipientType domain.RequestRecipientType) ([]*domain.Request, error) {
	if recipientId == "" {
		return nil, fmt.Errorf("recipient ID is required")
	}

	if !recipientType.Valid() {
		return nil, fmt.Errorf("invalid recipient type")
	}

	recipient := domain.RequestRecipient{
		ID:   recipientId,
		Type: recipientType,
	}

	requests, err := s.requestsReader.FindByRecipient(ctx, recipient)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to list recipient requests",
			slog.String("err", err.Error()),
			slog.String("recipientId", recipientId),
			slog.String("recipientType", string(recipientType)))
		return nil, fmt.Errorf("failed to list requests: %w", err)
	}

	slog.DebugContext(ctx, "Retrieved recipient requests",
		slog.String("recipientId", recipientId),
		slog.String("recipientType", string(recipientType)),
		slog.Int("count", len(requests)))

	return requests, nil
}

func (s *RequestResponseService) canUserRespondToRequest(ctx context.Context, request *domain.Request, userId string) (bool, error) {
	var queueAdminIds []string
	var queueMemberIds []string

	if request.Recipient.Type == domain.RequestRecipientQueue {
		queue, err := s.queuesReader.GetById(ctx, request.Recipient.ID)
		if err != nil {
			return false, fmt.Errorf("failed to get queue: %w", err)
		}
		queueAdminIds = queue.AdminIds
		queueMemberIds = queue.MemberIds
	}

	return request.CanBeRespondedToBy(userId, queueAdminIds, queueMemberIds), nil
}

func (s *RequestResponseService) notifyRequestCreator(ctx context.Context, request *domain.Request, action string) error {
	message := fmt.Sprintf("Your request '%s' has been %s", request.Title, action)

	_, _, err := s.messenger.SendDirectMessage(ctx, request.CreatedByID, message)
	if err != nil {
		return fmt.Errorf("failed to send notification: %w", err)
	}

	return nil
}

func (s *RequestResponseService) notifyRequestStakeholders(ctx context.Context, request *domain.Request, action, actionBy string) error {
	if actionBy != request.CreatedByID {
		message := fmt.Sprintf("Your request '%s' has been %s", request.Title, action)
		_, _, err := s.messenger.SendDirectMessage(ctx, request.CreatedByID, message)
		if err != nil {
			slog.ErrorContext(ctx, "Failed to notify creator",
				slog.String("err", err.Error()),
				slog.String("userId", request.CreatedByID))
		}
	}

	if request.AcceptedByID != "" && actionBy != request.AcceptedByID {
		message := fmt.Sprintf("The request '%s' you accepted has been %s", request.Title, action)
		_, _, err := s.messenger.SendDirectMessage(ctx, request.AcceptedByID, message)
		if err != nil {
			slog.ErrorContext(ctx, "Failed to notify acceptor",
				slog.String("err", err.Error()),
				slog.String("userId", request.AcceptedByID))
		}
	}

	return nil
}
