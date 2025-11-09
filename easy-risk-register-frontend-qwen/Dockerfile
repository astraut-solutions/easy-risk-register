# Use Node.js 20 LTS as base image for optimal compatibility with React + TypeScript
FROM node:20-alpine

# Set working directory for the frontend application
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# Install serve to serve the static build files
RUN npm install -g serve

# Expose port 8080 for the frontend application
EXPOSE 8080

# Start the application using serve to serve static files
CMD ["serve", "-s", "dist", "-l", "8080"]