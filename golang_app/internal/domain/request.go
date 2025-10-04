package domain

import "time"

type RequestStatus string

type RequestRecipientType string

const (
	RequestPending   RequestStatus = "pending"
	RequestAccepted  RequestStatus = "accepted"
	RequestRejected  RequestStatus = "rejected"
	RequestCompleted RequestStatus = "completed"
)
const (
	RequestRecipientUser  RequestRecipientType = "user"
	RequestRecipientGroup RequestRecipientType = "group"
	RequestRecipientQueue RequestRecipientType = "queue"
)

func (rs RequestStatus) Valid() bool {
	switch rs {
	case RequestPending, RequestAccepted, RequestRejected, RequestCompleted:
		return true
	default:
		return false
	}
}

func (rt RequestRecipientType) Valid() bool {
	switch rt {
	case RequestRecipientUser, RequestRecipientGroup, RequestRecipientQueue:
		return true
	default:
		return false
	}
}

type RequestRecipient struct {
	ID   string
	Type RequestRecipientType
}

type Request struct {
	ID           string
	Title        string
	Description  string
	AcceptedByID string
	CreatedByID  string
	Recipient    RequestRecipient
	Status       RequestStatus
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func NewRequest(requestId string, title string, createdById string) Request {
	r := Request{
		ID:          requestId,
		Title:       title,
		CreatedByID: createdById,
		Status:      RequestPending,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	return r
}
