package slackadapter

import "github.com/slack-go/slack"

type BlockBuilder struct{}

func NewBlockBuilder() *BlockBuilder {
	return &BlockBuilder{}
}

func (b *BlockBuilder) TextInput(blockId, label, placeholder string, multiline bool, actionId string) *slack.InputBlock {
	element := slack.NewPlainTextInputBlockElement(
		slack.NewTextBlockObject(slack.PlainTextType, placeholder, NO_EMOJI, NOT_VERBATIM),
		actionId,
	)
	element.Multiline = multiline

	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, label, NO_EMOJI, NOT_VERBATIM),
		nil,
		element,
	)
}

func (b *BlockBuilder) UserSelect(blockId, label, placeholder string, actionId string) *slack.InputBlock {
	element := slack.NewOptionsSelectBlockElement(
		slack.OptTypeUser,
		slack.NewTextBlockObject(slack.PlainTextType, placeholder, NO_EMOJI, NOT_VERBATIM),
		actionId,
	)

	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, label, NO_EMOJI, NOT_VERBATIM),
		nil,
		element,
	)
}

func (b *BlockBuilder) MultiUserSelect(blockId, label, placeholder string, actionId string) *slack.InputBlock {
	element := slack.NewOptionsMultiSelectBlockElement(
		slack.MultiOptTypeUser,
		slack.NewTextBlockObject(slack.PlainTextType, placeholder, NO_EMOJI, NOT_VERBATIM),
		actionId,
	)

	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, label, NO_EMOJI, NOT_VERBATIM),
		nil,
		element,
	)
}

func (b *BlockBuilder) ChannelSelect(blockId, label, placeholder string, actionId string) *slack.InputBlock {
	element := slack.NewOptionsSelectBlockElement(
		slack.OptTypeChannels,
		slack.NewTextBlockObject(slack.PlainTextType, placeholder, NO_EMOJI, NOT_VERBATIM),
		actionId,
	)

	return slack.NewInputBlock(
		blockId,
		slack.NewTextBlockObject(slack.PlainTextType, label, NO_EMOJI, NOT_VERBATIM),
		nil,
		element,
	)
}

func (b *BlockBuilder) Section(text string) *slack.SectionBlock {
	return slack.NewSectionBlock(
		slack.NewTextBlockObject(slack.MarkdownType, text, NO_EMOJI, NOT_VERBATIM),
		nil,
		nil,
	)
}

func (b *BlockBuilder) SectionWithAccessory(text string, accessory slack.BlockElement) *slack.SectionBlock {
	section := slack.NewSectionBlock(
		slack.NewTextBlockObject(slack.MarkdownType, text, NO_EMOJI, NOT_VERBATIM),
		nil,
		nil,
	)
	section.Accessory = slack.NewAccessory(accessory)
	return section
}

func (b *BlockBuilder) Button(actionId, text, value string, style slack.Style) *slack.ButtonBlockElement {
	btn := slack.NewButtonBlockElement(
		actionId,
		value,
		slack.NewTextBlockObject(slack.PlainTextType, text, NO_EMOJI, NOT_VERBATIM),
	)
	if style != "" {
		btn.Style = style
	}
	return btn
}

func (b *BlockBuilder) Actions(blockId string, elements ...slack.BlockElement) *slack.ActionBlock {
	return slack.NewActionBlock(blockId, elements...)
}

func (b *BlockBuilder) Divider() *slack.DividerBlock {
	return slack.NewDividerBlock()
}
