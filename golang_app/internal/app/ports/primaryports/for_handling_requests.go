package primaryports

import (
	"context"
	"request/internal/domain"
)

type ForHandlingRequests interface {
	OpenNewRequestForm(ctx context.Context, triggerId string) error
	CreateRequest(ctx context.Context, request *domain.Request) error
	UpdateRequest(ctx context.Context, request *domain.Request) error
	DeleteRequest(ctx context.Context, requestId string) error
}
