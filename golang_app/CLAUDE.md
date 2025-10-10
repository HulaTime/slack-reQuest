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
