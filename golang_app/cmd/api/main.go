package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	slackapiadapter "request/internal/adapters/primaryadapters/slack_api_adapter"
	"request/internal/adapters/secondaryadapters/dbadapter"
	"request/internal/adapters/secondaryadapters/slackadapter"
	"request/internal/app/services"
	"request/pkg/loghandlers"

	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"github.com/slack-go/slack"
	"gorm.io/gorm"
)

func main() {
	handler := &loghandlers.ContextLogHandler{Handler: slog.NewJSONHandler(os.Stdout, nil)}
	slog.SetDefault(slog.New(handler))

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	dbPath := "app.db"
	if envPath := os.Getenv("DB_PATH"); envPath != "" {
		dbPath = envPath
	}

	db, err := gorm.Open(sqlite.Open(dbPath))
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	requestsWriter := dbadapter.NewRequestsWriter(db)
	requestsReader := dbadapter.NewRequestsReader(db)
	queuesWriter := dbadapter.NewQueuesWriter(db)
	queuesReader := dbadapter.NewQueuesReader(db)

	slackToken := os.Getenv("SLACK_BOT_TOKEN")
	if slackToken == "" {
		log.Fatal("SLACK_BOT_TOKEN environment variable is required")
	}

	slackClient := slack.New(slackToken)
	slackViewRenderer := slackadapter.NewSlackViewRenderer(slackClient)
	slackMessenger := slackadapter.NewSlackMessenger(slackClient)
	slackMessageRenderer := slackadapter.NewMessageRenderer(slackClient)

	requestService := services.NewRequestService(slackViewRenderer, requestsWriter)
	queueService := services.NewQueueService(queuesWriter, queuesReader)
	requestResponseService := services.NewRequestResponseService(
		requestsWriter,
		requestsReader,
		queuesReader,
		slackMessenger,
	)
	formSubmissionService := services.NewFormSubmissionService(
		requestsWriter,
		queuesWriter,
		slackMessenger,
		slackMessageRenderer,
	)
	_ = requestResponseService

	slackHandler := slackapiadapter.NewSlackHandler(
		requestService,
		queueService,
		formSubmissionService,
		slackViewRenderer,
	)

	http.HandleFunc("/slack/commands", slackHandler.HandleSlashCommand)
	http.HandleFunc("/slack/interactions", slackHandler.HandleInteractions)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Server starting on %s...", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
