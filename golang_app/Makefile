.DEFAULT_GOAL := build

# ARCH ?= $(shell uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/')
# Architecture defaults to amd64, can be overridden: make build ARCH=arm64
ARCH ?= amd64 

build:
	GOARCH=$(ARCH) GOOS=linux go build -o ./bin/api-$(ARCH) ./cmd/api/main.go

localstack-up:
	docker-compose up -d

localstack-down:
	docker-compose down

create-tfstate-bucket:
	aws --endpoint-url=http://localhost:4566 s3 mb s3://terraform-state-bucket 2>/dev/null || true

deploy-localstack: build localstack-up create-tfstate-bucket
	cd terraform/deployments/local && tofu init
	cd terraform/deployments/local && tofu apply -auto-approve

deploy-localstack-arm64: localstack-up
	$(MAKE) build ARCH=arm64
	cd terraform/deployments/local && tofu init
	cd terraform/deployments/local && tofu apply -auto-approve

destroy-localstack:
	cd tofu && tofu destroy -auto-approve

test-unit:
	@echo "Running unit tests..."
	go test ./internal/...

test-integration:
	@echo "Running integration tests..."
	go test -count=1 -tags "integration,dev" ./internal/...

clean:
	go clean
	rm -rf ./bin

