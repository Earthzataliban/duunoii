.PHONY: help setup dev build test lint clean docker-up docker-down migrate install

# Default target
help:
	@echo "🚀 Duunoii Video Platform Commands:"
	@echo ""
	@echo "Setup & Development:"
	@echo "  make setup     - One-time setup (Docker + deps + migration + dev)"
	@echo "  make dev       - Start development servers"
	@echo "  make install   - Install all dependencies"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up   - Start Docker services"
	@echo "  make docker-down - Stop Docker services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate     - Run database migrations"
	@echo "  make db-reset    - Reset database"
	@echo "  make db-seed     - Seed database with test data"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build     - Build all projects"
	@echo "  make test      - Run all tests"
	@echo "  make lint      - Run linting"
	@echo ""
	@echo "Utils:"
	@echo "  make clean     - Clean build files"
	@echo "  make logs      - Show Docker logs"

# One-time setup
setup: docker-up install migrate dev

# Development
dev:
	@echo "🚀 Starting development servers..."
	npm run dev

install:
	@echo "📦 Installing dependencies..."
	npm install
	cd api && npm install
	cd web && npm install
	cd shared && npm install

# Docker
docker-up:
	@echo "🐳 Starting Docker services..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	sleep 5

docker-down:
	@echo "🛑 Stopping Docker services..."
	docker compose down

# Database
migrate:
	@echo "🗄️ Running database migrations..."
	cd api && npx prisma generate
	cd api && npx prisma migrate dev

db-reset:
	@echo "🔄 Resetting database..."
	cd api && npx prisma migrate reset --force

db-seed:
	@echo "🌱 Seeding database..."
	cd api && npx prisma db seed

# Build
build:
	@echo "🔨 Building all projects..."
	npm run build

# Test
test:
	@echo "🧪 Running tests..."
	npm run test

lint:
	@echo "✨ Running linting..."
	npm run lint

lint-fix:
	@echo "🔧 Fixing lint issues..."
	npm run lint:fix

format:
	@echo "💅 Formatting code..."
	npm run format

# Logs
logs:
	@echo "📋 Docker logs:"
	docker compose logs -f

# Clean
clean:
	@echo "🧹 Cleaning build files..."
	rm -rf node_modules
	rm -rf api/node_modules api/dist
	rm -rf web/node_modules web/.next web/out
	rm -rf shared/node_modules shared/dist

# Production deployment
deploy:
	@echo "🚀 Deploying to production..."
	cd infrastructure && ./deploy.sh

# Backup
backup:
	@echo "💾 Creating backup..."
	cd infrastructure && ./backup.sh