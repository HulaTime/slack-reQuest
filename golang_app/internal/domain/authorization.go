package domain

type AuthorizationContext struct {
	Request *Request
	Queue   *Queue
	ActorID string
}

func NewAuthorizationContext(request *Request, queue *Queue, actorID string) *AuthorizationContext {
	return &AuthorizationContext{
		Request: request,
		Queue:   queue,
		ActorID: actorID,
	}
}

func (ctx *AuthorizationContext) CanAccept() bool {
	if ctx.Request == nil || ctx.ActorID == "" {
		return false
	}

	if ctx.Request.CreatedByID == ctx.ActorID {
		return false
	}

	switch ctx.Request.Recipient.Type {
	case RequestRecipientUser:
		return ctx.Request.Recipient.ID == ctx.ActorID

	case RequestRecipientChannel:
		return true

	case RequestRecipientQueue:
		if ctx.Queue == nil {
			return false
		}
		return ctx.Queue.CanRespondToRequests(ctx.ActorID)

	default:
		return false
	}
}

func (ctx *AuthorizationContext) CanComplete() bool {
	if ctx.Request == nil || ctx.ActorID == "" {
		return false
	}

	return ctx.Request.CanBeCompletedBy(ctx.ActorID)
}

func (ctx *AuthorizationContext) CanReject() bool {
	return ctx.CanAccept() || ctx.CanComplete()
}
