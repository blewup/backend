#!/bin/bash

# Kusher Space Environment Setup Script
# Handles development, testing, preview, build, and production environments

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

MAGENTA='\033[0;35m'

# ConfigurationCYAN='\033[0;36m'

PROJECT_ROOT="/var/home/kusher"NC='\033[0m'

BACKEND_DIR="$PROJECT_ROOT/backend"

FRONTEND_DIR="$PROJECT_ROOT/frontend"# Environment

ENV=${1:-dev}

# LoggingPROJECT_ROOT="/var/home/kusher"

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }MIGRATIONS_DIR="$PROJECT_ROOT/backend/migrations"

error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

# Environment configurations

# Check argumentdeclare -A ENV_CONFIGS=(

if [ $# -ne 1 ]; then    ["dev"]="Development environment (local)"

    error "Usage: $0 [dev|test|preview|build|prod]"    ["test"]="Testing environment (local testing)"

fi    ["preview"]="Preview environment (staging)"

    ["build"]="Build environment (compilation)"

ENV=$1    ["prod"]="Production environment (live)"

)

# Validate environment

if [[ ! "$ENV" =~ ^(dev|test|preview|build|prod)$ ]]; then# Logging

    error "Invalid environment. Choose from: dev, test, preview, build, prod"log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }

fierror() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }

# Switch backend environment

log "Switching backend environment to $ENV..."# Validate environment

if [ -f "$BACKEND_DIR/.env.$ENV" ]; thenif [[ ! "$ENV" =~ ^(test|prod)$ ]]; then

    cp "$BACKEND_DIR/.env.$ENV" "$BACKEND_DIR/.env"    error "Invalid environment. Use: test or prod"

    log "✓ Backend environment switched to $ENV"fi

else

    error "Backend environment file .env.$ENV not found"# Setup database and environment

fisetup_environment() {

    local env=$1

# Switch frontend environment    log "Setting up ${env} environment..."

log "Switching frontend environment to $ENV..."

if [ -f "$FRONTEND_DIR/.env.$ENV" ]; then    # Base configuration

    cp "$FRONTEND_DIR/.env.$ENV" "$FRONTEND_DIR/.env"    local env_file="$PROJECT_ROOT/backend/.env.${env}"

    log "✓ Frontend environment switched to $ENV"    

else    # Environment-specific configurations

    error "Frontend environment file .env.$ENV not found"    case $env in

fi        "dev")

            local port=3000

# Restart services based on environment            local db_name="kusher_dev"

case $ENV in            local frontend_url="http://localhost:3000"

    "dev")            local upload_dir="./public/uploads/dev"

        log "Starting development servers..."            local node_env="development"

        cd "$FRONTEND_DIR" && npm run dev &            ;;

        cd "$BACKEND_DIR" && npm run dev        "test")

        ;;            local port=3001

    "test")            local db_name="kusher_test"

        log "Starting test servers..."            local frontend_url="http://localhost:3001"

        cd "$FRONTEND_DIR" && npm run test &            local upload_dir="./public/uploads/test"

        cd "$BACKEND_DIR" && npm run test            local node_env="test"

        ;;            ;;

    "preview")        "preview")

        log "Starting preview servers..."            local port=3002

        cd "$FRONTEND_DIR" && npm run preview &            local db_name="kusher_preview"

        cd "$BACKEND_DIR" && npm run preview            local frontend_url="https://preview.kusher.space"

        ;;            local upload_dir="./public/uploads/preview"

    "build")            local node_env="preview"

        log "Building application..."            ;;

        cd "$FRONTEND_DIR" && npm run build        "build")

        cd "$BACKEND_DIR" && npm run build            local port=3003

        ;;            local db_name="kusher_build"

    "prod")            local frontend_url="http://localhost:3003"

        log "Restarting production services..."            local upload_dir="./public/uploads/build"

        touch "$BACKEND_DIR/tmp/restart.txt"            local node_env="production"

        systemctl restart nginx            ;;

        ;;        "prod")

esac            local port=8080

            local db_name="kusher_prod"

log "Environment switched to $ENV successfully!"            local frontend_url="https://kusher.space"
            local upload_dir="./public/uploads/prod"
            local node_env="production"
            ;;
    esac

    # Create environment file
    cat > "$env_file" << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${db_name}
DB_USER=kusher_shurukn
DB_PASSWORD=Christina4032
DB_DIALECT=mysql

# Server Configuration
NODE_ENV=${node_env}
PORT=${port}
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=8078c9ffdcab5424bd467d04113e9295f671b5671df47078998e50781a8ce7bc

# Security
SESSION_SECRET=8078c9ffdcab5424bd467d04113e9295f671b5671df47078998e50781a8ce7bc
BCRYPT_ROUNDS=10

# File Uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=${upload_dir}

# Email Configuration
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=465
EMAIL_USER=support@kusher.space
EMAIL_PASS="Couli\$\$e#2078"
EMAIL_FROM=Kusher Space <noreply@kusher.space>

# Frontend URL
FRONTEND_URL=${frontend_url}
EOF

    # Create database if not exists
    mysql -u kusher_shurukn -pChristina4032 -e "CREATE DATABASE IF NOT EXISTS ${db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

    # Create database if not exists
    mysql -u kusher_shurukn -pChristina4032 -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

    # Run migrations
    cd "$PROJECT_ROOT/backend"
    npx sequelize-cli db:migrate --env $env
}

# Setup React frontend
setup_frontend() {
    local env=$1
    cd "$PROJECT_ROOT/frontend"

    # Install dependencies
    log "Installing frontend dependencies..."
    npm install

    # Environment-specific Vite configuration
    local api_url
    local ws_url
    local analytics
    local mode

    case $env in
        "dev")
            api_url="http://localhost:3000/api"
            ws_url="ws://localhost:3000"
            analytics="false"
            mode="development"
            ;;
        "test")
            api_url="http://localhost:3001/api"
            ws_url="ws://localhost:3001"
            analytics="false"
            mode="test"
            ;;
        "preview")
            api_url="https://preview.kusher.space/api"
            ws_url="wss://preview.kusher.space"
            analytics="true"
            mode="preview"
            ;;
        "build")
            api_url="http://localhost:3003/api"
            ws_url="ws://localhost:3003"
            analytics="false"
            mode="production"
            ;;
        "prod")
            api_url="https://kusher.space/api"
            ws_url="wss://kusher.space"
            analytics="true"
            mode="production"
            ;;
    esac

    # Create environment-specific configuration
    cat > .env.${env} << EOF
VITE_API_URL=${api_url}
VITE_WS_URL=${ws_url}
VITE_ENV=${env}
VITE_ANALYTICS=${analytics}
VITE_MODE=${mode}
VITE_APP_VERSION=0.0.1-alpha
VITE_ASSET_URL=${api_url}/assets
EOF

    # Build frontend
    log "Building frontend for ${env}..."
    npm run build -- --mode ${env}

    # Setup public_html structure
    if [ "$env" == "prod" ]; then
        TARGET_DIR="$PROJECT_ROOT/public_html"
    else
        TARGET_DIR="$PROJECT_ROOT/public_html/test"
    fi

    mkdir -p $TARGET_DIR
    cp -r dist/* $TARGET_DIR/

    # Create/update .htaccess for proper routing
    cat > $TARGET_DIR/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Handle Authorization header
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# API requests proxy to backend
RewriteCond %{REQUEST_URI} ^/api/ [NC]
RewriteRule ^api/(.*) http://localhost:8080/api/$1 [P,L]

# WebSocket proxy
RewriteCond %{REQUEST_URI}  ^/socket.io            [NC]
RewriteCond %{QUERY_STRING} transport=websocket    [NC]
RewriteRule /(.*)           ws://localhost:8080/$1 [P,L]

# Serve static files directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route everything else to index.html
RewriteRule ^ index.html [L]

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Content-Security-Policy "default-src 'self' https: data: ws: wss: 'unsafe-inline' 'unsafe-eval';"

# Cache control
<FilesMatch "\.(html|htm)$">
    Header set Cache-Control "max-age=0, private, no-cache, no-store, must-revalidate"
</FilesMatch>

<FilesMatch "\.(js|css|json)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

<FilesMatch "\.(jpg|jpeg|png|gif|ico|svg|webp)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
EOF
}

# Validate environment selection
validate_env() {
    if [[ ! "${!ENV_CONFIGS[@]}" =~ $1 ]]; then
        error "Invalid environment. Choose from: ${!ENV_CONFIGS[@]}"
    fi
}

# Setup directory structure
setup_directories() {
    local env=$1
    log "Setting up directories for ${env}..."

    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/backend/public/uploads/${env}"
    mkdir -p "$PROJECT_ROOT/frontend/dist"
    mkdir -p "$PROJECT_ROOT/public_html/${env}"

    # Set permissions
    chmod -R 755 "$PROJECT_ROOT/backend/public/uploads/${env}"
    chmod -R 755 "$PROJECT_ROOT/public_html/${env}"
}

# Main execution
main() {
    log "🚀 Starting Kusher Space environment setup"
    echo -e "\nAvailable environments:"
    for env in "${!ENV_CONFIGS[@]}"; do
        echo -e "${CYAN}${env}${NC}: ${ENV_CONFIGS[$env]}"
    done
    echo ""

    validate_env "$ENV"
    
    # Print setup information
    log "Setting up environment: ${MAGENTA}${ENV}${NC}"
    log "Configuration: ${ENV_CONFIGS[$ENV]}"
    
    # Create directories
    setup_directories "$ENV"
    
    # Setup environment
    setup_environment "$ENV"
    
    # Setup frontend
    setup_frontend "$ENV"
    
    # Update migration filenames if needed
    log "Updating migration filenames..."
    for old_file in "$MIGRATIONS_DIR"/[0-9]*-*.js; do
        if [ -f "$old_file" ]; then
            new_file="$MIGRATIONS_DIR/$(basename "$old_file" | sed 's/^[0-9]*-//')"
            if [ "$old_file" != "$new_file" ]; then
                mv "$old_file" "$new_file"
                log "Renamed: $(basename "$old_file") → $(basename "$new_file")"
            fi
        fi
    done

    # Run database migrations
    log "Running database migrations..."
    cd "$PROJECT_ROOT/backend"
    NODE_ENV=$ENV npx sequelize-cli db:migrate

    # Final checks
    if [ "$ENV" = "prod" ]; then
        log "⚠️  Production environment setup completed"
        log "Remember to:"
        log "1. Update DNS records if needed"
        log "2. Configure SSL certificates"
        log "3. Set up monitoring"
    else
        log "✅ Environment setup completed: $ENV"
    fi
    
    log "Environment URLs:"
    log "Frontend: $(grep FRONTEND_URL "$PROJECT_ROOT/backend/.env.${ENV}" | cut -d'=' -f2)"
    log "API: $(grep VITE_API_URL "$PROJECT_ROOT/frontend/.env.${ENV}" | cut -d'=' -f2)"
}

# Execute main
main