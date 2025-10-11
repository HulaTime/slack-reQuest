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

var cleanupIds []string

func AssertEquals(t *testing.T, expected any, actual any) {
	t.Helper()

	if expected != actual {
		t.Fatalf("Expected value did not match actual value:\nexpected: %v\nactual: %v", expected, actual)
	}
}

func SeedRequests(t *testing.T, db *gorm.DB, requests []*dbadapter.RequestDTO) {
	t.Helper()

	for _, dto := range requests {
		if err := db.Create(dto).Error; err != nil {
			t.Fatalf("Failed to insert request to the db during seeding: %v", err)
		}
		cleanupIds = append(cleanupIds, dto.ID)
	}
}

func TestRequestWriter(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupIds {
			db.Delete(dbadapter.RequestDTO{ID: id})
		}
	})

	testId, testTitle, testCreatedBy, testRecipientId, testRecipientType :=
		"testid", "test-request", "createdById", "test-recipient-id", domain.RequestRecipientUser
	cleanupIds = append(cleanupIds, testId)

	rw := dbadapter.NewRequestsWriter(db)
	r, err := domain.NewRequest(testId, testTitle, testCreatedBy, &domain.RequestRecipient{ID: testRecipientId, Type: testRecipientType})
	if err != nil {
		t.Fatalf("Failed to generate a new request struct: %v", err)
	}

	err = rw.Save(context.Background(), &r)
	if err != nil {
		t.Fatalf("Failed to save a new request: %v", err)
	}

	var rdto dbadapter.RequestDTO
	db.First(&rdto, "id = ?", testId)

	AssertEquals(t, testId, rdto.ID)
	AssertEquals(t, testTitle, rdto.Title)
	AssertEquals(t, testCreatedBy, rdto.CreatedByID)
	AssertEquals(t, testRecipientId, rdto.RecipientID)
	AssertEquals(t, testRecipientType, domain.RequestRecipientType(rdto.RecipientType))
	AssertEquals(t, "pending", rdto.Status)

	AssertEquals(t, "", rdto.Description)
	AssertEquals(t, "", rdto.AcceptedByID)

	if rdto.CreatedAt.IsZero() || rdto.UpdatedAt.IsZero() {
		t.Fatalf("Timestamps have not been set on the persisted request")
	}
}

func TestRequestReader(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupIds {
			db.Delete(dbadapter.RequestDTO{ID: id})
		}
	})

	SeedRequests(t, db, []*dbadapter.RequestDTO{
		{
			ID: "1", Title: "Request 1", CreatedByID: "tests", RecipientID: "test-r", RecipientType: "user", Status: "pending",
		},
		{
			ID: "2", Title: "Request 2", CreatedByID: "tests", RecipientID: "test-r", RecipientType: "user", Status: "pending",
		},
	})

	rr := dbadapter.NewRequestsReader(db)

	t.Run("GetById", func(t *testing.T) {
		t.Run("should return the expected request when the supplied request id exists", func(t *testing.T) {
			request1, err := rr.GetById(context.Background(), "1")
			if err != nil {
				t.Fatalf("Failed to get request by id: %v", err)
			}
			AssertEquals(t, "Request 1", request1.Title)
		})

		t.Run("should return an error when the supplied request id does not exist", func(t *testing.T) {
			_, err := rr.GetById(context.Background(), "nonexistent")
			if err == nil {
				t.Fatalf("Expected GetById to return an error when the request does not exist but it did not")
			}
		})
	})

	t.Run("FindByCreatedById", func(t *testing.T) {
		t.Run("should return all requests created by the supplied user id", func(t *testing.T) {
			requests, err := rr.FindByCreatedById(context.Background(), "tests")
			if err != nil {
				t.Fatalf("Failed to find requests by created_by_id: %v", err)
			}
			AssertEquals(t, 2, len(requests))
		})

		t.Run("should return an empty slice when no requests match", func(t *testing.T) {
			requests, err := rr.FindByCreatedById(context.Background(), "nonexistent")
			if err != nil {
				t.Fatalf("Failed to find requests by created_by_id: %v", err)
			}
			AssertEquals(t, 0, len(requests))
		})
	})

	t.Run("FindByAcceptedById", func(t *testing.T) {
		SeedRequests(t, db, []*dbadapter.RequestDTO{
			{
				ID: "3", Title: "Request 3", CreatedByID: "other-user", AcceptedByID: "acceptor", RecipientID: "test-r", RecipientType: "user", Status: "accepted",
			},
		})

		t.Run("should return all requests accepted by the supplied user id", func(t *testing.T) {
			requests, err := rr.FindByAcceptedById(context.Background(), "acceptor")
			if err != nil {
				t.Fatalf("Failed to find requests by accepted_by_id: %v", err)
			}
			AssertEquals(t, 1, len(requests))
			AssertEquals(t, "Request 3", requests[0].Title)
		})

		t.Run("should return an empty slice when no requests match", func(t *testing.T) {
			requests, err := rr.FindByAcceptedById(context.Background(), "nonexistent")
			if err != nil {
				t.Fatalf("Failed to find requests by accepted_by_id: %v", err)
			}
			AssertEquals(t, 0, len(requests))
		})
	})

	t.Run("FindByRecipient", func(t *testing.T) {
		SeedRequests(t, db, []*dbadapter.RequestDTO{
			{
				ID: "4", Title: "Request 4", CreatedByID: "user1", RecipientID: "queue-1", RecipientType: "queue", Status: "pending",
			},
			{
				ID: "5", Title: "Request 5", CreatedByID: "user2", RecipientID: "queue-1", RecipientType: "queue", Status: "pending",
			},
		})

		t.Run("should return all requests for the supplied recipient", func(t *testing.T) {
			recipient := domain.RequestRecipient{ID: "queue-1", Type: domain.RequestRecipientQueue}
			requests, err := rr.FindByRecipient(context.Background(), recipient)
			if err != nil {
				t.Fatalf("Failed to find requests by recipient: %v", err)
			}
			AssertEquals(t, 2, len(requests))
		})

		t.Run("should return an empty slice when no requests match", func(t *testing.T) {
			recipient := domain.RequestRecipient{ID: "nonexistent", Type: domain.RequestRecipientQueue}
			requests, err := rr.FindByRecipient(context.Background(), recipient)
			if err != nil {
				t.Fatalf("Failed to find requests by recipient: %v", err)
			}
			AssertEquals(t, 0, len(requests))
		})

		t.Run("should only return requests matching both recipient id and type", func(t *testing.T) {
			recipient := domain.RequestRecipient{ID: "test-r", Type: domain.RequestRecipientUser}
			requests, err := rr.FindByRecipient(context.Background(), recipient)
			if err != nil {
				t.Fatalf("Failed to find requests by recipient: %v", err)
			}
			AssertEquals(t, 3, len(requests))
		})
	})

}
