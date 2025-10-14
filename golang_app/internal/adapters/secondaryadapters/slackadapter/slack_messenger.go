package slackadapter

import (
	"context"
	"fmt"
	"request/internal/app/ports/secondaryports"

	"github.com/slack-go/slack"
)

type SlackMessenger struct {
	client *slack.Client
}

func NewSlackMessenger(client *slack.Client) *SlackMessenger {
	return &SlackMessenger{
		client: client,
	}
}

func (m *SlackMessenger) SendDirectMessage(ctx context.Context, userId, message string) (channelId, messageTs string, error error) {
	// channel, timestamp, text, err := m.client.OpenConversationContext(
	channel, _, text, err := m.client.OpenConversationContext(
		ctx,
		&slack.OpenConversationParameters{
			Users: []string{userId},
		},
	)
	if err != nil {
		return "", "", fmt.Errorf("failed to open DM channel: %w", err)
	}

	_ = text

	channelId, messageTs, err = m.client.PostMessageContext(
		ctx,
		channel.ID,
		slack.MsgOptionText(message, false),
	)
	if err != nil {
		return "", "", fmt.Errorf("failed to send DM: %w", err)
	}

	return channelId, messageTs, nil
}

func (m *SlackMessenger) SendChannelMessage(ctx context.Context, channelId, message string) (messageTs string, error error) {
	_, timestamp, err := m.client.PostMessageContext(
		ctx,
		channelId,
		slack.MsgOptionText(message, false),
	)
	if err != nil {
		return "", fmt.Errorf("failed to send channel message: %w", err)
	}

	return timestamp, nil
}

func (m *SlackMessenger) SendEphemeralMessage(ctx context.Context, channelId, userId, message string) error {
	_, err := m.client.PostEphemeralContext(
		ctx,
		channelId,
		userId,
		slack.MsgOptionText(message, false),
	)
	if err != nil {
		return fmt.Errorf("failed to send ephemeral message: %w", err)
	}

	return nil
}

var _ secondaryports.ForMessagingUsers = (*SlackMessenger)(nil)
