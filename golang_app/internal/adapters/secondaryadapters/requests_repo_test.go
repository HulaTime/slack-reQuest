//go:build integration
// +build integration

package secondaryadapters_test

import (
	"context"
	"request/internal/adapters/secondaryadapters"
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

func TestRequestWriter(t *testing.T) {
	ctx := context.Background()

	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupIds {
			db.Delete(secondaryadapters.RequestDTO{ID: id})
		}
	})

	testId, testTitle, testCreatedBy, testRecipientId, testRecipientType := "testid", "test-request", "createdById", "test-recipient-id", domain.RequestRecipientUser
	cleanupIds = append(cleanupIds, testId)

	rw := secondaryadapters.NewRequestsWriter(db)
	r, err := domain.NewRequest(testId, testTitle, testCreatedBy, &domain.RequestRecipient{ID: testRecipientId, Type: testRecipientType})
	if err != nil {
		t.Fatalf("Failed to generate a new request struct: %v", err)
	}

	err = rw.Save(ctx, &r)
	if err != nil {
		t.Fatalf("Failed to save a new request: %v", err)
	}

	var rdto secondaryadapters.RequestDTO
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

func TestRequestReader(t *testing.T) {}
