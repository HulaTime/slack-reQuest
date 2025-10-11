package primaryadapters

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"request/internal/app/services"
	"request/pkg/loghandlers"

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
		slog.ErrorContext(r.Context(), "Failed to parse slash command", slog.String("err", err.Error()))
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
	ctx := loghandlers.AppendLogCtx(r.Context(),
		slog.GroupAttrs("requestContext", slog.String("cmd", "new")))

	slog.DebugContext(ctx, "Beginnig to handle new request")

	err := h.requestService.OpenNewRequestForm(ctx, cmd.TriggerID)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to open new request modal: %v", err)

		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"text": "Failed to open request form. Please try again.",
		}
		json.NewEncoder(w).Encode(response)
		return
	}
	slog.InfoContext(ctx, "Successfully opened new request form")

	w.WriteHeader(http.StatusOK)
}
