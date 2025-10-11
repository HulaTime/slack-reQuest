package loghandlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"request/pkg/loghandlers"
	"testing"
)

func TestAppendLogCtx(t *testing.T) {
	t.Run("should add attribute to empty context", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx, slog.String("key1", "value1"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "value1", logEntry["key1"])
	})

	t.Run("should add multiple attributes sequentially", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx, slog.String("key1", "value1"))
		ctx = loghandlers.AppendLogCtx(ctx, slog.String("key2", "value2"))
		ctx = loghandlers.AppendLogCtx(ctx, slog.Int("key3", 42))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "value1", logEntry["key1"])
		assertEqual(t, "value2", logEntry["key2"])
		assertEqual(t, float64(42), logEntry["key3"])
	})

	t.Run("should handle nil parent context", func(t *testing.T) {
		ctx := loghandlers.AppendLogCtx(nil, slog.String("key1", "value1"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "value1", logEntry["key1"])
	})

	t.Run("should preserve existing context values", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), "someKey", "someValue")
		ctx = loghandlers.AppendLogCtx(ctx, slog.String("key1", "value1"))

		assertEqual(t, "someValue", ctx.Value("someKey"))
	})
}

func TestAppendToLogGroup(t *testing.T) {
	t.Run("should create new group when it doesn't exist", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendToLogGroup(ctx, "myGroup",
			slog.String("key1", "value1"),
			slog.Int("key2", 123))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		group, ok := logEntry["myGroup"].(map[string]any)
		if !ok {
			t.Fatalf("Expected myGroup to be a map, got %T", logEntry["myGroup"])
		}
		assertEqual(t, "value1", group["key1"])
		assertEqual(t, float64(123), group["key2"])
	})

	t.Run("should append to existing group", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx,
			slog.Group("myGroup", slog.String("initial", "first")))
		ctx = loghandlers.AppendToLogGroup(ctx, "myGroup",
			slog.String("added", "second"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		group, ok := logEntry["myGroup"].(map[string]any)
		if !ok {
			t.Fatalf("Expected myGroup to be a map, got %T", logEntry["myGroup"])
		}
		assertEqual(t, "first", group["initial"])
		assertEqual(t, "second", group["added"])
	})

	t.Run("should append multiple attributes to existing group", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx,
			slog.Group("myGroup", slog.String("key1", "value1")))
		ctx = loghandlers.AppendToLogGroup(ctx, "myGroup",
			slog.String("key2", "value2"),
			slog.String("key3", "value3"),
			slog.Bool("key4", true))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		group, ok := logEntry["myGroup"].(map[string]any)
		if !ok {
			t.Fatalf("Expected myGroup to be a map, got %T", logEntry["myGroup"])
		}
		assertEqual(t, "value1", group["key1"])
		assertEqual(t, "value2", group["key2"])
		assertEqual(t, "value3", group["key3"])
		assertEqual(t, true, group["key4"])
	})

	t.Run("should not affect other groups", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx,
			slog.Group("group1", slog.String("key1", "value1")))
		ctx = loghandlers.AppendLogCtx(ctx,
			slog.Group("group2", slog.String("key2", "value2")))
		ctx = loghandlers.AppendToLogGroup(ctx, "group1",
			slog.String("key3", "value3"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())

		group1, ok := logEntry["group1"].(map[string]any)
		if !ok {
			t.Fatalf("Expected group1 to be a map, got %T", logEntry["group1"])
		}
		assertEqual(t, "value1", group1["key1"])
		assertEqual(t, "value3", group1["key3"])

		group2, ok := logEntry["group2"].(map[string]any)
		if !ok {
			t.Fatalf("Expected group2 to be a map, got %T", logEntry["group2"])
		}
		assertEqual(t, "value2", group2["key2"])
		if _, exists := group2["key3"]; exists {
			t.Errorf("Expected group2 to not have key3")
		}
	})

	t.Run("should handle nil parent context", func(t *testing.T) {
		ctx := loghandlers.AppendToLogGroup(nil, "myGroup",
			slog.String("key1", "value1"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		group, ok := logEntry["myGroup"].(map[string]any)
		if !ok {
			t.Fatalf("Expected myGroup to be a map, got %T", logEntry["myGroup"])
		}
		assertEqual(t, "value1", group["key1"])
	})

	t.Run("should handle empty attributes slice", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendToLogGroup(ctx, "myGroup")

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		if group, ok := logEntry["myGroup"]; ok {
			if groupMap, isMap := group.(map[string]any); isMap {
				assertEqual(t, 0, len(groupMap))
			}
		}
	})
}

func TestContextLogHandlerHandle(t *testing.T) {
	t.Run("should add context attributes to log record", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx, slog.String("requestId", "12345"))
		ctx = loghandlers.AppendLogCtx(ctx, slog.String("userId", "user-abc"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "processing request")

		logEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "INFO", logEntry["level"])
		assertEqual(t, "processing request", logEntry["msg"])
		assertEqual(t, "12345", logEntry["requestId"])
		assertEqual(t, "user-abc", logEntry["userId"])
	})

	t.Run("should handle context without attributes", func(t *testing.T) {
		ctx := context.Background()

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "test message")

		logEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "INFO", logEntry["level"])
		assertEqual(t, "test message", logEntry["msg"])
	})

	t.Run("should preserve log level", func(t *testing.T) {
		ctx := loghandlers.AppendLogCtx(context.Background(), slog.String("key", "value"))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})

		logger.DebugContext(ctx, "debug message")
		debugEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "DEBUG", debugEntry["level"])

		handler.buf.Reset()
		logger.ErrorContext(ctx, "error message")
		errorEntry := parseLogOutput(t, handler.buf.String())
		assertEqual(t, "ERROR", errorEntry["level"])
	})

	t.Run("should work with grouped attributes", func(t *testing.T) {
		ctx := context.Background()
		ctx = loghandlers.AppendLogCtx(ctx,
			slog.Group("request",
				slog.String("method", "POST"),
				slog.String("path", "/api/test")))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "handling request")

		logEntry := parseLogOutput(t, handler.buf.String())
		request, ok := logEntry["request"].(map[string]any)
		if !ok {
			t.Fatalf("Expected request to be a map, got %T", logEntry["request"])
		}
		assertEqual(t, "POST", request["method"])
		assertEqual(t, "/api/test", request["path"])
	})
}

func TestIntegrationScenario(t *testing.T) {
	t.Run("should handle complex real-world scenario", func(t *testing.T) {
		ctx := context.Background()

		ctx = loghandlers.AppendLogCtx(ctx,
			slog.Group("request", slog.String("id", "req-123")))

		ctx = loghandlers.AppendToLogGroup(ctx, "request",
			slog.String("method", "POST"),
			slog.String("path", "/slack/commands"))

		ctx = loghandlers.AppendLogCtx(ctx, slog.String("userId", "U12345"))

		ctx = loghandlers.AppendToLogGroup(ctx, "request",
			slog.Int("statusCode", 200))

		handler := captureHandler()
		logger := slog.New(&loghandlers.ContextLogHandler{Handler: handler})
		logger.InfoContext(ctx, "request completed")

		logEntry := parseLogOutput(t, handler.buf.String())

		assertEqual(t, "request completed", logEntry["msg"])
		assertEqual(t, "U12345", logEntry["userId"])

		request, ok := logEntry["request"].(map[string]any)
		if !ok {
			t.Fatalf("Expected request to be a map, got %T", logEntry["request"])
		}
		assertEqual(t, "req-123", request["id"])
		assertEqual(t, "POST", request["method"])
		assertEqual(t, "/slack/commands", request["path"])
		assertEqual(t, float64(200), request["statusCode"])
	})
}

type captureHandlerImpl struct {
	buf *bytes.Buffer
	h   slog.Handler
}

func captureHandler() *captureHandlerImpl {
	buf := &bytes.Buffer{}
	return &captureHandlerImpl{
		buf: buf,
		h:   slog.NewJSONHandler(buf, &slog.HandlerOptions{Level: slog.LevelDebug}),
	}
}

func (c *captureHandlerImpl) Enabled(ctx context.Context, level slog.Level) bool {
	return c.h.Enabled(ctx, level)
}

func (c *captureHandlerImpl) Handle(ctx context.Context, r slog.Record) error {
	return c.h.Handle(ctx, r)
}

func (c *captureHandlerImpl) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &captureHandlerImpl{
		buf: c.buf,
		h:   c.h.WithAttrs(attrs),
	}
}

func (c *captureHandlerImpl) WithGroup(name string) slog.Handler {
	return &captureHandlerImpl{
		buf: c.buf,
		h:   c.h.WithGroup(name),
	}
}

func parseLogOutput(t *testing.T, output string) map[string]any {
	t.Helper()
	var result map[string]any
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Fatalf("Failed to parse log output: %v\nOutput: %s", err, output)
	}
	return result
}

func assertEqual(t *testing.T, expected, actual any) {
	t.Helper()
	if expected != actual {
		t.Errorf("Expected %v (type %T), got %v (type %T)", expected, expected, actual, actual)
	}
}
