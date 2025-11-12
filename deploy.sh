#!/bin/bash

################################################################################
# Kusher Backend Deployment Script
# Author: Billy St-Hilaire (shurukn)
# Description: Deploys the Kusher backend Node.js application
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate Node.js virtual environment
if [ -f "../nodevenv/backend/22/bin/activate" ]; then
    source ../nodevenv/backend/22/bin/activate
    print_success "Node.js virtual environment activated"
fi

# Activate Node.js virtual environment
if [ -f "../nodevenv/backend/22/bin/activate" ]; then
    source ../nodevenv/backend/22/bin/activate
    echo -e "${GREEN}✅ Node.js virtual environment activated${NC}"
fi

# Default values
ENVIRONMENT="${NODE_ENV:-production}"
DB_USER="kusher_shurukn"
DB_PASSWORD="Christina4032"
SUPER_ADMIN_USERNAME="kusher_shurukn"
SUPER_ADMIN_PASSWORD="Christina4032"

# Function to print colored messages
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    echo ""
    print_message "$BLUE" "═══════════════════════════════════════════════════════════"
    print_message "$BLUE" "$@"
    print_message "$BLUE" "═══════════════════════════════════════════════════════════"
    echo ""
}

print_success() {
    print_message "$GREEN" "✅ $@"
}

print_error() {
    print_message "$RED" "❌ $@"
}

print_warning() {
    print_message "$YELLOW" "⚠️  $@"
}

print_info() {
    print_message "$BLUE" "ℹ️  $@"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    print_header "Validating Environment"
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js $(node --version) detected"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm --version) detected"
    
    # Check MySQL/MariaDB client
    if ! command_exists mysql; then
        print_warning "MySQL client not found. Database operations may fail."
    else
        print_success "MySQL client detected"
    fi
}

# Function to set database name based on environment
get_database_name() {
    case "$ENVIRONMENT" in
        production)
            echo "kusher_prod"
            ;;
        development)
            echo "kusher_dev"
            ;;
        test)
            echo "kusher_test"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Function to create .env file
create_env_file() {
    print_header "Creating Environment Configuration"
    
    local DB_NAME=$(get_database_name)
    
    print_info "Environment: $ENVIRONMENT"
    print_info "Database: $DB_NAME"
    
    cat > .env << EOF
# Environment Configuration
NODE_ENV=$ENVIRONMENT
PORT=8080
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mariadb
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_NAME_DEV=kusher_dev
DB_NAME_TEST=kusher_test

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=7d

# Super Admin Configuration
SUPER_ADMIN_USERNAME=$SUPER_ADMIN_USERNAME
SUPER_ADMIN_EMAIL=admin@kusher.space
SUPER_ADMIN_PASSWORD=$SUPER_ADMIN_PASSWORD
SUPER_ADMIN_FIRST_NAME=Billy
SUPER_ADMIN_LAST_NAME=St-Hilaire

# File Upload Configuration
UPLOAD_MAX_SIZE=64mb
UPLOAD_PATH=$SCRIPT_DIR/public/uploads

# Email Configuration (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_FROM=noreply@kusher.space

# Payment Configuration (Optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
EOF
    
    chmod 600 .env
    print_success "Environment file created"
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    if [ -f "package-lock.json" ]; then
        print_info "Running npm ci for clean install..."
        npm ci || {
            print_warning "npm ci failed, falling back to npm install..."
            npm install
        }
    else
        print_info "Running npm install..."
        npm install
    fi
    
    # Ensure mariadb package is installed
    print_info "Verifying mariadb package..."
    npm list mariadb >/dev/null 2>&1 || {
        print_warning "Installing mariadb package..."
        npm install mariadb
    }
    
    print_success "Dependencies installed"
}

# Function to create database
create_database() {
    print_header "Setting Up Database"
    
    local DB_NAME=$(get_database_name)
    
    print_info "Creating database: $DB_NAME"
    
    # Create database if it doesn't exist
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
        print_warning "Could not create database automatically. Please create it manually:"
        print_info "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    }
    
    print_success "Database setup complete"
}

# Function to run migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    # Note: If using Sequelize migrations
    if [ -d "migrations" ] && command_exists npx; then
        print_info "Running Sequelize migrations..."
        if NODE_ENV="$ENVIRONMENT" npx sequelize-cli db:migrate --env "$ENVIRONMENT" 2>&1; then
            print_success "Migrations completed successfully"
        else
            print_warning "Migration failed or no migrations to run"
            print_info "You may need to run migrations manually with: npm run db:migrate"
        fi
    else
        print_info "No migrations directory found, skipping migrations"
    fi
}

# Function to create super admin
create_super_admin() {
    print_header "Creating Super Admin User"
    
    if [ -f "scripts/create-super-admin.js" ]; then
        print_info "Running super admin creation script..."
        if node scripts/create-super-admin.js 2>&1; then
            print_success "Super admin setup complete"
        else
            print_error "Super admin creation failed"
            print_info "You may need to create the super admin manually"
            print_info "Check the error above and ensure:"
            print_info "  1. Database is accessible"
            print_info "  2. MariaDB package is installed"
            print_info "  3. Database credentials are correct"
            return 1
        fi
    else
        print_warning "Super admin script not found at scripts/create-super-admin.js"
    fi
}

# Function to create necessary directories
create_directories() {
    print_header "Creating Required Directories"
    
    mkdir -p public/uploads
    mkdir -p logs
    mkdir -p tmp
    
    print_success "Directories created"
}

# Function to verify required packages
verify_packages() {
    print_header "Verifying Required Packages"
    
    local missing_packages=()
    
    # Check for critical packages
    npm list mariadb >/dev/null 2>&1 || missing_packages+=("mariadb")
    npm list mysql2 >/dev/null 2>&1 || missing_packages+=("mysql2")
    npm list sequelize >/dev/null 2>&1 || missing_packages+=("sequelize")
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        print_warning "Missing packages: ${missing_packages[*]}"
        print_info "Installing missing packages..."
        npm install "${missing_packages[@]}"
        print_success "Missing packages installed"
    else
        print_success "All required packages are installed"
    fi
}

# Function to test database connection
test_database() {
    print_header "Testing Database Connection"
    
    local DB_NAME=$(get_database_name)
    
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 'Connection successful' AS status;" 2>/dev/null && {
        print_success "Database connection successful"
        return 0
    } || {
        print_error "Database connection failed"
        print_info "Attempting to connect with mariadb client..."
        mariadb -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 'Connection successful' AS status;" 2>/dev/null && {
            print_success "Database connection successful (via mariadb client)"
            return 0
        } || {
            print_error "Database connection failed with both mysql and mariadb clients"
            print_info "Please check:"
            print_info "  1. Database server is running"
            print_info "  2. Credentials are correct: $DB_USER"
            print_info "  3. Database exists: $DB_NAME"
            return 1
        }
    }
}

# Function to display deployment summary
display_summary() {
    print_header "Deployment Summary"
    
    local DB_NAME=$(get_database_name)
    
    echo ""
    print_info "Environment:        $ENVIRONMENT"
    print_info "Database:           $DB_NAME"
    print_info "Database User:      $DB_USER"
    print_info "Super Admin User:   $SUPER_ADMIN_USERNAME"
    print_info "Backend Port:       8080"
    echo ""
    print_success "Backend deployment complete!"
    echo ""
    print_info "To start the backend server:"
    print_message "$GREEN" "  npm start           - Production mode"
    print_message "$GREEN" "  npm run dev         - Development mode"
    echo ""
    print_info "API will be available at: http://0.0.0.0:8080/api"
    print_info "Health check: http://0.0.0.0:8080/api/status"
    echo ""
}

# Main deployment function
main() {
    print_header "🚀 Kusher Backend Deployment"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --production)
                ENVIRONMENT="production"
                shift
                ;;
            --development)
                ENVIRONMENT="development"
                shift
                ;;
            --test)
                ENVIRONMENT="test"
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --env ENVIRONMENT       Set environment (production|development|test)"
                echo "  --production            Use production environment"
                echo "  --development           Use development environment"
                echo "  --test                  Use test environment"
                echo "  --skip-db               Skip database creation and migrations"
                echo "  --help                  Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    export NODE_ENV="$ENVIRONMENT"

    # Run deployment steps
    validate_environment
    create_env_file
    create_directories
    install_dependencies
    verify_packages
    
    if [ "$SKIP_DB" != "true" ]; then
        create_database
        test_database
        run_migrations
        create_super_admin
    else
        print_warning "Skipping database setup"
    fi
    
    display_summary
}

# Run main function
main "$@"
