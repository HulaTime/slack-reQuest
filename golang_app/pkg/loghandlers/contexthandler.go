package loghandlers

import (
	"context"
	"log/slog"
)

type slogFields struct{}

type ContextLogHandler struct {
	slog.Handler
}

func (h ContextLogHandler) Handle(ctx context.Context, r slog.Record) error {
	// Use instance of package local type as the log fields key to avoid external usage overwriting log fields with the same key if it was a string
	if attrs, ok := ctx.Value(slogFields{}).([]slog.Attr); ok {
		for _, v := range attrs {
			r.AddAttrs(v)
		}
	}

	return h.Handler.Handle(ctx, r)
}

func AppendLogCtx(parentCtx context.Context, attrs ...slog.Attr) context.Context {
	if parentCtx == nil {
		parentCtx = context.Background()
	}

	if v, ok := parentCtx.Value(slogFields{}).([]slog.Attr); ok {
		v = append(v, attrs...)
		return context.WithValue(parentCtx, slogFields{}, v)
	}

	v := []slog.Attr{}
	v = append(v, attrs...)
	return context.WithValue(parentCtx, slogFields{}, v)
}

func AppendToLogGroup(parentCtx context.Context, groupName string, attrs ...slog.Attr) context.Context {
	if parentCtx == nil {
		parentCtx = context.Background()
	}

	existingAttrs, ok := parentCtx.Value(slogFields{}).([]slog.Attr)
	if !ok {
		return context.WithValue(parentCtx, slogFields{}, []slog.Attr{slog.Group(groupName, attrsToAny(attrs)...)})
	}

	updated := make([]slog.Attr, 0, len(existingAttrs))
	groupFound := false

	for _, attr := range existingAttrs {
		if attr.Key == groupName && attr.Value.Kind() == slog.KindGroup {
			groupAttrs := attr.Value.Group()
			groupAttrs = append(groupAttrs, attrs...)
			updated = append(updated, slog.Group(groupName, attrsToAny(groupAttrs)...))
			groupFound = true
		} else {
			updated = append(updated, attr)
		}
	}

	if !groupFound {
		updated = append(updated, slog.Group(groupName, attrsToAny(attrs)...))
	}

	return context.WithValue(parentCtx, slogFields{}, updated)
}

func attrsToAny(attrs []slog.Attr) []any {
	result := make([]any, len(attrs))
	for i, attr := range attrs {
		result[i] = attr
	}
	return result
}
