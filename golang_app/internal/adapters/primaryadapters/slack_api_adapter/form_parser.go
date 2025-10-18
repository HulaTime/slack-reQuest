package slackapiadapter

import (
	"fmt"
	"request/internal/app/ports/primaryports"
	"request/internal/domain"

	"github.com/slack-go/slack"
)

type FormParser struct{}

func NewFormParser() *FormParser {
	return &FormParser{}
}

func (p *FormParser) ParseRequestForm(interaction slack.InteractionCallback) (primaryports.RequestFormData, error) {
	values := interaction.View.State.Values

	recipientType := p.extractValue(values, "recipient_type_action", "recipient_type_select")
	if recipientType == "" {
		return primaryports.RequestFormData{}, fmt.Errorf("recipient type is required")
	}

	title := p.extractValue(values, "request_title_block", "request_title_input")
	if title == "" {
		return primaryports.RequestFormData{}, fmt.Errorf("title is required")
	}

	description := p.extractValue(values, "request_description_block", "request_description_input")

	var recipientId string
	switch domain.RequestRecipientType(recipientType) {
	case domain.RequestRecipientUser:
		recipientId = p.extractSelectedUser(values, "user_select_block", "user_select")
	case domain.RequestRecipientChannel:
		recipientId = p.extractSelectedChannel(values, "channel_select_block", "channel_select")
	case domain.RequestRecipientQueue:
		recipientId = p.extractValue(values, "queue_select_block", "queue_select")
	default:
		return primaryports.RequestFormData{}, fmt.Errorf("invalid recipient type: %s", recipientType)
	}

	if recipientId == "" {
		return primaryports.RequestFormData{}, fmt.Errorf("recipient is required")
	}

	return primaryports.RequestFormData{
		Title:         title,
		Description:   description,
		RecipientID:   recipientId,
		RecipientType: domain.RequestRecipientType(recipientType),
		CreatedByID:   interaction.User.ID,
	}, nil
}

func (p *FormParser) ParseQueueForm(interaction slack.InteractionCallback) (primaryports.QueueFormData, error) {
	values := interaction.View.State.Values

	name := p.extractValue(values, "queue_name_block", "queue_name_input")
	if name == "" {
		return primaryports.QueueFormData{}, fmt.Errorf("queue name is required")
	}

	description := p.extractValue(values, "queue_description_block", "queue_description_input")

	channelId := p.extractSelectedChannel(values, "queue_channel_block", "queue_channel_select")
	if channelId == "" {
		return primaryports.QueueFormData{}, fmt.Errorf("channel is required")
	}

	adminIds := p.extractSelectedUsers(values, "queue_admins_block", "queue_admins_select")

	return primaryports.QueueFormData{
		Name:        name,
		Description: description,
		AdminIds:    adminIds,
		ChannelId:   channelId,
		CreatedById: interaction.User.ID,
	}, nil
}

func (p *FormParser) extractValue(values map[string]map[string]slack.BlockAction, blockId, actionId string) string {
	if block, ok := values[blockId]; ok {
		if action, ok := block[actionId]; ok {
			if action.Value != "" {
				return action.Value
			}
			if action.SelectedOption.Value != "" {
				return action.SelectedOption.Value
			}
		}
	}
	return ""
}

func (p *FormParser) extractSelectedUser(values map[string]map[string]slack.BlockAction, blockId, actionId string) string {
	if block, ok := values[blockId]; ok {
		if action, ok := block[actionId]; ok {
			if action.SelectedUser != "" {
				return action.SelectedUser
			}
		}
	}
	return ""
}

func (p *FormParser) extractSelectedChannel(values map[string]map[string]slack.BlockAction, blockId, actionId string) string {
	if block, ok := values[blockId]; ok {
		if action, ok := block[actionId]; ok {
			if action.SelectedChannel != "" {
				return action.SelectedChannel
			}
		}
	}
	return ""
}

func (p *FormParser) extractSelectedUsers(values map[string]map[string]slack.BlockAction, blockId, actionId string) []string {
	if block, ok := values[blockId]; ok {
		if action, ok := block[actionId]; ok {
			if len(action.SelectedUsers) > 0 {
				return action.SelectedUsers
			}
		}
	}
	return []string{}
}
