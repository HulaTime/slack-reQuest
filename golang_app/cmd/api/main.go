package main

import (
	"log"
	"os"

	"request/internal/adapters/secondaryadapters"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func main() {
	// Determine if we're in development mode
	// autoMigrate := os.Getenv("APP_ENV") != "production"

	dbPath := "app.db"
	if dbPath := os.Getenv("DB_PATH"); dbPath != "" {
		dbPath = dbPath
	}

	db, err := gorm.Open(sqlite.Open(dbPath))
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize repositories
	requestsWriter := secondaryadapters.NewRequestsWriter(db)
	requestsReader := secondaryadapters.NewRequestsReader(db)

	// TODO: Initialize services and HTTP handlers
	_ = requestsWriter
	_ = requestsReader

	log.Println("Server starting...")
	// TODO: Start HTTP server
}

