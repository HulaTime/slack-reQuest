package slackapiadapter

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"request/internal/adapters/secondaryadapters/slackadapter"
	"request/internal/app/ports/primaryports"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
	"request/pkg/loghandlers"

	"github.com/slack-go/slack"
)

type SlackHandler struct {
	requestHandler        primaryports.ForHandlingRequests
	queueManager          primaryports.ForManagingQueues
	formSubmissionHandler primaryports.ForHandlingFormSubmissions
	modalRenderer         secondaryports.ForRenderingModals
}

func NewSlackHandler(
	requestHandler primaryports.ForHandlingRequests,
	queueManager primaryports.ForManagingQueues,
	formSubmissionHandler primaryports.ForHandlingFormSubmissions,
	modalRenderer secondaryports.ForRenderingModals,
) *SlackHandler {
	return &SlackHandler{
		requestHandler:        requestHandler,
		queueManager:          queueManager,
		formSubmissionHandler: formSubmissionHandler,
		modalRenderer:         modalRenderer,
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

	ctx := loghandlers.AppendLogCtx(r.Context(),
		slog.String("requestCommand", cmd.Command+" "+cmd.Text),
		slog.String("triggerId", cmd.TriggerID),
	)

	switch cmd.Text {
	case "":
		h.handleNoArgs(ctx, w, r, cmd)
	case "new-request":
		h.handleNewRequest(ctx, w, r, cmd)
	case "new-queue":
		h.handleNewQueue(ctx, w, r, cmd)
	case "manage-queue":
		h.handleNewRequest(ctx, w, r, cmd)
	case "list-queues":
		h.handleListQueues(ctx, w, r, cmd)
	case "delete-queues":
		h.handleNewRequest(ctx, w, r, cmd)
	default:
		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"text": fmt.Sprintf("Unknown subcommand: %s. Try `/request new`", cmd.Text),
		}
		json.NewEncoder(w).Encode(response)
	}
}

func (h *SlackHandler) handleNoArgs(ctx context.Context, w http.ResponseWriter, r *http.Request, cmd slack.SlashCommand) {
	slog.DebugContext(ctx, "Handling command with no args")

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"text": "Not yet implemented",
	}
	json.NewEncoder(w).Encode(response)
	return
}

func (h *SlackHandler) handleNewQueue(ctx context.Context, w http.ResponseWriter, r *http.Request, cmd slack.SlashCommand) {
	slog.DebugContext(ctx, "Handling new queue command")
	h.modalRenderer.RenderQueueForm(ctx, cmd.TriggerID, secondaryports.QueueFormView{})
	return
}

func (h *SlackHandler) handleListQueues(ctx context.Context, w http.ResponseWriter, r *http.Request, cmd slack.SlashCommand) {
	slog.DebugContext(ctx, "Handling list queues command")
	h.modalRenderer.RenderQueueForm(ctx, cmd.TriggerID, secondaryports.QueueFormView{})
	return
}

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

func (h *SlackHandler) handleNewRequest(ctx context.Context, w http.ResponseWriter, r *http.Request, cmd slack.SlashCommand) {
	slog.DebugContext(ctx, "Handling new request command")

	err := h.requestHandler.OpenNewRequestForm(ctx, cmd.TriggerID)
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

func (h *SlackHandler) handleBlockActions(w http.ResponseWriter, r *http.Request, payload *slack.InteractionCallback) {
	ctx := r.Context()

	for _, action := range payload.ActionCallback.BlockActions {
		slog.InfoContext(ctx, "Block action received",
			slog.String("actionID", action.ActionID),
			slog.String("type", string(action.Type)))

		switch action.ActionID {
		case slackadapter.ActionIDRecipientTypeSelect:
			if action.SelectedOption.Value != "" {
				recipientType := action.SelectedOption.Value
				slog.InfoContext(ctx, "User selected recipient type",
					slog.String("recipientType", recipientType),
					slog.String("viewID", payload.View.ID))

				err := h.modalRenderer.UpdateRequestForm(ctx, payload.View.ID, domain.RequestRecipientType(recipientType))
				if err != nil {
					slog.ErrorContext(ctx, "Failed to update request form",
						slog.String("err", err.Error()))
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
			}
		default:
			slog.DebugContext(ctx, "Unhandled action", slog.String("actionID", action.ActionID))
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *SlackHandler) handleViewSubmission(w http.ResponseWriter, r *http.Request, payload *slack.InteractionCallback) {
	ctx := r.Context()
	parser := NewFormParser()

	switch payload.View.CallbackID {
	case slackadapter.CallbackIDRequestForm:
		formData, err := parser.ParseRequestForm(*payload)
		if err != nil {
			slog.ErrorContext(ctx, "Failed to parse request form",
				slog.String("err", err.Error()))
			h.respondWithError(w, err)
			return
		}

		if err := h.formSubmissionHandler.HandleRequestFormSubmission(ctx, formData); err != nil {
			slog.ErrorContext(ctx, "Failed to handle request form submission",
				slog.String("err", err.Error()))
			h.respondWithError(w, err)
			return
		}

		slog.InfoContext(ctx, "Request created successfully",
			slog.String("createdBy", formData.CreatedByID))

	case slackadapter.CallbackIDQueueForm:
		formData, err := parser.ParseQueueForm(*payload)
		if err != nil {
			slog.ErrorContext(ctx, "Failed to parse queue form",
				slog.String("err", err.Error()))
			h.respondWithError(w, err)
			return
		}

		if err := h.formSubmissionHandler.HandleQueueFormSubmission(ctx, formData); err != nil {
			slog.ErrorContext(ctx, "Failed to handle queue form submission",
				slog.String("err", err.Error()))
			h.respondWithError(w, err)
			return
		}

		slog.InfoContext(ctx, "Queue created successfully",
			slog.String("createdBy", formData.CreatedById),
			slog.String("channelId", formData.ChannelId))

	default:
		slog.WarnContext(ctx, "Unknown view submission callback",
			slog.String("callbackId", payload.View.CallbackID))
	}

	w.WriteHeader(http.StatusOK)
}

func (h *SlackHandler) respondWithError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"response_action": "errors",
		"errors": map[string]string{
			"general": err.Error(),
		},
	}
	json.NewEncoder(w).Encode(response)
}
