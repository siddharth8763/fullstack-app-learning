# Docker Interview Notes

## Core Concepts

### What is Docker?
- **Containerization Platform**: Packages applications with dependencies
- **Lightweight VM**: Shares host kernel, more efficient than VMs
- **Portable**: Runs consistently across environments
- **Isolated**: Process and filesystem isolation

```dockerfile
# Basic Dockerfile example
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run application
CMD ["node", "server.js"]
```

### Docker Architecture
- **Docker Daemon**: Background service managing containers
- **Docker Client**: CLI tool to interact with daemon
- **Docker Registry**: Repository for images (Docker Hub)
- **Docker Objects**: Images, containers, networks, volumes

## Dockerfile Best Practices

### Multi-stage Builds
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
```

### Layer Optimization
```dockerfile
# Bad: Changes frequently, invalidates cache
COPY . .
RUN npm install

# Good: Install dependencies first
COPY package*.json ./
RUN npm ci --only=production

# Then copy application code
COPY . .
```

### Security Best Practices
```dockerfile
# Use specific image version
FROM node:18.17.0-alpine

# Use non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Minimal base image
FROM alpine:3.18

# Remove package manager cache
RUN apk add --no-cache nodejs npm && \
    rm -rf /var/cache/apk/*

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Docker Commands

### Image Management
```bash
# Build image
docker build -t myapp:1.0 .

# Tag image
docker tag myapp:1.0 myapp:latest

# Push to registry
docker push username/myapp:1.0

# Pull image
docker pull username/myapp:1.0

# List images
docker images

# Remove image
docker rmi myapp:1.0

# Remove dangling images
docker image prune
```

### Container Management
```bash
# Run container
docker run -d --name myapp -p 3000:3000 myapp:1.0

# Run with environment variables
docker run -d --name myapp \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -p 3000:3000 myapp:1.0

# Run with volume mount
docker run -d --name myapp \
  -v /path/to/data:/app/data \
  -p 3000:3000 myapp:1.0

# Interactive container
docker run -it --name dev myapp:1.0 sh

# List containers
docker ps
docker ps -a  # Show all containers

# Stop container
docker stop myapp

# Start container
docker start myapp

# Remove container
docker rm myapp

# View logs
docker logs myapp
docker logs -f myapp  # Follow logs

# Execute command in running container
docker exec -it myapp sh
```

### Volume Management
```bash
# Create volume
docker volume create mydata

# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Remove volume
docker volume rm mydata

# Remove unused volumes
docker volume prune
```

## Docker Compose

### Basic Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Advanced Compose Features
```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - frontend
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - web
    networks:
      - frontend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### Compose Commands
```bash
# Start services
docker-compose up -d

# Build and start
docker-compose up --build

# Scale services
docker-compose up -d --scale web=3

# View logs
docker-compose logs
docker-compose logs -f web

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Execute command
docker-compose exec web sh

# List services
docker-compose ps
```

## Docker Networking

### Network Types
```bash
# Create bridge network
docker network create myapp-network

# Create overlay network (for swarm)
docker network create --driver overlay myapp-overlay

# Connect container to network
docker network connect myapp-network myapp

# Disconnect container
docker network disconnect myapp-network myapp

# List networks
docker network ls

# Inspect network
docker network inspect myapp-network
```

### Network Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    networks:
      - frontend
      - backend

  db:
    image: postgres:15
    networks:
      - backend
    # Internal only (no external access)
    network_mode: service:backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Docker Security

### Security Best Practices
```dockerfile
# Use minimal base image
FROM alpine:3.18

# Use specific version
FROM node:18.17.0-alpine

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

# Remove unnecessary packages
RUN apk del --purge \
    && rm -rf /var/cache/apk/*

# Use multi-stage builds
FROM node:18-alpine AS builder
# ... build steps ...

FROM alpine:3.18 AS production
COPY --from=builder /app/dist ./dist
```

### Security Scanning
```bash
# Scan image for vulnerabilities
docker scan myapp:1.0

# Use Trivy for comprehensive scanning
trivy image myapp:1.0

# Run security checks in CI
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --exit-code 1 myapp:1.0
```

### Runtime Security
```yaml
# docker-compose.yml with security options
version: '3.8'

services:
  app:
    build: .
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    user: "1001:1001"
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

## Performance Optimization

### Image Size Optimization
```dockerfile
# Use .dockerignore
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output

# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Resource Limits
```yaml
version: '3.8'

services:
  app:
    build: .
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    ulimits:
      nproc: 65535
      nofile:
        soft: 20000
        hard: 40000
```

## Common Interview Questions

### Q: What is the difference between Docker and VMs?
A: 
**Docker Containers:**
- Share host kernel
- Lightweight, fast startup
- Process-level isolation
- Better resource efficiency

**Virtual Machines:**
- Separate kernel per VM
- Heavy, slower startup
- Hardware-level isolation
- Better security isolation

### Q: What is a Dockerfile and how does it work?
A: Dockerfile is a text file with instructions to build Docker images:
- **FROM**: Base image
- **RUN**: Execute commands
- **COPY/ADD**: Copy files
- **CMD/ENTRYPOINT**: Default command
- **EXPOSE**: Document ports
- **ENV**: Set environment variables

### Q: What is Docker Compose?
A: Docker Compose is a tool for defining and running multi-container applications:
- **YAML configuration**: Define services, networks, volumes
- **Single command**: Start/stop all services
- **Development tool**: Not for production (use Swarm/Kubernetes)
- **Environment variables**: Override configurations

### Q: How do you persist data in Docker?
A: Data persistence methods:
- **Volumes**: Docker-managed storage
- **Bind mounts**: Host filesystem mapping
- **Tmpfs**: Memory-only storage
- **Best practice**: Use volumes for data, bind mounts for development

### Q: What is the difference between CMD and ENTRYPOINT?
A: 
**CMD:**
- Default command for container
- Can be overridden from CLI
- Can have multiple forms (shell, exec)

**ENTRYPOINT:**
- Configures container to run as executable
- Cannot be easily overridden
- Often used with CMD for default arguments

## Advanced Topics

### Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Join swarm
docker swarm join --token <token> <manager-ip>:2377

# Deploy stack
docker stack deploy -c docker-compose.yml myapp

# Scale services
docker service scale myapp_web=3

# List services
docker service ls

# Remove stack
docker stack rm myapp
```

### Docker Registry
```bash
# Run local registry
docker run -d -p 5000:5000 --name registry registry:2

# Configure insecure registry
# /etc/docker/daemon.json
{
  "insecure-registries": ["localhost:5000"]
}

# Push to local registry
docker tag myapp:1.0 localhost:5000/myapp:1.0
docker push localhost:5000/myapp:1.0
```

### Container Orchestration Comparison
| Feature | Docker Swarm | Kubernetes |
|---------|-------------|------------|
| Ease of Use | Easy | Complex |
| Scalability | Medium | High |
| Ecosystem | Limited | Extensive |
| Auto-healing | Basic | Advanced |
| Load Balancing | Built-in | Ingress/Services |
| Storage | Basic | Advanced |

## Best Practices

### Development Workflow
1. **Use .dockerignore**: Exclude unnecessary files
2. **Multi-stage builds**: Separate build and runtime
3. **Version pinning**: Use specific image versions
4. **Health checks**: Monitor container health
5. **Environment variables**: Configure at runtime

### Production Deployment
1. **Read-only filesystem**: Prevent modifications
2. **Non-root user**: Security best practice
3. **Resource limits**: Prevent resource exhaustion
4. **Logging**: Structured JSON logs
5. **Monitoring**: Health and performance metrics

### CI/CD Integration
```yaml
# GitHub Actions example
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      
      - name: Run security scan
        run: docker scan myapp:${{ github.sha }}
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myapp:${{ github.sha }}
```

## Additional Topics

### Docker Compose
- Define and run multi-container applications with a single YAML file.
- Great for local development environments and integration testing.

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://user:pass@db:3306/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - ./src:/app/src  # Bind mount for hot-reload

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: myapp
    volumes:
      - db_data:/var/lib/mysql  # Named volume for persistence
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db_data:  # Persists across container restarts
```

### Docker Networking Modes
| Mode | Description | Use Case |
|---|---|---|
| **bridge** (default) | Creates an isolated network. Containers communicate via DNS names. | Multi-container apps (Compose default) |
| **host** | Container shares the host's network stack. No port mapping needed. | Maximum network performance |
| **none** | No networking | Security-sensitive containers |
| **overlay** | Multi-host networking (across Docker Swarm/K8s nodes) | Distributed applications |

### Docker Volumes
- **Bind Mount**: Maps a host directory into the container (`./src:/app/src`). Changes reflected instantly (great for dev).
- **Named Volume**: Managed by Docker, persists data across container restarts (`db_data:/var/lib/mysql`).
- **tmpfs Mount**: Stored in memory only. Lost when container stops. Used for sensitive data.

### Container Lifecycle
```
Created --> Running --> Paused --> Running --> Stopped --> Removed
              |                      ^
              |-- OOMKilled/Error ---|
```

### Resource Limits
```bash
# Limit CPU and memory
docker run --memory="512m" --cpus="1.5" myapp

# In Docker Compose
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
```

### Docker vs Virtual Machines
| Feature | Docker Containers | Virtual Machines |
|---|---|---|
| Isolation | Process-level (shares host kernel) | Full OS-level (separate kernel) |
| Startup | Seconds | Minutes |
| Size | MBs (app + deps only) | GBs (full OS + app) |
| Performance | Near-native | Overhead from hypervisor |
| Use Case | Microservices, CI/CD | Legacy apps, different OS needs |

## Additional Interview Questions

### Q: What is the difference between `CMD` and `ENTRYPOINT` in a Dockerfile?
A:
- **CMD**: Sets the default command. Can be overridden by `docker run` arguments.
- **ENTRYPOINT**: Sets the base command. Arguments from `docker run` are appended to it.
- **Combined**: `ENTRYPOINT ["node"]` + `CMD ["server.js"]` = `node server.js`. You can override `CMD` at run time: `docker run myapp client.js` = `node client.js`.

### Q: What is the difference between `COPY` and `ADD` in Dockerfile?
A: Both copy files from host to container. `ADD` has extra features: it can extract tar archives and download from URLs. Best practice: use `COPY` unless you specifically need `ADD`'s extra capabilities.

### Q: How do you reduce Docker image size?
A: Key strategies:
1. Use small base images (`alpine`, `slim`, `distroless`).
2. Multi-stage builds (build in one stage, copy only the binary/artifact to the final stage).
3. Combine `RUN` commands to reduce layers.
4. Use `.dockerignore` to exclude `node_modules`, `.git`, etc.
5. Install only production dependencies (`npm ci --only=production`).
