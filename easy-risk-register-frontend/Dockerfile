# Use Node.js 20 LTS as base image for optimal compatibility with React + TypeScript
# Multi-stage build: build stage
FROM node:20 as builder

# Set working directory for the frontend application
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# Production stage: create a lean production image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

COPY server.mjs ./server.mjs

# Expose port 8080 for the frontend application
EXPOSE 8080

# Start the application using a small Node server that sets security headers (including CSP)
CMD ["node", "server.mjs"]
