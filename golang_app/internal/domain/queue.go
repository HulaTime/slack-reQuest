package domain

import (
	"errors"
	"time"
)

type Queue struct {
	ID          string
	Name        string
	Description string
	CreatedById string
	AdminIds    []string
	MemberIds   []string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewQueue(queueId string, name string, createdById string) Queue {
	return Queue{
		ID:          queueId,
		Name:        name,
		CreatedById: createdById,
		AdminIds:    []string{createdById},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

func (q *Queue) AddAdmin(userId string) error {
	if q.IsAdmin(userId) {
		return errors.New("user is already an admin of this queue")
	}

	q.AdminIds = append(q.AdminIds, userId)
	q.UpdatedAt = time.Now()
	return nil
}

func (q *Queue) RemoveAdmin(userId string) error {
	if userId == q.CreatedById {
		return errors.New("cannot remove the queue creator as admin")
	}

	if !q.IsAdmin(userId) {
		return errors.New("user is not an admin of this queue")
	}

	for i, adminId := range q.AdminIds {
		if adminId == userId {
			q.AdminIds = append(q.AdminIds[:i], q.AdminIds[i+1:]...)
			q.UpdatedAt = time.Now()
			return nil
		}
	}

	return errors.New("failed to remove admin")
}

func (q *Queue) IsAdmin(userId string) bool {
	for _, adminId := range q.AdminIds {
		if adminId == userId {
			return true
		}
	}
	return false
}

func (q *Queue) AddMember(userId string) error {
	if q.IsMember(userId) {
		return errors.New("user is already a member of this queue")
	}

	q.MemberIds = append(q.MemberIds, userId)
	q.UpdatedAt = time.Now()
	return nil
}

func (q *Queue) RemoveMember(userId string) error {
	if !q.IsMember(userId) {
		return errors.New("user is not a member of this queue")
	}

	for i, memberId := range q.MemberIds {
		if memberId == userId {
			q.MemberIds = append(q.MemberIds[:i], q.MemberIds[i+1:]...)
			q.UpdatedAt = time.Now()
			return nil
		}
	}

	return errors.New("failed to remove member")
}

func (q *Queue) IsMember(userId string) bool {
	for _, memberId := range q.MemberIds {
		if memberId == userId {
			return true
		}
	}
	return false
}

func (q *Queue) CanRespondToRequests(userId string) bool {
	return q.IsAdmin(userId) || q.IsMember(userId)
}

func (q *Queue) CanBeModifiedBy(userId string) bool {
	return q.IsAdmin(userId)
}
