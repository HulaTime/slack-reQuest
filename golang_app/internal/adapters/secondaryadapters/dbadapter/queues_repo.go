package dbadapter

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"request/internal/app/ports/secondaryports"
	"request/internal/domain"
	"time"

	"gorm.io/gorm"
)

type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	return json.Marshal(s)
}

func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}

	var data []byte
	switch v := value.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return fmt.Errorf("unsupported type for StringSlice: %T", value)
	}

	return json.Unmarshal(data, s)
}

type QueueDTO struct {
	ID          string      `gorm:"not null;primaryKey;type:varchar;size:50"`
	ChannelId   string      `gorm:"index;type:varchar;size:50"`
	Name        string      `gorm:"not null;type:varchar;size:255"`
	Description string      `gorm:"type:varchar;size:255"`
	CreatedById string      `gorm:"not null;index"`
	AdminIds    StringSlice `gorm:"type:json"`
	MemberIds   StringSlice `gorm:"type:json"`
	CreatedAt   time.Time   `gorm:"not null"`
	UpdatedAt   time.Time   `gorm:"not null"`
}

func (QueueDTO) TableName() string {
	return "queues"
}

func (dto *QueueDTO) ToDomain() *domain.Queue {
	return &domain.Queue{
		ID:          dto.ID,
		ChannelId:   dto.ChannelId,
		Name:        dto.Name,
		Description: dto.Description,
		CreatedById: dto.CreatedById,
		AdminIds:    []string(dto.AdminIds),
		MemberIds:   []string(dto.MemberIds),
		CreatedAt:   dto.CreatedAt,
		UpdatedAt:   dto.UpdatedAt,
	}
}

func NewQueueDTO(queue *domain.Queue) *QueueDTO {
	return &QueueDTO{
		ID:          queue.ID,
		ChannelId:   queue.ChannelId,
		Name:        queue.Name,
		Description: queue.Description,
		CreatedById: queue.CreatedById,
		AdminIds:    StringSlice(queue.AdminIds),
		MemberIds:   StringSlice(queue.MemberIds),
		CreatedAt:   queue.CreatedAt,
		UpdatedAt:   queue.UpdatedAt,
	}
}

type QueuesWriter struct {
	db *gorm.DB
}

func NewQueuesWriter(db *gorm.DB) *QueuesWriter {
	return &QueuesWriter{db: db}
}

func (w *QueuesWriter) Save(ctx context.Context, queue *domain.Queue) error {
	dto := NewQueueDTO(queue)
	if err := w.db.WithContext(ctx).Save(dto).Error; err != nil {
		return fmt.Errorf("failed to save queue: %w", err)
	}
	return nil
}

type QueuesReader struct {
	db *gorm.DB
}

func NewQueuesReader(db *gorm.DB) *QueuesReader {
	return &QueuesReader{db: db}
}

func (r *QueuesReader) GetById(ctx context.Context, queueId string) (*domain.Queue, error) {
	var dto QueueDTO
	if err := r.db.WithContext(ctx).First(&dto, "id = ?", queueId).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("queue not found: %s", queueId)
		}
		return nil, fmt.Errorf("failed to get queue: %w", err)
	}
	return dto.ToDomain(), nil
}

func (r *QueuesReader) FindByCreatedById(ctx context.Context, createdById string) ([]*domain.Queue, error) {
	var dtos []QueueDTO
	if err := r.db.WithContext(ctx).Find(&dtos, "created_by_id = ?", createdById).Error; err != nil {
		return nil, fmt.Errorf("failed to find queues by created_by_id: %w", err)
	}

	queues := make([]*domain.Queue, len(dtos))
	for i, dto := range dtos {
		queues[i] = dto.ToDomain()
	}
	return queues, nil
}

func (r *QueuesReader) FindByChannelId(ctx context.Context, channelId string) ([]*domain.Queue, error) {
	var dtos []QueueDTO
	if err := r.db.WithContext(ctx).Find(&dtos, "channel_id = ?", channelId).Error; err != nil {
		return nil, fmt.Errorf("failed to find queues by channel_id: %w", err)
	}

	queues := make([]*domain.Queue, len(dtos))
	for i, dto := range dtos {
		queues[i] = dto.ToDomain()
	}
	return queues, nil
}

func (r *QueuesReader) FindAll(ctx context.Context) ([]*domain.Queue, error) {
	var dtos []QueueDTO
	if err := r.db.WithContext(ctx).Find(&dtos).Error; err != nil {
		return nil, fmt.Errorf("failed to find all queues: %w", err)
	}

	queues := make([]*domain.Queue, len(dtos))
	for i, dto := range dtos {
		queues[i] = dto.ToDomain()
	}
	return queues, nil
}

var _ secondaryports.ForStoringQueues = (*QueuesWriter)(nil)
var _ secondaryports.ForReadingQueues = (*QueuesReader)(nil)
