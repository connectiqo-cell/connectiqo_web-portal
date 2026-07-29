#!/bin/bash

# ConnectWeb VPS Deployment Script
# Usage: ./deploy.sh [domain] [action]
# Actions: setup, start, stop, restart, logs, rebuild, update

set -e

DOMAIN="${1:-localhost}"
ACTION="${2:-start}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}ConnectWeb Docker Deployment Script${NC}"
echo "Domain: $DOMAIN"
echo "Action: $ACTION"
echo ""

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
}

# Function to setup environment
setup_env() {
    echo -e "${YELLOW}Setting up environment...${NC}"

    if [ ! -f .env.docker ]; then
        if [ -f .env.docker.example ]; then
            cp .env.docker.example .env.docker
            echo -e "${YELLOW}Created .env.docker from .env.docker.example${NC}"
            echo -e "${RED}⚠ Please edit .env.docker with your actual values${NC}"
            return 1
        else
            echo -e "${RED}No .env.docker.example found${NC}"
            return 1
        fi
    fi

    # Update Caddyfile with domain
    if [ "$DOMAIN" != "localhost" ]; then
        sed -i "s/{DOMAIN}/$DOMAIN/g" Caddyfile 2>/dev/null || \
        sed -i '' "s/{DOMAIN}/$DOMAIN/g" Caddyfile
        echo -e "${GREEN}✓ Updated Caddyfile with domain: $DOMAIN${NC}"
    fi

    echo -e "${GREEN}✓ Environment setup complete${NC}"
}

# Function to validate environment
validate_env() {
    if [ ! -f .env.docker ]; then
        echo -e "${RED}✗ .env.docker not found${NC}"
        return 1
    fi

    local required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.docker; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}✗ Missing required variables in .env.docker:${NC}"
        printf ' - %s\n' "${missing_vars[@]}"
        return 1
    fi

    echo -e "${GREEN}✓ Environment validation passed${NC}"
}

# Function to build and start
start() {
    echo -e "${YELLOW}Building and starting services...${NC}"
    docker-compose up -d --build
    echo ""
    echo -e "${GREEN}✓ Services started${NC}"
    sleep 2
    status
}

# Function to stop services
stop() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

# Function to restart services
restart() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✓ Services restarted${NC}"
    sleep 2
    status
}

# Function to show logs
logs() {
    docker-compose logs -f ${@:--f app}
}

# Function to rebuild image
rebuild() {
    echo -e "${YELLOW}Rebuilding Docker image...${NC}"
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✓ Image rebuilt and services restarted${NC}"
}

# Function to update code
update() {
    echo -e "${YELLOW}Pulling latest code...${NC}"
    git pull origin main || git pull
    echo -e "${YELLOW}Rebuilding and restarting...${NC}"
    docker-compose up -d --build
    echo -e "${GREEN}✓ Update complete${NC}"
}

# Function to show status
status() {
    echo -e "${YELLOW}Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${YELLOW}Health Check:${NC}"
    if docker-compose exec -T app curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ App is healthy${NC}"
    else
        echo -e "${RED}✗ App is not responding${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Access:${NC}"
    if [ "$DOMAIN" = "localhost" ]; then
        echo -e "Local: ${GREEN}http://localhost${NC}"
    else
        echo -e "Domain: ${GREEN}https://$DOMAIN${NC}"
    fi
}

# Main script
main() {
    check_docker

    case $ACTION in
        setup)
            setup_env
            validate_env
            ;;
        start)
            setup_env
            validate_env && start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs "${@:3}"
            ;;
        rebuild)
            rebuild
            ;;
        update)
            update
            ;;
        status)
            status
            ;;
        *)
            echo "Unknown action: $ACTION"
            echo ""
            echo "Available actions:"
            echo "  setup     - Setup environment and validate"
            echo "  start     - Build and start services"
            echo "  stop      - Stop services"
            echo "  restart   - Restart services"
            echo "  status    - Show service status"
            echo "  logs      - View logs"
            echo "  rebuild   - Rebuild Docker image"
            echo "  update    - Pull latest code and restart"
            exit 1
            ;;
    esac
}

main "$@"
