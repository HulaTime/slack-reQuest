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

func (r *Request) Accept(userId string) error {
	if r.Status != RequestPending {
		return errors.New("request can only be accepted when in pending status")
	}

	if r.CreatedByID == userId {
		return errors.New("request creator cannot accept their own request")
	}

	r.Status = RequestAccepted
	r.AcceptedByID = userId
	r.UpdatedAt = time.Now()
	return nil
}

func (r *Request) Reject() error {
	if r.Status != RequestPending {
		return errors.New("request can only be rejected when in pending status")
	}

	r.Status = RequestRejected
	r.UpdatedAt = time.Now()
	return nil
}

func (r *Request) Complete() error {
	if r.Status != RequestAccepted {
		return errors.New("request can only be completed when in accepted status")
	}

	r.Status = RequestCompleted
	r.UpdatedAt = time.Now()
	return nil
}

func (r *Request) CanBeRespondedToBy(userId string, queueAdminIds []string, queueMemberIds []string) bool {
	if r.CreatedByID == userId {
		return false
	}

	switch r.Recipient.Type {
	case RequestRecipientUser:
		return r.Recipient.ID == userId
	case RequestRecipientQueue:
		for _, adminId := range queueAdminIds {
			if adminId == userId {
				return true
			}
		}
		for _, memberId := range queueMemberIds {
			if memberId == userId {
				return true
			}
		}
		return false
	case RequestRecipientGroup:
		return true
	default:
		return false
	}
}

func (r *Request) CanBeCompletedBy(userId string) bool {
	if r.Status != RequestAccepted {
		return false
	}
	return r.AcceptedByID == userId || r.CreatedByID == userId
}
