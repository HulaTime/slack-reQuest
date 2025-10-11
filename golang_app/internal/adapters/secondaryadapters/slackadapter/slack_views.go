package slackadapter

import (
	"context"
	"fmt"
	"request/internal/app/ports/secondaryports"

	"github.com/slack-go/slack"
)

const (
	USE_EMOJI    = true
	NO_EMOJI     = false
	USE_VERBATIM = true
	NOT_VERBATIM = false
)

type SlackViewRenderer struct {
	client *slack.Client
}

func NewSlackViewRenderer(client *slack.Client) *SlackViewRenderer {
	return &SlackViewRenderer{
		client: client,
	}
}

func (r *SlackViewRenderer) RenderRequestForm(ctx context.Context, triggerId string, view secondaryports.RequestFormView) error {
	options := make([]*slack.OptionBlockObject, len(view.RecipientTypeOptions))
	for i, opt := range view.RecipientTypeOptions {
		options[i] = slack.NewOptionBlockObject(
			opt.Value,
			slack.NewTextBlockObject(slack.PlainTextType, opt.Label, NO_EMOJI, NOT_VERBATIM),
			nil,
		)
	}

	placeholder := slack.NewTextBlockObject(slack.PlainTextType, "Select recipient type", NO_EMOJI, NOT_VERBATIM)
	recipientTypeSelect := slack.NewOptionsSelectBlockElement(slack.OptTypeStatic, placeholder, ActionIDRecipientTypeSelect, options...)

	blocks := slack.Blocks{
		BlockSet: []slack.Block{
			slack.NewSectionBlock(
				slack.NewTextBlockObject("plain_text", "Select the type of recipient for your request", false, false),
				nil,
				nil,
			),
			slack.NewActionBlock(BlockIDRecipientTypeAction, recipientTypeSelect),
		},
	}

	modalRequest := slack.ModalViewRequest{
		Type: slack.VTModal,
		Title: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Create New Request",
		},
		Close: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Cancel",
		},
		Submit: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Submit",
		},
		Blocks: blocks,
	}

	_, err := r.client.OpenView(triggerId, modalRequest)
	if err != nil {
		return fmt.Errorf("failed to open request modal: %w", err)
	}

	return nil
}

var _ secondaryports.ForRenderingViews = (*SlackViewRenderer)(nil)
