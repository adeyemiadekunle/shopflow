# ─── Shopflow Makefile ──────────────────────────────────────────────────────────
.PHONY: help dev build test lint migrate docker-up docker-down docker-logs clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

dev: ## Start backend in watch mode
	cd apps/backend && pnpm run start:dev

build: ## Build backend for production
	cd apps/backend && pnpm run build

test: ## Run unit tests
	cd apps/backend && pnpm run test

test-e2e: ## Run end-to-end tests
	cd apps/backend && pnpm run test:e2e

lint: ## Lint backend code
	cd apps/backend && pnpm run lint

format: ## Format backend code
	cd apps/backend && pnpm run format

migrate-run: ## Run pending TypeORM migrations
	cd apps/backend && pnpm run typeorm migration:run -- -d dist/database/data-source.js

migrate-generate: ## Generate a new migration (use: make migrate-generate name=CreateUsers)
	cd apps/backend && pnpm run typeorm migration:generate -- -d src/database/data-source.ts src/database/migrations/$(name)

migrate-revert: ## Revert last migration
	cd apps/backend && pnpm run typeorm migration:revert -- -d dist/database/data-source.js

docker-up: ## Start all services with Docker Compose
	docker compose up -d

docker-down: ## Stop all Docker Compose services
	docker compose down

docker-logs: ## Follow logs for all services
	docker compose logs -f

docker-rebuild: ## Rebuild the API container
	docker compose up -d --build api

clean: ## Remove build artifacts
	cd apps/backend && rm -rf dist
