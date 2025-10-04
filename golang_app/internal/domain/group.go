package domain

import "time"

type Group struct {
	ID          string
	Name        string
	Description string
	CreatedById string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewGroup(groupId string, name string) Group {
	return Group{
		ID:        groupId,
		Name:      name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}
