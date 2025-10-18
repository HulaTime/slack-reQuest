package slackadapter

import (
	"context"
	"fmt"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"

	"github.com/slack-go/slack"
)

type MessageRenderer struct {
	client *slack.Client
}

var _ secondaryports.ForRenderingMessages = (*MessageRenderer)(nil)

func NewMessageRenderer(client *slack.Client) *MessageRenderer {
	return &MessageRenderer{client: client}
}

func (r *MessageRenderer) RenderRequestNotification(
	ctx context.Context,
	channelId string,
	request *domain.Request,
) (string, error) {
	blocks := r.buildRequestNotificationBlocks(request)

	_, messageTs, err := r.client.PostMessageContext(ctx, channelId,
		slack.MsgOptionBlocks(blocks...),
	)
	if err != nil {
		return "", fmt.Errorf("failed to post request notification: %w", err)
	}

	return messageTs, nil
}

func (r *MessageRenderer) UpdateRequestNotification(
	ctx context.Context,
	channelId string,
	messageTs string,
	request *domain.Request,
) error {
	blocks := r.buildRequestNotificationBlocks(request)

	_, _, _, err := r.client.UpdateMessageContext(ctx, channelId, messageTs,
		slack.MsgOptionBlocks(blocks...),
	)
	if err != nil {
		return fmt.Errorf("failed to update request notification: %w", err)
	}

	return nil
}

func (r *MessageRenderer) buildRequestNotificationBlocks(request *domain.Request) []slack.Block {
	builder := NewBlockBuilder()

	blocks := []slack.Block{
		builder.Section(fmt.Sprintf("*%s*", request.Title)),
		builder.Section(request.Description),
		builder.Divider(),
		builder.Section(fmt.Sprintf("_Created by <@%s>_", request.CreatedByID)),
	}

	switch request.Status {
	case domain.RequestPending:
		blocks = append(blocks,
			builder.Divider(),
			builder.Actions(BlockIDRequestActions,
				builder.Button(ActionIDAcceptRequest, "Accept", request.ID, slack.StylePrimary),
				builder.Button(ActionIDRejectRequest, "Reject", request.ID, slack.StyleDanger),
			),
		)

	case domain.RequestAccepted:
		blocks = append(blocks,
			builder.Divider(),
			builder.Section(fmt.Sprintf("*Status:* Accepted by <@%s>", request.AcceptedByID)),
			builder.Actions(BlockIDRequestActions,
				builder.Button(ActionIDCompleteRequest, "Complete", request.ID, slack.StylePrimary),
				builder.Button(ActionIDRejectRequest, "Reject", request.ID, slack.StyleDanger),
			),
		)

	case domain.RequestCompleted:
		blocks = append(blocks,
			builder.Divider(),
			builder.Section(fmt.Sprintf("*Status:* ✅ Completed by <@%s>", request.AcceptedByID)),
		)

	case domain.RequestRejected:
		rejectionText := "*Status:* ❌ Rejected"
		if request.RejectionReason != "" {
			rejectionText += fmt.Sprintf("\n_Reason: %s_", request.RejectionReason)
		}
		blocks = append(blocks,
			builder.Divider(),
			builder.Section(rejectionText),
		)
	}

	return blocks
}
