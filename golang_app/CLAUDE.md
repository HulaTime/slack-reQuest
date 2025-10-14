# Context

## Summary 
This is a Golang slack application, implementing a hexagonal architecture pattern. The app should allow users to make requests to other slack users,
channels or custom created "request queues", which can then be accepted or rejected by the receiving user, or members of the receiving channel or queue.
The custom queues can be created by privileged users, and once created, can be updated and administered by "admin users" of that queue. Requests and
queues should be viewable and interactable via Slack interactive messages and modal views.

## Project Architecture
- Adhere to hexagonal (ports & adapters) best practices and patterns.

## Project Rules
- Always refer to the context files in .amazonq/rules before performing any action
- Never leave the project in a broken state unless explicitly permitted
- Running tests and build commands are permitted at any time, however never run arbitrary 
commands without first asking and explaining their purpose.

## Code & Style rules
- avoid comments in code, focus on making sure code, functions and approach is clear in it's intent. 
comments should only be used when it is necessary to describe complex business logic, or the reason
a particular piece of code has had to be added when the context is too far removed
- always check types before creating objects or writing code. Don't make assumptions about object shapes

## MCP Rules
- Always check the mcp tools for guidance when considering answers to CI/CD questions
- Always check the mcp tools for guidance when considering answers to terraform related questions
- Always check the context7 mcp first for documentation of 3rd party libraries and packages

## Analysis Rules
- Never only analyse one section of a project when trying to understand the codebase. You should sample multiple areas at a minimum.
- When analysing a project, always follow function calls to understand which files and downstream functions are called, building a more complete context of the application
- Always check file content before you make a suggestion related to that file to ensure it hasnt changed since you last saw it

## Testing Rules
- Always run tests after you have made changes to the tests to ensure they are working
- When working with tests never make assumptions about behaviour, if you are unsure what correct behaviour should be, ask me
- If you find a bug, tell me, ask about the correct intended behaviour, then suggest possible fixes

---

# Implementation Plan

## Current State Analysis

**✅ Completed (Phases 1-6):**
- ✅ Domain models with business logic methods (Request.Accept/Reject/Complete, Queue.AddAdmin/RemoveAdmin/AddMember/RemoveMember)
- ✅ Domain authorization methods (CanBeRespondedToBy with admin+member support, CanBeCompletedBy, CanBeModifiedBy)
- ✅ Repository interfaces & implementations with AdminIds/MemberIds as JSON (db adapters, upsert-capable)
- ✅ Primary ports for queue management (ForManagingQueues with member support)
- ✅ Primary ports for request responses (ForRespondingToRequests)
- ✅ Primary ports for request handling (ForHandlingRequests)
- ✅ Secondary ports for rendering views (ForRenderingViews)
- ✅ Secondary ports for messaging (ForMessagingUsers)
- ✅ **QueueService** - Full implementation with authorization
- ✅ **RequestResponseService** - Full implementation with notifications
- ✅ **RequestService** - Basic form rendering and creation
- ✅ **SlackMessenger** - Direct messages, channel messages, ephemeral
- ✅ **SlackViewRenderer** - Request form, Queue form with multi-admin selector
- ✅ Slack slash command handler with multiple commands
- ✅ Interaction handler skeleton with recipient type selection
- ✅ All services wired in main.go

**🔄 In Progress (Phase 7-8):**
- ⚠️ View submission handler (needs request/queue creation logic)
- ⚠️ Request notification rendering (RenderRequestNotification, UpdateRequestNotification)
- ⚠️ Accept/Reject/Complete button handlers

**❌ Not Started (Phase 9-10):**
- ❌ Complete end-to-end request creation → notification → acceptance flow
- ❌ Queue listing in request form
- ❌ Comprehensive service tests
- ❌ Handler integration tests
- ❌ End-to-end workflow testing

## Phased Implementation Plan

### Phase 1: Enhance Domain Models ✅ COMPLETED
**Goal:** Add business logic methods to domain entities for safe state transitions

**Deliverables:**
- `Request.Accept(userId)` - Validate and transition to accepted
- `Request.Reject()` - Transition to rejected
- `Request.Complete()` - Transition to completed
- `Request.CanBeAcceptedBy(userId, isQueueAdmin)` - Authorization logic
- `Queue.AddAdmin(userId)` / `Queue.RemoveAdmin(userId)` - If admins stored in Queue
- Validation methods for state transitions

**Files to modify:**
- `internal/domain/request.go`
- `internal/domain/queue.go`

### Phase 2: Create Primary Ports ✅ COMPLETED
**Goal:** Define inbound interfaces for new use cases

**Deliverables:**

**`internal/app/ports/primaryports/for_managing_queues.go`**
```go
type ForManagingQueues interface {
    CreateQueue(ctx, name, description, createdById string) error
    GetQueue(ctx, queueId string) (*domain.Queue, error)
    ListQueues(ctx) ([]*domain.Queue, error)
    UpdateQueue(ctx, queue *domain.Queue) error
    DeleteQueue(ctx, queueId string) error
}
```

**`internal/app/ports/primaryports/for_responding_to_requests.go`**
```go
type ForRespondingToRequests interface {
    AcceptRequest(ctx, requestId, userId string) error
    RejectRequest(ctx, requestId, userId string) error
    CompleteRequest(ctx, requestId, userId string) error
    GetRequestDetails(ctx, requestId string) (*domain.Request, error)
}
```

### Phase 3: Expand Secondary Ports ✅ COMPLETED
**Goal:** Add infrastructure interfaces for messaging and advanced views

**Deliverables:**

**Add to `internal/app/ports/secondaryports/for_rendering_views.go`**
```go
RenderQueueForm(ctx, triggerId string, view QueueFormView) error
RenderRequestDetails(ctx, channelId, messageTs string, request *domain.Request) error
UpdateRequestDetailsMessage(ctx, channelId, messageTs string, request *domain.Request) error
```

**`internal/app/ports/secondaryports/for_messaging.go`** (new)
```go
type ForMessagingUsers interface {
    SendDirectMessage(ctx, userId, message string) error
    SendChannelMessage(ctx, channelId, message string) (messageTs string, error)
}
```

### Phase 4: Queue Management Service
**Goal:** Implement complete queue CRUD operations

**Deliverables:**
- `internal/app/services/queue_service.go`
- Implements `ForManagingQueues`
- Uses `ForStoringQueues`, `ForReadingQueues`, `ForRenderingViews`
- Business logic: validation, authorization checks
- Tests: `internal/app/services/queue_service_test.go`

### Phase 5: Request Response Service
**Goal:** Handle request lifecycle (accept/reject/complete)

**Deliverables:**
- `internal/app/services/request_response_service.go`
- Implements `ForRespondingToRequests`
- Uses domain methods for state transitions
- Uses `ForStoringRequests`, `ForReadingRequests`, `ForMessagingUsers`
- Sends notifications on status changes
- Authorization: Check if user can respond to request
- Tests: `internal/app/services/request_response_service_test.go`

### Phase 6: Build Slack Adapters
**Goal:** Implement secondary port interfaces for Slack

**Deliverables:**

**Expand `internal/adapters/secondaryadapters/slackadapter/slack_views.go`**
- Implement `RenderQueueForm` - Modal for creating queues
- Implement `RenderRequestDetails` - Rich message with buttons (Accept/Reject/Complete)
- Implement `UpdateRequestDetailsMessage` - Update message after status change

**`internal/adapters/secondaryadapters/slackadapter/slack_messenger.go`** (new)
- Implements `ForMessagingUsers`
- Send DMs and channel messages
- Handle message threading

**`internal/adapters/secondaryadapters/slackadapter/slack_view_constants.go`**
- Add new action IDs and block IDs

### Phase 7: Slack Interaction Handlers
**Goal:** Wire up interactive components to services

**Deliverables:**

**Expand `internal/adapters/primaryadapters/slack_handler.go`**
- Add `/request create` command handler
- Add `/queue create` command handler
- Add `/queue list` command handler

**Expand `internal/adapters/primaryadapters/slack_interactions.go`**
- Handle recipient type selection → update modal
- Handle queue form submission → call `QueueService.CreateQueue`
- Handle request form submission → call `RequestService.CreateRequest`
- Handle Accept/Reject/Complete button clicks → call `RequestResponseService.*`

### Phase 8: Complete Request Creation Flow
**Goal:** End-to-end working request creation with notifications

**Flow:**
1. User types `/request new`
2. Modal opens with recipient type buttons
3. User selects type (user/channel/queue)
4. Modal updates with appropriate selection UI
5. User fills title, description, selects recipient
6. User submits
7. Request saved to DB
8. Notification sent to recipient
9. Recipient sees message with Accept/Reject buttons

**Files to complete:**
- Update `RequestService.CreateRequest` to send notifications
- Wire modal updates in interaction handler
- Implement dynamic recipient selection UI

### Phase 9: Write Comprehensive Tests
**Goal:** Test all new services and business logic

**Deliverables:**
- Domain model tests: `internal/domain/request_test.go`, `queue_test.go`
- Service tests (unit): Mock ports, test business logic
- Integration tests: Test with real DB
- Handler tests: Test Slack interaction flows

### Phase 10: Integration & Refinement
**Goal:** End-to-end testing and polish

**Deliverables:**
- Test complete workflows in Slack workspace
- Error handling improvements
- Logging enhancements
- Update README with new commands
- Database migrations if schema changes needed

## Dependency Graph

```
Phase 1 (Domain) → Phase 2 (Primary Ports) ⟍
                                              → Phase 4 (Queue Service)    ⟍
Phase 3 (Secondary Ports) → Phase 6 (Adapters) → Phase 5 (Response Service) → Phase 7 (Handlers) → Phase 8 (E2E)
                                                                                                   ⟋
                                              Phase 9 (Tests) ────────────────────────────────────
                                                      ↓
                                              Phase 10 (Integration)
```

## Estimated Scope per Phase

| Phase | Status | Files | Complexity | Testing Requirement |
|-------|--------|-------|------------|---------------------|
| 1 | ✅ Complete | 2 | Low | Unit tests |
| 2 | ✅ Complete | 2 | Low | N/A (interfaces) |
| 3 | ✅ Complete | 2 | Low | N/A (interfaces) |
| 4 | ✅ Complete | 2 | Medium | Unit + Integration |
| 5 | ✅ Complete | 2 | High | Unit + Integration |
| 6 | ✅ Complete | 3 | Medium | Integration |
| 7 | ⏳ In Progress | 2 | High | Integration |
| 8 | ⏳ In Progress | Multiple | High | E2E |
| 9 | 📋 Pending | Multiple | Medium | All types |
| 10 | 📋 Pending | Config | Medium | Manual + E2E |

## Risk Areas & Considerations

1. ✅ **Authorization:** Implemented - queue admins AND members can accept, only admins can modify
2. **Concurrency:** Multiple users accepting same request simultaneously (not yet handled)
3. **Slack Rate Limits:** Sending many notifications (not yet optimized)
4. **Error Recovery:** What happens if notification fails but request is created? (not yet handled)
5. ✅ **Queue Admin/Member Management:** Stored as JSON arrays in database, managed through domain methods

## Recent Updates (Current Session)

### Domain Layer Enhancements
- Added **member support** to Queue entity alongside admins
- Members can accept requests but cannot modify queue settings
- Updated authorization logic to check both AdminIds and MemberIds
- Fixed all Save() methods to use GORM's upsert behavior

### Service Layer Completion
- **QueueService**: Fully implemented with CreateQueue, admin/member management, authorization
- **RequestResponseService**: Fully implemented with accept/reject/complete flows and notifications
- Both services use proper authorization checks and send notifications via SlackMessenger

### Adapter Improvements
- **SlackMessenger**: New adapter for DMs, channel messages, ephemeral messages
- **SlackViewRenderer**:
  - Request form with dynamic recipient type selection (working)
  - Queue form with multi-user admin selector (working)
  - Request notifications still pending
- Fixed all constants to use proper naming instead of placeholders

### Dependency Injection
- All services now properly wired in main.go
- Ready for handler integration

### Next Critical Steps
1. Complete view submission handler to create requests/queues from forms
2. Implement request notification rendering with Accept/Reject buttons
3. Wire button handlers to call RequestResponseService methods
4. Test end-to-end flows
