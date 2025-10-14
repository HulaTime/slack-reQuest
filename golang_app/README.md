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
Core business entities with business logic and no external dependencies:
- **Request** - Main entity with statuses: `pending`, `accepted`, `rejected`, `completed`
  - Business methods: `Accept()`, `Reject()`, `Complete()`
  - Authorization: `CanBeRespondedToBy()`, `CanBeCompletedBy()`
  - Recipients can be users, groups, or queues
- **Queue** - Custom request queues with admins and members
  - Admin management: `AddAdmin()`, `RemoveAdmin()`, `IsAdmin()`
  - Member management: `AddMember()`, `RemoveMember()`, `IsMember()`
  - Authorization: `CanBeModifiedBy()`, `CanRespondToRequests()`
  - Members can accept requests; admins can manage the queue
- **Group** - User groups for request management
- **User** - Basic user entity

### Application Layer (`internal/app/`)

#### Primary Ports (`ports/primaryports/`)
Inbound interfaces for driving the application:
- `ForHandlingRequests` - Opening request forms, creating/updating/deleting requests
- `ForManagingQueues` - Full queue lifecycle (create, update, delete, admin/member management)
- `ForRespondingToRequests` - Accept/reject/complete requests, list requests

#### Secondary Ports (`ports/secondaryports/`)
Outbound interfaces for infrastructure:
- `ForStoringRequests` / `ForReadingRequests` - Request persistence (upsert-capable)
- `ForStoringQueues` / `ForReadingQueues` - Queue persistence with AdminIds/MemberIds as JSON
- `ForStoringGroups` / `ForReadingGroups` - Group persistence
- `ForRenderingViews` - Slack modals and messages (request forms, queue forms, notifications)
- `ForMessagingUsers` - Direct messages, channel messages, ephemeral messages

#### Services (`services/`)
- `RequestService` - Request form rendering and creation
- `QueueService` - Complete queue management with authorization
- `RequestResponseService` - Request lifecycle with notifications and authorization checks

### Adapters Layer (`internal/adapters/`)

#### Primary Adapters (`primaryadapters/`)
Inbound implementations:
- `slack_api_adapter/slack_handler.go` - HTTP handlers for:
  - Slack slash commands (`/request new-request`, `/request new-queue`, etc.)
  - Interactive component callbacks (button clicks, form submissions)

#### Secondary Adapters (`secondaryadapters/`)
**Database Adapters** (`dbadapter/`) - GORM/SQLite implementations:
- `requests_repo.go` - Request repository with upsert-capable Save()
- `queues_repo.go` - Queue repository with JSON-stored AdminIds/MemberIds
- `groups_repo.go` - Group repository
- Comprehensive integration tests for all repositories

**Slack Adapters** (`slackadapter/`):
- `slack_views.go` - Modal and message rendering:
  - ✅ Request form with dynamic recipient selection
  - ✅ Queue form with channel, name, description, multi-admin selector
  - ⚠️ Request notifications (not yet implemented)
- `slack_messenger.go` - Direct messages, channel messages, ephemeral messages
- `slack_view_constants.go` - All block/action/callback IDs

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

### ✅ Completed

**Domain Layer:**
- ✅ Request entity with Accept/Reject/Complete state machine
- ✅ Queue entity with admin and member management
- ✅ Authorization logic (CanBeRespondedToBy, CanBeCompletedBy, CanBeModifiedBy)
- ✅ Member support - both admins and members can accept queue requests

**Application Services:**
- ✅ **QueueService** - Complete CRUD, admin/member management with authorization
- ✅ **RequestResponseService** - Accept/reject/complete with notifications and authorization
- ✅ **RequestService** - Basic request form rendering and creation

**Infrastructure:**
- ✅ All repository interfaces with upsert-capable Save() methods
- ✅ Database adapters for Requests, Queues, Groups (with integration tests)
- ✅ Slack messenger adapter (DMs, channel messages, ephemeral)
- ✅ Request form modal with dynamic recipient type selection
- ✅ Queue form modal with multi-user admin selector

**Wiring:**
- ✅ All services instantiated in main.go
- ✅ HTTP server with slash command and interaction endpoints

### ⚠️ In Progress

- ⚠️ View submission handler (parses form but doesn't process yet)
- ⚠️ Queue/request creation from Slack forms
- ⚠️ Request notification rendering (DMs with Accept/Reject buttons)

### ❌ Not Yet Started

- ❌ Accept/Reject/Complete button handlers
- ❌ Request notification updates after status changes
- ❌ End-to-end request creation → notification → acceptance flow
- ❌ Queue listing and selection in request forms
- ❌ Comprehensive service and handler tests

## Project Structure

```
.
├── cmd/
│   └── api/
│       └── main.go                           # Application entrypoint with DI wiring
├── internal/
│   ├── domain/                               # Domain entities with business logic
│   │   ├── request.go                        # Request with state transitions
│   │   ├── queue.go                          # Queue with admin/member management
│   │   ├── group.go
│   │   └── user.go
│   ├── app/
│   │   ├── ports/
│   │   │   ├── primaryports/                 # Inbound interfaces
│   │   │   │   ├── for_handling_requests.go
│   │   │   │   ├── for_managing_queues.go
│   │   │   │   └── for_responding_to_requests.go
│   │   │   └── secondaryports/               # Outbound interfaces
│   │   │       ├── for_persisting_*.go       # Repository interfaces
│   │   │       ├── for_rendering_views.go    # Slack UI rendering
│   │   │       └── for_messaging.go          # Slack messaging
│   │   └── services/                         # Application services
│   │       ├── newrequest.go                 # RequestService
│   │       ├── queue_service.go              # QueueService (complete)
│   │       └── request_response_service.go   # RequestResponseService (complete)
│   └── adapters/
│       ├── primaryadapters/
│       │   └── slack_api_adapter/
│       │       └── slack_handler.go          # Slack commands & interactions
│       └── secondaryadapters/
│           ├── dbadapter/                    # Database repositories
│           │   ├── requests_repo.go
│           │   ├── queues_repo.go
│           │   └── groups_repo.go
│           └── slackadapter/                 # Slack UI & messaging
│               ├── slack_views.go            # Modal rendering
│               ├── slack_messenger.go        # DM/channel messaging
│               └── slack_view_constants.go   # Block/action IDs
├── pkg/
│   └── loghandlers/                          # Custom logging
│       └── contexthandler.go
├── go.mod
├── go.sum
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
