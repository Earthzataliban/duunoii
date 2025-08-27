# Infrastructure Configuration

This directory contains all infrastructure-related files for deploying the Duunoii video platform.

## Files Overview

### Docker Configuration
- `docker-compose.prod.yml` - Production Docker Compose configuration
- `Dockerfile.api` - API service Docker image
- `Dockerfile.web` - Web app Docker image

### Nginx Configuration
- `nginx.conf` - Reverse proxy configuration with SSL, rate limiting, and video streaming optimization

### Environment Configuration
- `.env.production` - Template for production environment variables

### Deployment Scripts
- `deploy.sh` - Automated deployment script
- `backup.sh` - Database and video backup script

## Quick Deployment

### 1. VPS Setup (Budget-Friendly)

```bash
# On your VPS (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose nginx certbot

# Clone your repository
git clone <your-repo-url>
cd duunoii

# Copy and configure environment
cp infrastructure/.env.production infrastructure/.env.prod
# Edit infrastructure/.env.prod with your actual values

# Deploy
cd infrastructure
./deploy.sh production
```

### 2. SSL Certificate Setup

```bash
# Install Let's Encrypt certificate
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com

# Copy certificates to Docker volume
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
```

### 3. Database Migration

```bash
# Run initial database migration
docker-compose -f docker-compose.prod.yml exec api npm run migration:run

# Create first admin user (optional)
docker-compose -f docker-compose.prod.yml exec api npm run db:seed
```

## Monitoring

### Health Checks
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
```

### Resource Usage
```bash
# Monitor resource usage
docker stats
```

## Backup & Restore

### Create Backup
```bash
./backup.sh
```

### Restore Database
```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec postgres psql \
  -U duunoii_prod -d duunoii_prod < backup/database_YYYYMMDD_HHMMSS.sql
```

## Budget-Friendly Deployment Options

### 1. Single VPS (Recommended)
- **Provider**: DigitalOcean, Linode, Vultr
- **Specs**: 4GB RAM, 2 CPU, 80GB SSD
- **Cost**: ~$20/month

### 2. Free Tier Cloud
- **Frontend**: Vercel (free)
- **Backend**: Railway (free tier)
- **Database**: PlanetScale (free tier)

### 3. Self-Hosted Free
- **Hardware**: Old laptop/PC as server
- **OS**: Ubuntu Server
- **Network**: Cloudflare Tunnel for public access

## Security Checklist

- [ ] Change default passwords in `.env.prod`
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable firewall (ufw on Ubuntu)
- [ ] Setup SSL certificates
- [ ] Configure rate limiting
- [ ] Enable automatic security updates
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## Scaling Options

When you outgrow single VPS:

1. **Load Balancer**: Add nginx load balancer
2. **Database**: Separate database server
3. **CDN**: CloudFlare Pro for global video delivery
4. **Storage**: Move to cloud storage (AWS S3)
5. **Processing**: Separate video processing workers

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 80, 443, 3000, 3001 are available
2. **Database connection**: Check DATABASE_URL format
3. **File permissions**: Ensure uploads directory is writable
4. **Memory issues**: Increase VPS RAM or add swap

### Logs Location
```bash
# Application logs
docker-compose logs [service-name]

# Nginx logs
docker-compose exec nginx tail -f /var/log/nginx/access.log
docker-compose exec nginx tail -f /var/log/nginx/error.log
```