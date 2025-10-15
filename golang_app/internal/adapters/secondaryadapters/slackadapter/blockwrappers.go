package slackadapter

import "github.com/slack-go/slack"

func newSelectUserBlock(blockId, actionId string) *slack.InputBlock {
	element := slack.NewOptionsSelectBlockElement(
		slack.OptTypeUser,
		slack.NewTextBlockObject(slack.PlainTextType, "Choose user", NO_EMOJI, NOT_VERBATIM),
		actionId,
	)

	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, "Select a user", NO_EMOJI, NOT_VERBATIM),
		nil,
		element,
	)
}

func newSelectChannelElement(actionId string) *slack.SelectBlockElement {
	return slack.NewOptionsSelectBlockElement(
		slack.OptTypeChannels,
		slack.NewTextBlockObject(slack.PlainTextType, "Choose channel", NO_EMOJI, NOT_VERBATIM),
		actionId,
	)
}

func newSelectChannelBlock(title, blockId, actionId string) *slack.InputBlock {
	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, title, NO_EMOJI, NOT_VERBATIM),
		nil,
		newSelectChannelElement(actionId),
	)
}

func newTextInputElement(placeholder string, multiline bool, actionId string) *slack.PlainTextInputBlockElement {
	element := slack.NewPlainTextInputBlockElement(
		slack.NewTextBlockObject(slack.PlainTextType, placeholder, NO_EMOJI, NOT_VERBATIM),
		actionId,
	)
	element.Multiline = multiline
	return element
}

func newTextInputBlock(heading, placeholder, blockId, actionId string) *slack.InputBlock {
	inputElement := newTextInputElement(placeholder, false, actionId)
	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, heading, NO_EMOJI, NOT_VERBATIM),
		nil,
		inputElement,
	)
}

func newMultilineTextInputBlock(heading, placeholder, blockId, actionId string) *slack.InputBlock {
	inputElement := newTextInputElement(placeholder, true, actionId)
	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, heading, NO_EMOJI, NOT_VERBATIM),
		nil,
		inputElement,
	)
}

func newMultiUserSelectElement(placeholder, actionId string) *slack.MultiSelectBlockElement {
	return slack.NewOptionsMultiSelectBlockElement(
		slack.MultiOptTypeUser,
		slack.NewTextBlockObject(slack.PlainTextType, placeholder, NO_EMOJI, NOT_VERBATIM),
		actionId,
	)
}

func newMultiUserSelectBlock(heading, placeholder, blockId, actionId string) *slack.InputBlock {
	selectElement := newMultiUserSelectElement(placeholder, actionId)

	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, heading, NO_EMOJI, NOT_VERBATIM),
		nil,
		selectElement,
	)
}
