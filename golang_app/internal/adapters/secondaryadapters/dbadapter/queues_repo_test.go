//go:build integration
// +build integration

package dbadapter_test

import (
	"context"
	"request/internal/adapters/secondaryadapters/dbadapter"
	"request/internal/domain"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var cleanupQueueIds []string

func SeedQueues(t *testing.T, db *gorm.DB, queues []*dbadapter.QueueDTO) {
	t.Helper()

	for _, dto := range queues {
		if err := db.Create(dto).Error; err != nil {
			t.Fatalf("Failed to insert queue to the db during seeding: %v", err)
		}
		cleanupQueueIds = append(cleanupQueueIds, dto.ID)
	}
}

func TestQueueWriter(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupQueueIds {
			db.Delete(dbadapter.QueueDTO{ID: id})
		}
	})

	testId, testName, testCreatedBy :=
		"test-queue-id", "Test Queue", "creator-id"
	cleanupQueueIds = append(cleanupQueueIds, testId)

	qw := dbadapter.NewQueuesWriter(db)
	q := domain.NewQueue(testId, testName)
	q.CreatedById = testCreatedBy
	q.Description = "Test Description"

	err = qw.Save(context.Background(), &q)
	if err != nil {
		t.Fatalf("Failed to save a new queue: %v", err)
	}

	var qdto dbadapter.QueueDTO
	db.First(&qdto, "id = ?", testId)

	AssertEquals(t, testId, qdto.ID)
	AssertEquals(t, testName, qdto.Name)
	AssertEquals(t, testCreatedBy, qdto.CreatedById)
	AssertEquals(t, "Test Description", qdto.Description)

	if qdto.CreatedAt.IsZero() || qdto.UpdatedAt.IsZero() {
		t.Fatalf("Timestamps have not been set on the persisted queue")
	}
}

func TestQueueReader(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupQueueIds {
			db.Delete(dbadapter.QueueDTO{ID: id})
		}
	})

	SeedQueues(t, db, []*dbadapter.QueueDTO{
		{
			ID: "queue-1", Name: "Queue 1", CreatedById: "creator-1", Description: "First queue",
		},
		{
			ID: "queue-2", Name: "Queue 2", CreatedById: "creator-1", Description: "Second queue",
		},
		{
			ID: "queue-3", Name: "Queue 3", CreatedById: "creator-2", Description: "Third queue",
		},
	})

	qr := dbadapter.NewQueuesReader(db)

	t.Run("GetById", func(t *testing.T) {
		t.Run("should return the expected queue when the supplied queue id exists", func(t *testing.T) {
			queue1, err := qr.GetById(context.Background(), "queue-1")
			if err != nil {
				t.Fatalf("Failed to get queue by id: %v", err)
			}
			AssertEquals(t, "Queue 1", queue1.Name)
			AssertEquals(t, "First queue", queue1.Description)
		})

		t.Run("should return an error when the supplied queue id does not exist", func(t *testing.T) {
			_, err := qr.GetById(context.Background(), "nonexistent")
			if err == nil {
				t.Fatalf("Expected GetById to return an error when the queue does not exist but it did not")
			}
		})
	})

	t.Run("FindByCreatedById", func(t *testing.T) {
		t.Run("should return all queues created by the supplied user id", func(t *testing.T) {
			queues, err := qr.FindByCreatedById(context.Background(), "creator-1")
			if err != nil {
				t.Fatalf("Failed to find queues by created_by_id: %v", err)
			}
			AssertEquals(t, 2, len(queues))
		})

		t.Run("should return an empty slice when no queues match", func(t *testing.T) {
			queues, err := qr.FindByCreatedById(context.Background(), "nonexistent")
			if err != nil {
				t.Fatalf("Failed to find queues by created_by_id: %v", err)
			}
			AssertEquals(t, 0, len(queues))
		})
	})

	t.Run("FindAll", func(t *testing.T) {
		t.Run("should return all queues", func(t *testing.T) {
			queues, err := qr.FindAll(context.Background())
			if err != nil {
				t.Fatalf("Failed to find all queues: %v", err)
			}
			if len(queues) < 3 {
				t.Fatalf("Expected at least 3 queues, got %d", len(queues))
			}
		})
	})

}
