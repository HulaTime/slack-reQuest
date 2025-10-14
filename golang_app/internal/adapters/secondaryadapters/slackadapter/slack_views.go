package slackadapter

import (
	"context"
	"fmt"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"

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
	blocks := r.buildRequestFormBlocks("", view.RecipientTypeOptions)

	modalRequest := slack.ModalViewRequest{
		Type:       slack.VTModal,
		CallbackID: CallbackIDRequestForm,
		Title: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Create New Request",
		},
		Close: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Cancel",
		},
		Blocks: blocks,
	}

	_, err := r.client.OpenView(triggerId, modalRequest)
	if err != nil {
		return fmt.Errorf("failed to open request modal: %w", err)
	}

	return nil
}

func (r *SlackViewRenderer) UpdateRequestFormWithRecipient(ctx context.Context, viewID, recipientType string) error {
	options := []secondaryports.RecipientTypeOption{
		{Value: "user", Label: "User"},
		{Value: "channel", Label: "Channel"},
		{Value: "queue", Label: "Queue"},
	}

	blocks := r.buildRequestFormBlocks(recipientType, options)

	submitEnabled := recipientType != ""
	var submit *slack.TextBlockObject
	if submitEnabled {
		submit = &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Submit",
		}
	}

	modalRequest := slack.ModalViewRequest{
		Type:       slack.VTModal,
		CallbackID: CallbackIDRequestForm,
		Title: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Create New Request",
		},
		Close: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Cancel",
		},
		Submit: submit,
		Blocks: blocks,
	}

	_, err := r.client.UpdateView(modalRequest, "", "", viewID)
	if err != nil {
		return fmt.Errorf("failed to update request modal: %w", err)
	}

	return nil
}

func (r *SlackViewRenderer) buildRequestFormBlocks(selectedRecipientType string, recipientTypeOptions []secondaryports.RecipientTypeOption) slack.Blocks {
	blocks := []slack.Block{}

	blocks = append(blocks, slack.NewSectionBlock(
		slack.NewTextBlockObject("plain_text", "Select the type of recipient for your request", false, false),
		nil,
		nil,
	))

	options := make([]*slack.OptionBlockObject, len(recipientTypeOptions))
	for i, opt := range recipientTypeOptions {
		options[i] = slack.NewOptionBlockObject(
			opt.Value,
			slack.NewTextBlockObject(slack.PlainTextType, opt.Label, NO_EMOJI, NOT_VERBATIM),
			nil,
		)
	}

	placeholder := slack.NewTextBlockObject(slack.PlainTextType, "Select recipient type", NO_EMOJI, NOT_VERBATIM)
	recipientTypeSelect := slack.NewOptionsSelectBlockElement(slack.OptTypeStatic, placeholder, ActionIDRecipientTypeSelect, options...)

	if selectedRecipientType != "" {
		for _, opt := range options {
			if opt.Value == selectedRecipientType {
				recipientTypeSelect.InitialOption = opt
				break
			}
		}
	}

	blocks = append(blocks, slack.NewActionBlock(BlockIDRecipientTypeAction, recipientTypeSelect))

	if selectedRecipientType == "user" {
		userSelect := slack.NewOptionsSelectBlockElement(
			slack.OptTypeUser,
			slack.NewTextBlockObject(slack.PlainTextType, "Choose a user", NO_EMOJI, NOT_VERBATIM),
			ActionIDUserSelect,
		)
		blocks = append(blocks, slack.NewInputBlock(
			BlockIDUserSelect,
			slack.NewTextBlockObject(slack.PlainTextType, "Select User", NO_EMOJI, NOT_VERBATIM),
			nil,
			userSelect,
		))
	} else if selectedRecipientType == "channel" {
		channelSelect := slack.NewOptionsSelectBlockElement(
			slack.OptTypeChannels,
			slack.NewTextBlockObject(slack.PlainTextType, "Choose a channel", NO_EMOJI, NOT_VERBATIM),
			ActionIDChannelSelect,
		)
		blocks = append(blocks, slack.NewInputBlock(
			BlockIDChannelSelect,
			slack.NewTextBlockObject(slack.PlainTextType, "Select Channel", NO_EMOJI, NOT_VERBATIM),
			nil,
			channelSelect,
		))
	} else if selectedRecipientType == "queue" {
		blocks = append(blocks, slack.NewInputBlock(
			BlockIDQueueSelect,
			slack.NewTextBlockObject(slack.PlainTextType, "Select Queue", NO_EMOJI, NOT_VERBATIM),
			nil,
			slack.NewOptionsSelectBlockElement(
				slack.OptTypeStatic,
				slack.NewTextBlockObject(slack.PlainTextType, "Choose a queue", NO_EMOJI, NOT_VERBATIM),
				ActionIDQueueSelect,
			),
		))
	}

	if selectedRecipientType != "" {
		blocks = append(blocks, slack.NewInputBlock(
			BlockIDRequestTitle,
			slack.NewTextBlockObject(slack.PlainTextType, "Title", NO_EMOJI, NOT_VERBATIM),
			nil,
			slack.NewPlainTextInputBlockElement(
				slack.NewTextBlockObject(slack.PlainTextType, "Enter request title", NO_EMOJI, NOT_VERBATIM),
				ActionIDRequestTitle,
			),
		))

		descriptionInput := slack.NewPlainTextInputBlockElement(
			slack.NewTextBlockObject(slack.PlainTextType, "Enter request description", NO_EMOJI, NOT_VERBATIM),
			ActionIDRequestDescription,
		)
		descriptionInput.Multiline = true

		blocks = append(blocks, slack.NewInputBlock(
			BlockIDRequestDescription,
			slack.NewTextBlockObject(slack.PlainTextType, "Description", NO_EMOJI, NOT_VERBATIM),
			nil,
			descriptionInput,
		))
	}

	return slack.Blocks{BlockSet: blocks}
}

func (r *SlackViewRenderer) RenderQueueForm(ctx context.Context, triggerId string, view secondaryports.QueueFormView) error {
	blocks := []slack.Block{}

	channelSelectElement := slack.NewOptionsSelectBlockElement(
		slack.OptTypeChannels,
		slack.NewTextBlockObject(slack.PlainTextType, "Choose channel", NO_EMOJI, NOT_VERBATIM),
		ActionIDQueueChannelSelect,
	)
	channelSelectBlock := slack.NewInputBlock(
		BlockIDQueueChannel,
		slack.NewTextBlockObject(slack.PlainTextType, "Choose a channel to create the queue in...", NO_EMOJI, NOT_VERBATIM),
		nil,
		channelSelectElement,
	)

	queueTitleBlock := slack.NewInputBlock(
		BlockIDQueueName,
		slack.NewTextBlockObject(slack.PlainTextType, "Title", NO_EMOJI, NOT_VERBATIM),
		nil,
		slack.NewPlainTextInputBlockElement(
			slack.NewTextBlockObject(slack.PlainTextType, "Enter queue title", NO_EMOJI, NOT_VERBATIM),
			ActionIDQueueName,
		),
	)

	descriptionInput := slack.NewPlainTextInputBlockElement(
		slack.NewTextBlockObject(slack.PlainTextType, "Enter queue description", NO_EMOJI, NOT_VERBATIM),
		ActionIDQueueDescription,
	)
	descriptionInput.Multiline = true

	descriptionBlock := slack.NewInputBlock(
		BlockIDQueueDescription,
		slack.NewTextBlockObject(slack.PlainTextType, "Description", NO_EMOJI, NOT_VERBATIM),
		nil,
		descriptionInput,
	)

	queueAdminsSelect := slack.NewOptionsMultiSelectBlockElement(
		slack.MultiOptTypeUser,
		slack.NewTextBlockObject(slack.PlainTextType, "Select queue admins", NO_EMOJI, NOT_VERBATIM),
		ActionIDQueueAdminsSelect,
	)
	queueAdminsBlock := slack.NewInputBlock(
		BlockIDQueueAdmins,
		slack.NewTextBlockObject(slack.PlainTextType, "Queue Admins", NO_EMOJI, NOT_VERBATIM),
		slack.NewTextBlockObject(slack.PlainTextType, "Select users who can manage this queue and accept requests", NO_EMOJI, NOT_VERBATIM),
		queueAdminsSelect,
	)

	blocks = append(blocks, channelSelectBlock, queueTitleBlock, descriptionBlock, queueAdminsBlock)

	modalRequest := slack.ModalViewRequest{
		Type:       slack.VTModal,
		CallbackID: CallbackIDQueueForm,
		Title: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Create New Queue",
		},
		Close: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Cancel",
		},
		Blocks: slack.Blocks{BlockSet: blocks},
		Submit: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Submit",
		},
	}

	_, err := r.client.OpenView(triggerId, modalRequest)
	if err != nil {
		fmt.Println("err", err)
		return fmt.Errorf("failed to open request modal: %w", err)
	}

	return nil
}

func (r *SlackViewRenderer) RenderRequestNotification(ctx context.Context, userId string, request *domain.Request) (messageTs string, channelId string, error error) {
	return "", "", fmt.Errorf("not implemented")
}

func (r *SlackViewRenderer) UpdateRequestNotification(ctx context.Context, channelId, messageTs string, request *domain.Request) error {
	return fmt.Errorf("not implemented")
}

var _ secondaryports.ForRenderingViews = (*SlackViewRenderer)(nil)
