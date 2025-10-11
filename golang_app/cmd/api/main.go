package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"request/internal/adapters/primaryadapters"
	"request/internal/adapters/secondaryadapters"
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

	requestsWriter := secondaryadapters.NewRequestsWriter(db)
	requestsReader := secondaryadapters.NewRequestsReader(db)

	_ = requestsWriter
	_ = requestsReader

	slackToken := os.Getenv("SLACK_BOT_TOKEN")
	if slackToken == "" {
		log.Fatal("SLACK_BOT_TOKEN environment variable is required")
	}

	slackClient := slack.New(slackToken)
	slackViewRenderer := secondaryadapters.NewSlackViewRenderer(slackClient)
	requestService := services.NewRequestService(slackViewRenderer, requestsWriter)
	slackHandler := primaryadapters.NewSlackHandler(requestService)

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
