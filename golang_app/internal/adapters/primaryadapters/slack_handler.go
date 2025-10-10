package primaryadapters

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"request/internal/app/services"

	"github.com/slack-go/slack"
)

type SlackHandler struct {
	requestService *services.RequestService
}

func NewSlackHandler(requestService *services.RequestService) *SlackHandler {
	return &SlackHandler{
		requestService: requestService,
	}
}

func (h *SlackHandler) HandleSlashCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cmd, err := slack.SlashCommandParse(r)
	if err != nil {
		log.Printf("Failed to parse slash command: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if cmd.Command != "/request" {
		http.Error(w, "Unknown command", http.StatusBadRequest)
		return
	}

	switch cmd.Text {
	case "new":
		h.handleNewRequest(w, r, cmd)
	default:
		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"text": fmt.Sprintf("Unknown subcommand: %s. Try `/request new`", cmd.Text),
		}
		json.NewEncoder(w).Encode(response)
	}
}

func (h *SlackHandler) handleNewRequest(w http.ResponseWriter, r *http.Request, cmd slack.SlashCommand) {
	err := h.requestService.OpenNewRequestForm(r.Context(), cmd.TriggerID)
	if err != nil {
		log.Printf("Failed to open new request modal: %v", err)
		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"text": "Failed to open request form. Please try again.",
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	w.WriteHeader(http.StatusOK)
}
