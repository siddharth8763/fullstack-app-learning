# Local Development Guide

This guide covers how to run the React Serverless application locally for development and testing.

## Prerequisites

### Required Software
- **Docker** (v20.0+)
- **Docker Compose** (v2.0+)
- **Node.js** (v18+)
- **npm** (v8+)

### Verify Installation
```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js
node --version
npm --version
```

## Quick Start (Docker Compose)

### 1. Environment Setup
```bash
# Navigate to project root
cd react-serverless

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Add your Google OAuth credentials if needed
```

### 2. Start All Services
```bash
# Build and start all services
docker-compose up --build -d

# Or run in foreground to see logs
docker-compose up --build
```

### 3. Verify Services
```bash
# Health checks for all services
curl http://localhost:3000/health          # API Gateway
curl http://localhost:3001/health          # Auth Service  
curl http://localhost:3002/health          # User Service
curl http://localhost:3000/metrics         # Prometheus metrics
```

### 4. Access the Application
| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React application |
| **API Gateway** | http://localhost:3000 | Main API endpoint |
| **Auth Service** | http://localhost:3001 | Authentication service |
| **User Service** | http://localhost:3002 | User management |
| **Prometheus** | http://localhost:9090 | Metrics monitoring |
| **Grafana** | http://localhost:3001 | Visualization (admin/admin) |

## Manual Development Setup

If you prefer to run services individually for development:

### 1. Start Database Only
```bash
# Start MySQL database
docker-compose up mysql -d

# Wait for database to be ready (30 seconds)
```

### 2. Run Services Individually

#### API Gateway
```bash
# Open new terminal
cd services/api-gateway
npm install
npm run dev
```

#### Auth Service
```bash
# Open new terminal
cd services/auth-service
npm install
npm run dev
```

#### User Service
```bash
# Open new terminal
cd services/user-service
npm install
npm run dev
```

#### Frontend
```bash
# Open new terminal
cd frontend
npm install
npm run dev
```

### 3. Environment Variables
Each service needs its own environment variables. Create `.env` files:

```bash
# services/api-gateway/.env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# services/auth-service/.env
PORT=3001
DATABASE_URL=mysql://user:password@localhost:3306/auth_db
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# services/user-service/.env
PORT=3002
DATABASE_URL=mysql://user:password@localhost:3306/user_db

# frontend/.env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Testing the Application

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test@1234",
    "name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test@1234"
  }'
```

### 3. Access Protected Endpoint
```bash
# Use the JWT token from login response
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Test Frontend
1. Open http://localhost:5173 in your browser
2. Navigate to the login page
3. Use the credentials you created
4. Verify the dashboard loads correctly

## Docker Compose Services

### Available Services
```yaml
services:
  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: fullstack_platform
    
  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
    depends_on: [mysql]
    
  auth-service:
    build: ./services/auth-service
    ports: ["3001:3001"]
    depends_on: [mysql]
    
  user-service:
    build: ./services/user-service
    ports: ["3002:3002"]
    depends_on: [mysql]
    
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [api-gateway]
    
  prometheus:
    build: ./infra/monitoring
    ports: ["9090:9090"]
    
  grafana:
    image: grafana/grafana:latest
    ports: ["3001:3001"]
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5173

# Kill processes using ports
sudo kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check MySQL container status
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

#### Service Not Starting
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f user-service
docker-compose logs -f frontend

# Restart specific service
docker-compose restart api-gateway
```

#### Build Issues
```bash
# Rebuild specific service
docker-compose build --no-cache api-gateway

# Rebuild all services
docker-compose build --no-cache
```

### Environment Issues
```bash
# Check environment variables
docker-compose config

# Verify .env file exists
ls -la .env

# Test environment variables in container
docker-compose exec api-gateway printenv
```

## Development Workflow

### 1. Making Changes
```bash
# For Docker Compose (auto-rebuild on changes)
# Services should automatically restart when files change

# For manual setup
# Restart the specific service after making changes
npm run dev  # In the service directory
```

### 2. Database Migrations
```bash
# Run database migrations (if applicable)
docker-compose exec api-gateway npm run migrate

# Or run manually
cd services/api-gateway
npm run migrate
```

### 3. Running Tests
```bash
# Run all tests
docker-compose exec api-gateway npm test

# Run tests for specific service
cd services/auth-service
npm test

# Run tests with coverage
npm run test:coverage
```

### 4. Linting and Formatting
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Monitoring and Debugging

### 1. View Logs
```bash
# All services in real-time
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail=100 api-gateway
```

### 2. Access Container Shell
```bash
# Access container shell for debugging
docker-compose exec api-gateway sh
docker-compose exec auth-service sh
docker-compose exec user-service sh
```

### 3. Check Resource Usage
```bash
# View container resource usage
docker stats

# Check disk usage
docker system df
```

### 4. Prometheus Metrics
```bash
# Access Prometheus UI
open http://localhost:9090

# View targets
http://localhost:9090/targets

# Run queries
http://localhost:9090/graph
```

## Cleanup

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove all containers, networks, volumes
docker system prune -a
```

### Reset Database
```bash
# Stop and remove database volume
docker-compose down -v mysql

# Restart with fresh database
docker-compose up mysql -d
```

## Performance Tips

### 1. Optimize Docker Builds
```bash
# Use Docker build cache
docker-compose build

# Parallel builds
docker-compose build --parallel
```

### 2. Reduce Resource Usage
```bash
# Limit container resources in docker-compose.yml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### 3. Development Mode
```bash
# Use development Dockerfile with hot reload
# Services should auto-restart on file changes
```

## Next Steps

After successfully running the application locally:

1. **Explore the API endpoints** using the health checks
2. **Test the frontend** by registering and logging in
3. **Monitor services** using Prometheus and Grafana
4. **Review the code** structure and implementation
5. **Deploy to cloud** using the AWS CDK or Kubernetes manifests

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs for error messages
3. Verify all prerequisites are installed
4. Ensure environment variables are correctly set
5. Check that ports are not already in use

For additional help, refer to the [README.md](./README.md) or check the service-specific documentation in each service directory.
