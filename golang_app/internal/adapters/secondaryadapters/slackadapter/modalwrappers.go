package slackadapter

import "github.com/slack-go/slack"

func newModalViewRequest(callbackId string, title string, submitEnabled bool) *slack.ModalViewRequest {
	var submit *slack.TextBlockObject

	if submitEnabled {
		submit = &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Submit",
		}
	}

	return &slack.ModalViewRequest{
		Type:       slack.VTModal,
		CallbackID: CallbackIDRequestForm,
		Title: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: title,
		},
		Close: &slack.TextBlockObject{
			Type: slack.PlainTextType,
			Text: "Cancel",
		},
		Submit: submit,
		Blocks: slack.Blocks{BlockSet: []slack.Block{}},
	}
}
