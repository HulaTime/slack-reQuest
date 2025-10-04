package domain

import "time"

type Queue struct {
	ID          string
	Name        string
	Description string
	CreatedById string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewQueue(queueId string, name string) Queue {
	return Queue{
		ID:        queueId,
		Name:      name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}
