package primaryports

import (
	"context"
)

type NewRequest struct{}

type ForMakingRequests interface {
	CreateRequest(context.Context, NewRequest) error
}
