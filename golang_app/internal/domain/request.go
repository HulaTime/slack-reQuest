package domain

import (
	"errors"
	"time"
)

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

func (r *RequestRecipient) Valid() bool {
	if !r.Type.Valid() || r.ID == "" {
		return false
	}
	return true
}

type Request struct {
	ID           string
	Title        string
	Description  string
	AcceptedByID string
	CreatedByID  string
	Recipient    *RequestRecipient
	Status       RequestStatus
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func NewRequest(requestId string, title string, createdById string, recipient *RequestRecipient) (Request, error) {
	if !recipient.Valid() {
		return Request{}, errors.New("RequestRecipient is not valid")
	}

	r := Request{
		ID:          requestId,
		Title:       title,
		CreatedByID: createdById,
		Recipient:   recipient,
		Status:      RequestPending,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	return r, nil
}
