package secondaryports

import "context"

type MessageRecipient struct {
	UserID    string
	ChannelID string
}

type ForMessagingUsers interface {
	SendDirectMessage(ctx context.Context, userId, message string) (channelId, messageTs string, error error)
	SendChannelMessage(ctx context.Context, channelId, message string) (messageTs string, error error)
	SendEphemeralMessage(ctx context.Context, channelId, userId, message string) error
}
