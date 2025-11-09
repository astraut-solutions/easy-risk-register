#!/bin/bash

echo "Building Easy Risk Register Frontend Docker containers..."

if [ "$1" = "dev" ]; then
    echo "Building development environment..."
    docker-compose up --build
elif [ "$1" = "prod" ]; then
    echo "Building production image..."
    cd easy-risk-register-frontend
    docker build -t easy-risk-register-frontend .
    echo "Starting production container..."
    docker run -p 8080:8080 easy-risk-register-frontend
else
    echo "Usage:"
    echo "  ./build-docker.sh dev   - Build and run development environment"
    echo "  ./build-docker.sh prod  - Build and run production image"
    echo ""
    echo "For development mode, access the app at http://localhost:5173"
    echo "For production mode, access the app at http://localhost:8080"
fi