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

func (r *SlackViewRenderer) UpdateRequestFormWithRecipient(ctx context.Context, viewID string, recipientType domain.RequestRecipientType) error {
	options := []secondaryports.RecipientTypeOption{
		{Value: string(domain.RequestRecipientUser), Label: "User"},
		{Value: "channel", Label: "Channel"},
		{Value: string(domain.RequestRecipientQueue), Label: "Queue"},
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

func (r *SlackViewRenderer) buildRequestFormBlocks(selectedRecipientType domain.RequestRecipientType, recipientTypeOptions []secondaryports.RecipientTypeOption) slack.Blocks {
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

	builder := NewBlockBuilder()
	if selectedRecipientType == "user" {
		blocks = append(blocks, builder.UserSelect(BlockIDUserSelect, "Select a user", "Choose user", ActionIDUserSelect))
	} else if selectedRecipientType == "channel" {
		blocks = append(blocks, builder.ChannelSelect(BlockIDChannelSelect, "Select a channel", "Choose channel", ActionIDChannelSelect))
	} else if selectedRecipientType == "queue" {
		slog.Error("Not implemented")
	}

	if selectedRecipientType != "" {
		blocks = append(blocks,
			builder.TextInput(BlockIDRequestTitle, "Title", "Enter request title", false, ActionIDRequestTitle),
			builder.TextInput(BlockIDRequestDescription, "Description", "Enter request description", true, ActionIDRequestDescription),
		)
	}

	return slack.Blocks{BlockSet: blocks}
}

func (r *SlackViewRenderer) RenderQueueForm(ctx context.Context, triggerId string, view secondaryports.QueueFormView) error {
	builder := NewBlockBuilder()

	channelSelectBlock := builder.ChannelSelect(BlockIDQueueChannel, "Choose a channel to create the queue in...", "Choose channel", ActionIDQueueChannelSelect)
	queueTitleBlock := builder.TextInput(BlockIDQueueName, "Title", "Enter queue title...", false, ActionIDQueueName)
	descriptionBlock := builder.TextInput(BlockIDQueueDescription, "Description", "Enter queue description...", true, ActionIDQueueDescription)
	queueAdminsBlock := builder.MultiUserSelect(BlockIDQueueAdmins, "Select queue admins", "Select users to manage queue...", ActionIDQueueAdminsSelect)

	modalRequest := newModalViewRequest(CallbackIDQueueForm, "Create New Queue", true)
	modalRequest.Blocks.BlockSet = append(modalRequest.Blocks.BlockSet, []slack.Block{channelSelectBlock, queueTitleBlock, descriptionBlock, queueAdminsBlock}...)

	_, err := r.client.OpenView(triggerId, *modalRequest)
	if err != nil {
		fmt.Println("err", err)
		return fmt.Errorf("failed to open queue modal: %w", err)
	}

	return nil
}

func (r *SlackViewRenderer) UpdateRequestForm(ctx context.Context, viewId string, recipientType domain.RequestRecipientType) error {
	return r.UpdateRequestFormWithRecipient(ctx, viewId, recipientType)
}

func (r *SlackViewRenderer) RenderQueueSelector(ctx context.Context, triggerId string, queues []*domain.Queue) error {
	return fmt.Errorf("not implemented: RenderQueueSelector")
}

func (r *SlackViewRenderer) RenderRequestList(ctx context.Context, viewId string, requests []*domain.Request) error {
	return fmt.Errorf("not implemented: RenderRequestList")
}

func (r *SlackViewRenderer) RenderRequestDetail(ctx context.Context, triggerId string, request *domain.Request, userPermissions secondaryports.Permissions) error {
	return fmt.Errorf("not implemented: RenderRequestDetail")
}

var _ secondaryports.ForRenderingModals = (*SlackViewRenderer)(nil)
