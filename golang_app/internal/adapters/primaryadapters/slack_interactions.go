package primaryadapters

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"request/internal/adapters/secondaryadapters"

	"github.com/slack-go/slack"
)

func (h *SlackHandler) HandleInteractions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Failed to read request body: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var payload slack.InteractionCallback
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		log.Printf("Failed to parse interaction payload: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	switch payload.Type {
	case slack.InteractionTypeBlockActions:
		h.handleBlockActions(w, r, &payload)
	case slack.InteractionTypeViewSubmission:
		h.handleViewSubmission(w, r, &payload)
	default:
		log.Printf("Unknown interaction type: %s", payload.Type)
		w.WriteHeader(http.StatusOK)
	}
}

func (h *SlackHandler) handleBlockActions(w http.ResponseWriter, r *http.Request, payload *slack.InteractionCallback) {
	for _, action := range payload.ActionCallback.BlockActions {
		log.Printf("Block action: %s, value: %v", action.ActionID, action.SelectedOption)

		switch action.ActionID {
		case secondaryadapters.ActionIDRecipientTypeSelect:
			if action.SelectedOption.Value != "" {
				log.Printf("User selected recipient type: %s", action.SelectedOption.Value)
			}
		default:
			log.Printf("Unhandled action: %s", action.ActionID)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *SlackHandler) handleViewSubmission(w http.ResponseWriter, r *http.Request, payload *slack.InteractionCallback) {
	log.Printf("View submission received: %+v", payload.View.State.Values)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}
