package primaryports

import "context"

type ForHandlingCommands interface {
	RespondToNewQueueCmd(ctx context.Context) error
	RespondToNewRequestCmd(ctx context.Context) error
}
