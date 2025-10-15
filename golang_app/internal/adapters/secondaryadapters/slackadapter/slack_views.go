package slackadapter

import (
	"context"
	"fmt"
	"log/slog"
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

type RequestRecipientType string

const (
	USER_REQUEST_RECIPIENT  RequestRecipientType = "user"
	QUEUE_REQUEST_RECIPIENT RequestRecipientType = "queue"
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
	modalRequest := newModalViewRequest(CallbackIDRequestForm, "Create New Request", false)
	modalRequest.Blocks.BlockSet = append(modalRequest.Blocks.BlockSet, blocks.BlockSet...)

	_, err := r.client.OpenView(triggerId, *modalRequest)
	if err != nil {
		return fmt.Errorf("failed to open request modal: %w", err)
	}

	return nil
}

func (r *SlackViewRenderer) UpdateRequestFormWithRecipient(ctx context.Context, viewID string, recipientType RequestRecipientType) error {
	options := []secondaryports.RecipientTypeOption{
		{Value: string(USER_REQUEST_RECIPIENT), Label: "User"},
		{Value: "channel", Label: "Channel"},
		{Value: string(QUEUE_REQUEST_RECIPIENT), Label: "Queue"},
	}

	blocks := r.buildRequestFormBlocks(recipientType, options)

	modalRequest := newModalViewRequest(CallbackIDRequestForm, "Create New Request", recipientType != "")
	modalRequest.Blocks.BlockSet = append(modalRequest.Blocks.BlockSet, blocks.BlockSet...)

	_, err := r.client.UpdateView(*modalRequest, "", "", viewID)
	if err != nil {
		return fmt.Errorf("failed to update request modal: %w", err)
	}

	return nil
}

func (r *SlackViewRenderer) buildRequestFormBlocks(selectedRecipientType RequestRecipientType, recipientTypeOptions []secondaryports.RecipientTypeOption) slack.Blocks {
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
			if opt.Value == string(selectedRecipientType) {
				recipientTypeSelect.InitialOption = opt
				break
			}
		}
	}

	blocks = append(blocks, slack.NewActionBlock(BlockIDRecipientTypeAction, recipientTypeSelect))

	if selectedRecipientType == "user" {
		blocks = append(blocks, newSelectUserBlock(BlockIDUserSelect, ActionIDUserSelect))
	} else if selectedRecipientType == "channel" {
		blocks = append(blocks, newSelectChannelBlock("Select a channel", BlockIDChannelSelect, ActionIDChannelSelect))
	} else if selectedRecipientType == "queue" {
		slog.Error("Not implemented")
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
	channelSelectBlock := newSelectChannelBlock("Choose a channel to create the queue in...", BlockIDQueueChannel, ActionIDQueueChannelSelect)
	queueTitleBlock := newTextInputBlock("Title", "Enter queue title...", BlockIDQueueName, ActionIDQueueName)
	descriptionBlock := newMultilineTextInputBlock("Description", "Enter queue description...", BlockIDQueueDescription, ActionIDQueueDescription)
	queueAdminsBlock := newMultiUserSelectBlock("Select queue admins", "Select users to manage queue...", BlockIDQueueAdmins, ActionIDQueueAdminsSelect)

	modalRequest := newModalViewRequest(CallbackIDQueueForm, "Create New Queue", true)
	modalRequest.Blocks.BlockSet = append(modalRequest.Blocks.BlockSet, []slack.Block{channelSelectBlock, queueTitleBlock, descriptionBlock, queueAdminsBlock}...)

	_, err := r.client.OpenView(triggerId, *modalRequest)
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
