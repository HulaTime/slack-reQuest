# reQuest - Slack Request Management Application

A Golang Slack application implementing hexagonal architecture for managing requests between users, channels, and custom queues.

## Overview

reQuest allows users to:
- Make requests to other Slack users, channels, or custom "request queues"
- Accept or reject incoming requests
- Create and administer custom request queues (privileged users only)
- Interact with requests via Slack interactive messages and modal views

## Architecture

The application follows **hexagonal (ports & adapters) architecture**:

### Domain Layer (`internal/domain/`)
Core business entities with no external dependencies:
- **Request** - Main entity with statuses: `pending`, `accepted`, `rejected`, `completed`
  - Contains title, description, creator, recipient, and timestamps
  - Recipients can be users, groups, or queues
- **Queue** - Custom request queues with name, description, and creator
- **Group** - User groups for request management
- **User** - Basic user entity

### Application Layer (`internal/app/`)

#### Primary Ports (`ports/primaryports/`)
Inbound interfaces for driving the application:
- `ForHandlingRequests` - Sending request forms
- `ForMakingRequests` - Creating requests (stub)
- `ForRespondingToRequests` - Responding to requests (stub)
- `ForCreatingQueues` - Creating queues (stub)

#### Secondary Ports (`ports/secondaryports/`)
Outbound interfaces for infrastructure:
- `ForStoringRequests` / `ForReadingRequests` - Request persistence
- `ForStoringQueues` / `ForReadingQueues` - Queue persistence
- `ForStoringGroups` / `ForReadingGroups` - Group persistence

#### Services (`services/`)
- `newrequest.go` - Slack modal for creating new requests

### Adapters Layer (`internal/adapters/`)

#### Primary Adapters (`primaryadapters/`)
Inbound implementations:
- `slack_handler.go` - HTTP handler for Slack slash commands (`/request new`)

#### Secondary Adapters (`secondaryadapters/`)
Outbound implementations with GORM/SQLite:
- `requests_repo.go` - Request repository with full CRUD
- `queues_repo.go` - Queue repository
- `groups_repo.go` - Group repository
- DTOs for database mapping
- Comprehensive integration tests

## Technology Stack

- **Language**: Go 1.25.1
- **Slack SDK**: slack-go/slack v0.17.3
- **Database**: SQLite via glebarez/sqlite v1.11.0
- **ORM**: GORM v1.31.0
- **Migrations**: Atlas (via atlas-provider-gorm)
- **Config**: godotenv v1.5.1

## Setup

### Prerequisites
- Go 1.25.1+
- Slack workspace with admin access
- Slack app configured with a bot token

### Environment Variables

Create a `.env` file in the project root:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
PORT=3000
DB_PATH=app.db
```

### Required Slack Bot Scopes

Configure these in your Slack app settings under **OAuth & Permissions** → **Bot Token Scopes**:

**Required:**
- `commands` - Receive slash commands
- `chat:write` - Send messages
- `users:read` - Access user information

**Recommended:**
- `channels:read` - Access channel information
- `groups:read` - Access private channels
- `im:write` - Send direct messages
- `mpim:write` - Send multi-person DMs

### Slack App Configuration

1. **Slash Commands**: Configure `/request` to point to `https://your-domain/slack/commands`
2. **Interactive Components**: Configure interactivity endpoint (TBD)

## Running the Application

### Build
```bash
go build -o bin/api ./cmd/api
```

### Run
```bash
./bin/api
```

The server will start on port 3000 (or `PORT` env var).

## Database Migrations

Using Atlas for schema management:

```bash
atlas schema inspect --env gorm --url "env://src"
atlas migrate diff --env gorm
atlas migrate apply -u "sqlite://dev.db" --dir "file://migrations"
```

## API Endpoints

- `POST /slack/commands` - Slack slash command webhook

## Current Implementation Status

**Completed:**
- ✅ Domain models with validation
- ✅ Repository pattern with GORM
- ✅ Integration tests for all repositories
- ✅ HTTP server with Slack command handler
- ✅ Modal UI for request creation (buttons for User/Channel/Queue selection)

**In Progress / TODO:**
- ⚠️ Interactive component handler for button clicks
- ⚠️ Modal view updates based on recipient type selection
- ⚠️ Service layer implementation
- ⚠️ Request submission and persistence flow
- ⚠️ Queue creation and management
- ⚠️ Request acceptance/rejection workflows
- ⚠️ Notification system

## Project Structure

```
.
├── cmd/
│   └── api/
│       └── main.go                 # Application entrypoint
├── internal/
│   ├── domain/                     # Domain entities
│   │   ├── request.go
│   │   ├── queue.go
│   │   ├── group.go
│   │   └── user.go
│   ├── app/
│   │   ├── ports/
│   │   │   ├── primaryports/       # Inbound interfaces
│   │   │   └── secondaryports/     # Outbound interfaces
│   │   └── services/               # Business logic
│   │       └── newrequest.go
│   └── adapters/
│       ├── primaryadapters/        # HTTP/Slack handlers
│       │   └── slack_handler.go
│       └── secondaryadapters/      # Database repositories
│           ├── requests_repo.go
│           ├── queues_repo.go
│           └── groups_repo.go
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

## Testing

Run integration tests:
```bash
go test -tags=integration ./...
```

## Development Notes

- See `CLAUDE.md` for development rules and guidelines
- Avoid comments in code; focus on clear, self-documenting implementations
- Always run tests after making changes
- Never leave the project in a broken state
