# Full Stack Learning Platform

A **production-grade monorepo** that serves as both a working application and a study guide for every technology in the stack. Every file is annotated with **interview-prep comments** so you learn while you read code.

## Architecture Overview

```
fullstack-platform/          ← monorepo root
├── frontend/                ← React 18 + TypeScript + Redux Toolkit (RTK Query)
├── services/
│   ├── api-gateway/         ← Express gateway (routing, rate-limit, auth check)
│   ├── auth-service/        ← JWT + Refresh tokens + bcrypt + OAuth2 (Google)
│   └── user-service/        ← CRUD users, MySQL via Prisma
├── infra/
│   ├── docker/              ← Dockerfiles
│   ├── k8s/                 ← Kubernetes manifests
│   ├── aws-cdk/             ← AWS CDK infrastructure
│   └── monitoring/          ← Prometheus + Grafana configs
├── notes/                   ← Interview prep markdown files (one per topic)
├── docker-compose.yml       ← Full local dev stack
└── README.md
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Redux Toolkit, RTK Query, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT + Refresh Tokens + Google OAuth 2.0
- **Infrastructure**: Docker, Kubernetes, AWS CDK
- **Monitoring**: Prometheus, Grafana
- **API Gateway**: Express with rate limiting and auth middleware

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MySQL (or use Docker Compose setup)

### Local Development

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd fullstack-platform
npm install
```

2. **Start the full stack with Docker Compose**
```bash
docker-compose up --build -d
```

3. **Verify services are running**
```bash
# Health checks
curl http://localhost:3000/health          # API Gateway
curl http://localhost:3001/health          # Auth Service
curl http://localhost:3002/health          # User Service
curl http://localhost:3000/metrics         # Prometheus metrics
```

4. **Access the application**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- User Service: http://localhost:3002
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### Manual Testing

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234","name":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
```

**Google OAuth:**
```bash
# Visit: http://localhost:3000/api/auth/google
```

## Development Workflow

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Service Development
```bash
# API Gateway
cd services/api-gateway
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm start            # Start production

# Auth Service
cd services/auth-service
npm run dev
npm run build
npm start

# User Service
cd services/user-service
npm run dev
npm run build
npm start
```

### Database Operations
```bash
# In any service directory with Prisma
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open database GUI
npx prisma generate       # Generate Prisma client
```

## Deployment

### Kubernetes (Local)
```bash
minikube start
kubectl apply -f infra/k8s/
kubectl get pods -n fullstack-platform
```

### AWS (Production)
```bash
cd infra/aws-cdk
npm install
npm run build
cdk bootstrap
cdk deploy --all
```

## Project Structure

### Frontend (`frontend/`)
- `src/store/` - Redux store configuration with RTK
- `src/api/` - RTK Query API slices
- `src/pages/` - React page components
- `src/components/` - Reusable UI components

### Services (`services/`)
- Each service follows the same structure:
  - `src/routes/` - Express route definitions
  - `src/controllers/` - Business logic
  - `src/middleware/` - Custom middleware
  - `prisma/` - Database schema and migrations

### Infrastructure (`infra/`)
- `docker/` - Multi-stage Dockerfiles
- `k8s/` - Kubernetes manifests
- `aws-cdk/` - AWS CDK infrastructure as code
- `monitoring/` - Prometheus and Grafana configs

## Learning Resources

Check the `notes/` directory for interview preparation materials:

- `01-react-typescript.md` - React hooks, TypeScript generics
- `02-redux-rtk-query.md` - State management patterns
- `03-expressjs-nodejs.md` - Node.js fundamentals
- `04-mysql-database.md` - Database design and queries
- `05-microservices.md` - Microservice architecture patterns
- `06-docker.md` - Containerization concepts
- `07-kubernetes.md` - Container orchestration
- `08-aws.md` - Cloud services and architecture
- `09-auth-security.md` - Authentication and security
- `10-grafana-prometheus.md` - Monitoring and observability
- `11-system-design.md` - System design principles

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/fullstack_platform"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
FRONTEND_PORT=5173
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Check the `notes/` directory for learning materials
- Review the implementation plan in `implementation_plan.md`
- Open an issue for bugs or feature requests
