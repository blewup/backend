#!/bin/bash

# Define supported environments
SUPPORTED_ENVS=("dev" "test" "preview" "build" "prod")

# Function to show usage
show_usage() {
    echo "Usage: $0 <environment>"
    echo "Supported environments: ${SUPPORTED_ENVS[*]}"
    exit 1
}

# Check if environment argument is provided
if [ $# -ne 1 ]; then
    show_usage
fi

ENV=$1

# Validate environment
if [[ ! " ${SUPPORTED_ENVS[@]} " =~ " ${ENV} " ]]; then
    echo "Error: Invalid environment '$ENV'"
    show_usage
fi

# Switch to the script directory
cd "$(dirname "$0")"
cd ../

# Create/update .env file
echo "NODE_ENV=$ENV" > .env

# Load environment-specific configurations
if [ -f "config/env.$ENV.json" ]; then
    cp "config/env.$ENV.json" "config/config.json"
else
    echo "Warning: Environment config file config/env.$ENV.json not found"
fi

# Restart services if needed
if [ "$ENV" = "prod" ]; then
    # Touch the restart trigger file
    touch tmp/restart.txt
    echo "Triggered service restart"
fi

echo "Environment switched to: $ENV"
echo "Please restart your application for changes to take effect"