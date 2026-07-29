# Docker & VPS Deployment Guide

This guide covers deploying the ConnectWeb application on a VPS using Docker and Caddy.

## Prerequisites

- VPS with Docker and Docker Compose installed
- Domain name pointing to your VPS IP
- Environment variables configured

## Setup Instructions

### 1. Install Docker & Docker Compose

```bash
# For Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone & Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd website

# Create environment file
cp .env.docker.example .env.docker

# Edit with your values
nano .env.docker
```

### 3. Update Caddyfile

Edit the `Caddyfile` and replace `{DOMAIN}` with your actual domain:

```bash
sed -i 's/{DOMAIN}/yourdomain.com/g' Caddyfile
```

### 4. Build & Deploy

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

### 5. Verify Deployment

```bash
# Test the application
curl https://yourdomain.com

# Check Caddy logs
docker-compose logs caddy

# Check app logs
docker-compose logs app
```

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild image
docker-compose up -d --build

# Remove everything (data included)
docker-compose down -v
```

## SSL/TLS Certificate

Caddy automatically handles SSL certificate generation and renewal from Let's Encrypt. No manual setup needed!

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Port 80/443 already in use

```bash
# Find process using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill process if needed
sudo kill -9 <PID>
```

### Caddy certificate issues

```bash
# Clear Caddy data and restart (will regenerate certificate)
docker-compose down -v
docker-compose up -d
```

### App container crashing

```bash
# Check logs
docker-compose logs app

# Verify environment variables
cat .env.docker

# Rebuild image
docker-compose up -d --build
```

### Caddy reverse proxy not working

```bash
# Verify app is healthy
docker-compose exec app curl http://localhost:3000

# Check Caddy configuration
docker-compose logs caddy

# Verify network connectivity
docker-compose exec app ping caddy
```

## Performance Tuning

### Increase resource limits

Edit `docker-compose.yml`:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Enable app caching headers

Already configured in `Caddyfile` for:
- Static assets: 1 year cache
- Dynamic content: no-cache

## Security Recommendations

1. ✅ Non-root user running app (configured in Dockerfile)
2. ✅ Health checks enabled
3. ✅ Security headers configured in Caddy
4. ✅ HTTPS/TLS automatic with Let's Encrypt
5. Keep Docker images updated: `docker-compose pull`

## Monitoring

```bash
# Monitor resource usage
docker stats

# View persistent logs
docker-compose logs --follow app

# Check container health
docker inspect connectweb
```

## Backup

```bash
# Backup Caddy certificates and config
sudo tar -czf caddy-backup.tar.gz caddy_data caddy_config

# Backup application data
docker-compose exec app tar -czf /app/backup.tar.gz .
```

## Support

For issues or questions, check:
- Docker logs: `docker-compose logs`
- Next.js documentation: https://nextjs.org/docs
- Caddy documentation: https://caddyserver.com/docs/
