#!/bin/bash

# Deployment script for Duunoii Video Platform
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="duunoii"

echo "🚀 Deploying ${PROJECT_NAME} to ${ENVIRONMENT}..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if environment file exists
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file $ENV_FILE not found!"
    exit 1
fi

print_status "Environment file found: $ENV_FILE"

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running!"
    exit 1
fi

# Check if required environment variables are set
required_vars=("DATABASE_URL" "JWT_SECRET" "POSTGRES_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_status "All required environment variables are set"

# Build and deploy
print_status "Building Docker images..."

# Build API image
docker build -t ${PROJECT_NAME}-api:latest -f infrastructure/Dockerfile.api ./api

# Build Web image  
docker build -t ${PROJECT_NAME}-web:latest -f infrastructure/Dockerfile.web ./web

print_status "Docker images built successfully"

# Stop existing containers (if any)
print_warning "Stopping existing containers..."
docker-compose -f infrastructure/docker-compose.prod.yml down || true

# Start new containers
print_status "Starting new containers..."
docker-compose -f infrastructure/docker-compose.prod.yml --env-file $ENV_FILE up -d

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
docker-compose -f infrastructure/docker-compose.prod.yml exec api npm run migration:run

# Health check
print_status "Performing health checks..."
sleep 5

# Check API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "API is healthy"
else
    print_error "API health check failed"
    exit 1
fi

# Check Web health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Web app is healthy"
else
    print_error "Web app health check failed"
    exit 1
fi

print_status "Deployment completed successfully!"
print_status "Web app: http://localhost:3000"
print_status "API: http://localhost:3001"

# Show running containers
print_status "Running containers:"
docker-compose -f infrastructure/docker-compose.prod.yml ps