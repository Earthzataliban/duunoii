#!/bin/bash

# Database backup script for Duunoii
# Usage: ./backup.sh

set -e

PROJECT_NAME="duunoii"
BACKUP_DIR="./backup"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🗄️ Creating database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
    -U ${POSTGRES_USER:-duunoii_prod} \
    -d ${POSTGRES_DB:-duunoii_prod} \
    --no-password \
    > "${BACKUP_DIR}/database_${DATE}.sql"

# Compress backup
gzip "${BACKUP_DIR}/database_${DATE}.sql"

echo "✅ Database backup completed: ${BACKUP_DIR}/database_${DATE}.sql.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "database_*.sql.gz" -mtime +30 -delete

echo "🧹 Old backups cleaned up"

# Backup videos (if not using cloud storage)
if [ -d "../uploads" ]; then
    tar -czf "${BACKUP_DIR}/videos_${DATE}.tar.gz" ../uploads
    echo "✅ Videos backup completed: ${BACKUP_DIR}/videos_${DATE}.tar.gz"
    
    # Keep only last 7 days of video backups
    find $BACKUP_DIR -name "videos_*.tar.gz" -mtime +7 -delete
fi

echo "🎉 Backup process completed!"