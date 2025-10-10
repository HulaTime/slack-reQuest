package secondaryports

import "context"

type RequestFormView struct {
	RecipientTypeOptions []RecipientTypeOption
}

type RecipientTypeOption struct {
	Value string
	Label string
}

type ForRenderingViews interface {
	RenderRequestForm(ctx context.Context, triggerId string, view RequestFormView) error
}
