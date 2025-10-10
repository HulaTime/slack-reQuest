package primaryports

import (
	"context"
	"request/internal/domain"
)

type ForHandlingRequests interface {
	SendRequestForm(context.Context, *domain.Request) error
}
