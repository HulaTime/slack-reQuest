package primaryports

import (
	"context"
	"request/internal/domain"
)

type ForMakingRequests interface {
	RespondToNewRequest(context.Context, *domain.Request) error
}
