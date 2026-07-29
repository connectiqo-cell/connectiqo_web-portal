# Deployment Configuration

## 📋 Current Configuration

### Network
- **Subnet**: `172.30.0.0/24`
- **Network Name**: `connectiqo_network`
- **Driver**: Bridge

### Services
| Service | IP Address | Internal Port | External Port |
|---------|-----------|---------------|---------------|
| **App** | 172.30.0.3 | 3000 | 8081 |
| **Caddy (Proxy)** | 172.30.0.2 | 80/443 | 8081/8443 |

### Access URLs
- **HTTP**: `http://localhost:8081`
- **HTTPS**: `https://localhost:8443`
- **Internal App**: `http://172.30.0.3:3000`
- **Internal Caddy**: `http://172.30.0.2`

---

## 🚀 Deployment Steps

### 1. Prerequisites
```bash
# Install Docker and Docker Compose
docker --version
docker-compose --version
```

### 2. Prepare Environment
```bash
# Copy environment file
cp .env.local .env.docker

# Or create new .env.docker with:
NEXT_PUBLIC_SUPABASE_URL=https://pkoaxfxejgaawtwnkhvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
NODE_ENV=production
DOMAIN=yourdomain.com
```

### 3. Build and Start
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 4. Verify Deployment
```bash
# Check app logs
docker-compose logs app

# Check Caddy logs
docker-compose logs caddy

# Test connectivity
curl http://localhost:8081
```

---

## 🔧 Configuration Files

### Docker Compose (docker-compose.yml)
```yaml
Services:
  - app: Next.js application (172.30.0.3:3000)
  - caddy: Reverse proxy (172.30.0.2:80/443)

Ports:
  - 8081:80   (HTTP)
  - 8443:443  (HTTPS)

Network:
  - connectiqo_network (172.30.0.0/24)
  - Bridge driver
```

### Dockerfile
- **Base Image**: node:20-alpine
- **Build Stage**: Multi-stage build for optimization
- **User**: nextjs (non-root for security)
- **Port**: 3000 (internal)
- **Health Check**: Every 30s

### Caddyfile
- **Reverse Proxy**: Routes traffic to app:3000
- **SSL**: Automatic certificate handling
- **Domain**: Configurable via DOMAIN env var

---

## 📦 Docker Commands

### Build
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build app

# Build with no cache
docker-compose build --no-cache
```

### Run
```bash
# Start services (detached)
docker-compose up -d

# Start services (foreground)
docker-compose up

# Start specific service
docker-compose up -d app
```

### Monitor
```bash
# View logs
docker-compose logs

# Follow logs
docker-compose logs -f app

# View container status
docker-compose ps

# Inspect container
docker inspect connectweb
```

### Stop & Clean
```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Remove images
docker-compose rmi
```

---

## 🌐 Network Details

### Network Topology
```
┌─────────────────────────────────────┐
│   Docker Host (172.30.0.0/24)       │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   Caddy Proxy (172.30.0.2)      │ │
│ │   Ports: 8081→80, 8443→443      │ │
│ │   ↓                             │ │
│ ├─────────────────────────────────┤ │
│ │   App (172.30.0.3:3000)         │ │
│ │   Next.js Application           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
     ↑
   Host Port 8081 (External Access)
```

### Custom Network Advantages
- ✅ DNS resolution by container name
- ✅ Isolated network namespace
- ✅ Fixed IP addresses
- ✅ Service discovery
- ✅ Better security

---

## ⚙️ Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://pkoaxfxejgaawtwnkhvk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=production
```

### Optional
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
DOMAIN=yourdomain.com
```

---

## 🔒 Security Best Practices

✅ **DO**
- Use non-root user (nextjs)
- Implement health checks
- Use environment variables for secrets
- Keep images updated
- Use bridge network for isolation
- Enable restart policy

❌ **DON'T**
- Expose sensitive ports
- Run as root user
- Hardcode credentials
- Disable security features
- Expose Docker socket

---

## 📊 Port Mapping Reference

### Before (Old Config)
```
Host:8080 ← Not configured
```

### After (New Config)
```
Host:8081 → Caddy:80 → App:3000
Host:8443 → Caddy:443 → App:3000
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8081
netstat -ano | findstr :8081

# Or use lsof (Linux/Mac)
lsof -i :8081

# Change port in docker-compose.yml
# ports:
#   - "8082:80"  # Use 8082 instead
```

### Network Issues
```bash
# Inspect network
docker network inspect connectiqo_network

# Check IP assignment
docker inspect connectweb | grep IP

# Test network connectivity
docker exec connectweb ping caddy_proxy
```

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Verify build succeeded
docker-compose build --no-cache

# Check ports aren't in use
netstat -ano | findstr :8081
```

---

## 📈 Performance Tuning

### Increase Resources
```yaml
# In docker-compose.yml
services:
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

### Enable Caching
```yaml
# In Caddyfile
@cache {
  path /static/* /public/*
  path_regexp \.(js|css|png|jpg|gif|svg)$
}
cache @cache
```

---

## ✅ Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] `.env.docker` configured with all credentials
- [ ] Port 8081 available on host
- [ ] Subnet 172.30.0.0/24 not in use
- [ ] Run `docker-compose build`
- [ ] Run `docker-compose up -d`
- [ ] Verify app at `http://localhost:8081`
- [ ] Check logs: `docker-compose logs -f`
- [ ] Test API endpoints
- [ ] Verify database connection
- [ ] Test payments (if enabled)
- [ ] Set up monitoring/logging

---

**Ready to deploy!** 🚀
