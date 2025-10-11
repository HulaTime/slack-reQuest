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

var cleanupGroupIds []string

func SeedGroups(t *testing.T, db *gorm.DB, groups []*dbadapter.GroupDTO) {
	t.Helper()

	for _, dto := range groups {
		if err := db.Create(dto).Error; err != nil {
			t.Fatalf("Failed to insert group to the db during seeding: %v", err)
		}
		cleanupGroupIds = append(cleanupGroupIds, dto.ID)
	}
}

func TestGroupWriter(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupGroupIds {
			db.Delete(dbadapter.GroupDTO{ID: id})
		}
	})

	testId, testName, testCreatedBy :=
		"test-group-id", "Test Group", "creator-id"
	cleanupGroupIds = append(cleanupGroupIds, testId)

	gw := dbadapter.NewGroupsWriter(db)
	g := domain.NewGroup(testId, testName)
	g.CreatedById = testCreatedBy
	g.Description = "Test Description"

	err = gw.Save(context.Background(), &g)
	if err != nil {
		t.Fatalf("Failed to save a new group: %v", err)
	}

	var gdto dbadapter.GroupDTO
	db.First(&gdto, "id = ?", testId)

	AssertEquals(t, testId, gdto.ID)
	AssertEquals(t, testName, gdto.Name)
	AssertEquals(t, testCreatedBy, gdto.CreatedById)
	AssertEquals(t, "Test Description", gdto.Description)

	if gdto.CreatedAt.IsZero() || gdto.UpdatedAt.IsZero() {
		t.Fatalf("Timestamps have not been set on the persisted group")
	}
}

func TestGroupReader(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("../../../db/dev.db"))
	if err != nil {
		t.Fatalf("Failed to initialise db connection: %v", err)
	}

	t.Cleanup(func() {
		for _, id := range cleanupGroupIds {
			db.Delete(dbadapter.GroupDTO{ID: id})
		}
	})

	SeedGroups(t, db, []*dbadapter.GroupDTO{
		{
			ID: "group-1", Name: "Group 1", CreatedById: "creator-1", Description: "First group",
		},
		{
			ID: "group-2", Name: "Group 2", CreatedById: "creator-1", Description: "Second group",
		},
		{
			ID: "group-3", Name: "Group 3", CreatedById: "creator-2", Description: "Third group",
		},
	})

	gr := dbadapter.NewGroupsReader(db)

	t.Run("GetById", func(t *testing.T) {
		t.Run("should return the expected group when the supplied group id exists", func(t *testing.T) {
			group1, err := gr.GetById(context.Background(), "group-1")
			if err != nil {
				t.Fatalf("Failed to get group by id: %v", err)
			}
			AssertEquals(t, "Group 1", group1.Name)
			AssertEquals(t, "First group", group1.Description)
		})

		t.Run("should return an error when the supplied group id does not exist", func(t *testing.T) {
			_, err := gr.GetById(context.Background(), "nonexistent")
			if err == nil {
				t.Fatalf("Expected GetById to return an error when the group does not exist but it did not")
			}
		})
	})

	t.Run("FindByCreatedById", func(t *testing.T) {
		t.Run("should return all groups created by the supplied user id", func(t *testing.T) {
			groups, err := gr.FindByCreatedById(context.Background(), "creator-1")
			if err != nil {
				t.Fatalf("Failed to find groups by created_by_id: %v", err)
			}
			AssertEquals(t, 2, len(groups))
		})

		t.Run("should return an empty slice when no groups match", func(t *testing.T) {
			groups, err := gr.FindByCreatedById(context.Background(), "nonexistent")
			if err != nil {
				t.Fatalf("Failed to find groups by created_by_id: %v", err)
			}
			AssertEquals(t, 0, len(groups))
		})
	})

	t.Run("FindAll", func(t *testing.T) {
		t.Run("should return all groups", func(t *testing.T) {
			groups, err := gr.FindAll(context.Background())
			if err != nil {
				t.Fatalf("Failed to find all groups: %v", err)
			}
			if len(groups) < 3 {
				t.Fatalf("Expected at least 3 groups, got %d", len(groups))
			}
		})
	})

}
