package secondaryadapters

import (
	"context"
	"fmt"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
	"time"

	"gorm.io/gorm"
)

type GroupDTO struct {
	ID          string    `gorm:"not null;primaryKey;type:varchar;size:50"`
	Name        string    `gorm:"not null;type:varchar;size:255"`
	Description string    `gorm:"type:varchar;size:255"`
	CreatedById string    `gorm:"not null;index"`
	CreatedAt   time.Time `gorm:"not null"`
	UpdatedAt   time.Time `gorm:"not null"`
}

func (GroupDTO) TableName() string {
	return "groups"
}

func (dto *GroupDTO) ToDomain() *domain.Group {
	return &domain.Group{
		ID:          dto.ID,
		Name:        dto.Name,
		Description: dto.Description,
		CreatedById: dto.CreatedById,
		CreatedAt:   dto.CreatedAt,
		UpdatedAt:   dto.UpdatedAt,
	}
}

func NewGroupDTO(group *domain.Group) *GroupDTO {
	return &GroupDTO{
		ID:          group.ID,
		Name:        group.Name,
		Description: group.Description,
		CreatedById: group.CreatedById,
		CreatedAt:   group.CreatedAt,
		UpdatedAt:   group.UpdatedAt,
	}
}

type GroupsWriter struct {
	db *gorm.DB
}

func NewGroupsWriter(db *gorm.DB) *GroupsWriter {
	return &GroupsWriter{db: db}
}

func (w *GroupsWriter) Save(ctx context.Context, group *domain.Group) error {
	dto := NewGroupDTO(group)
	if err := w.db.WithContext(ctx).Create(dto).Error; err != nil {
		return fmt.Errorf("failed to save group: %w", err)
	}
	return nil
}

type GroupsReader struct {
	db *gorm.DB
}

func NewGroupsReader(db *gorm.DB) *GroupsReader {
	return &GroupsReader{db: db}
}

func (r *GroupsReader) GetById(ctx context.Context, groupId string) (*domain.Group, error) {
	var dto GroupDTO
	if err := r.db.WithContext(ctx).First(&dto, "id = ?", groupId).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("group not found: %s", groupId)
		}
		return nil, fmt.Errorf("failed to get group: %w", err)
	}
	return dto.ToDomain(), nil
}

func (r *GroupsReader) FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Group, error) {
	var dtos []GroupDTO
	if err := r.db.WithContext(ctx).Find(&dtos, "created_by_id = ?", createdById).Error; err != nil {
		return nil, fmt.Errorf("failed to find groups by created_by_id: %w", err)
	}

	groups := make([]*domain.Group, len(dtos))
	for i, dto := range dtos {
		groups[i] = dto.ToDomain()
	}
	return groups, nil
}

func (r *GroupsReader) FindAll(ctx context.Context) ([]*domain.Group, error) {
	var dtos []GroupDTO
	if err := r.db.WithContext(ctx).Find(&dtos).Error; err != nil {
		return nil, fmt.Errorf("failed to find all groups: %w", err)
	}

	groups := make([]*domain.Group, len(dtos))
	for i, dto := range dtos {
		groups[i] = dto.ToDomain()
	}
	return groups, nil
}

var _ secondaryports.ForStoringGroups = (*GroupsWriter)(nil)
var _ secondaryports.ForReadingGroups = (*GroupsReader)(nil)
