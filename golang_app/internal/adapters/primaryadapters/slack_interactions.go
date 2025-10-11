package primaryadapters

import (
	"fmt"
	"log/slog"
	"net/http"
	"request/internal/adapters/secondaryadapters/slackadapter"

	"github.com/slack-go/slack"
)

func (h *SlackHandler) HandleInteractions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	interaction, err := slack.InteractionCallbackParse(r)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	switch interaction.Type {
	case slack.InteractionTypeBlockActions:
		h.handleBlockActions(w, r, &interaction)
	case slack.InteractionTypeViewSubmission:
		h.handleViewSubmission(w, r, &interaction)
	default:
		slog.WarnContext(r.Context(), "Unknown interaction type", slog.String("interactionType", string(interaction.Type)))
		w.WriteHeader(http.StatusOK)
	}
}

func (h *SlackHandler) handleBlockActions(w http.ResponseWriter, r *http.Request, payload *slack.InteractionCallback) {
	for _, action := range payload.ActionCallback.BlockActions {
		slog.InfoContext(r.Context(), fmt.Sprintf("Block action: %s, value: %v", action.ActionID, action.SelectedOption))

		switch action.ActionID {
		case slackadapter.ActionIDRecipientTypeSelect:
			if action.SelectedOption.Value != "" {
				slog.InfoContext(r.Context(), fmt.Sprintf("User selected recipient type: %s", action.SelectedOption.Value))
			}
		default:
			slog.WarnContext(r.Context(), fmt.Sprintf("Unhandled action: %s", action.ActionID))
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *SlackHandler) handleViewSubmission(w http.ResponseWriter, r *http.Request, payload *slack.InteractionCallback) {
	slog.InfoContext(r.Context(), fmt.Sprintf("View submission received: %+v", payload.View.State.Values))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}
