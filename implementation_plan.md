# Full Stack Learning Platform — Implementation Plan

A **production-grade monorepo** that serves as both a working application and a study guide for every technology in the stack. Every file is annotated with **interview-prep comments** so you learn while you read code.

> **Confirmed Scope** (user input):
> - AWS: CDK deployment scripts **+** architecture notes
> - OAuth2: Real **Google OAuth 2.0** (Passport.js strategy in auth-service)
> - Registration: Email + password only (no email verification step)

---

## Architecture Overview

```
fullstack-platform/          ← monorepo root
├── frontend/                ← React 18 + TypeScript + Redux Toolkit (RTK Query)
├── services/
│   ├── api-gateway/         ← Express gateway (routing, rate-limit, auth check)
│   ├── auth-service/        ← JWT + Refresh tokens + bcrypt + OAuth2 placeholder
│   └── user-service/        ← CRUD users, MySQL via Prisma
├── infra/
│   ├── docker/              ← Dockerfiles
│   ├── k8s/                 ← Kubernetes manifests
│   └── monitoring/          ← Prometheus + Grafana configs
├── notes/                   ← Interview prep markdown files (one per topic)
├── docker-compose.yml       ← Full local dev stack
└── README.md
```

---

## Proposed Changes

### Root Level

#### [NEW] [docker-compose.yml](file:///c:/Users/siddh/OneDrive/Desktop/codebase/react-serverless/docker-compose.yml)
Orchestrates: MySQL, auth-service, user-service, api-gateway, frontend, Prometheus, Grafana.

#### [NEW] [README.md](file:///c:/Users/siddh/OneDrive/Desktop/codebase/react-serverless/README.md)
Getting-started guide, architecture diagram (ASCII), and commands.

---

### Frontend — `frontend/`

#### [NEW] Vite + React 18 + TypeScript scaffold
- `vite.config.ts`, `tsconfig.json`, `index.html`
- Global CSS with dark-mode design

#### [NEW] Redux store — `frontend/src/store/`
- `store.ts` — configureStore with RTK
- `authSlice.ts` — manages JWT tokens in memory
- `api/baseApi.ts` — RTK Query base with `prepareHeaders` for Bearer token injection

#### [NEW] RTK Query slices — `frontend/src/api/`
- `authApi.ts` — `login`, `register`, `refreshToken` endpoints
- `usersApi.ts` — `getUsers`, `getUser`, `updateUser` endpoints

#### [NEW] Pages
- `LoginPage.tsx`, `RegisterPage.tsx`
- `DashboardPage.tsx` — shows logged-in user data from RTK Query
- `UsersPage.tsx` — list all users (admin only)

#### [NEW] Components
- `ProtectedRoute.tsx` — checks Redux auth state, redirects to login
- `Navbar.tsx`, `Sidebar.tsx`

---

### API Gateway — `services/api-gateway/`

#### [NEW] Express TypeScript app
- `src/index.ts` — entry point, helmet, cors, rate-limiter
- `src/middleware/verifyToken.ts` — validates JWT on protected routes
- `src/routes/proxy.ts` — http-proxy-middleware routes to auth/user services
- `src/metrics.ts` — `prom-client` Prometheus metrics endpoint `/metrics`

---

### Auth Service — `services/auth-service/`

#### [NEW] Express TypeScript app
- `src/index.ts` — helmet, cors, express-validator
- `src/routes/auth.ts` — POST /register, POST /login, POST /refresh, POST /logout, GET /google, GET /google/callback
- `src/controllers/authController.ts` — bcrypt hash, JWT sign/verify, refresh token rotation
- `src/controllers/oauthController.ts` — **Google OAuth 2.0** via Passport.js (`passport-google-oauth20`)
- `src/middleware/` — validation, error handler
- `src/db/prisma.ts` — Prisma client singleton
- `prisma/schema.prisma` — User model with roles (ADMIN, USER) + `googleId` field
- `src/metrics.ts` — Prometheus metrics

---

### User Service — `services/user-service/`

#### [NEW] Express TypeScript app
- `src/routes/users.ts` — GET /users, GET /users/:id, PUT /users/:id, DELETE /users/:id
- `src/controllers/usersController.ts` — Prisma queries
- `src/middleware/authorize.ts` — RBAC role check (admin-only routes)
- `prisma/schema.prisma` — same DB, same User model

---

### Infrastructure — `infra/`

#### [NEW] Dockerfiles
- `infra/docker/Dockerfile.frontend` — multi-stage: build → nginx serve
- `infra/docker/Dockerfile.service` — shared Node.js multi-stage Dockerfile

#### [NEW] AWS CDK — `infra/aws-cdk/`
- `bin/app.ts` — CDK entry point
- `lib/network-stack.ts` — VPC, subnets, security groups
- `lib/database-stack.ts` — RDS MySQL (Multi-AZ)
- `lib/ecs-stack.ts` — ECS Fargate cluster + services for each microservice
- `lib/cdn-stack.ts` — CloudFront + S3 for frontend static hosting
- `lib/iam-stack.ts` — IAM roles and policies
- `cdk.json`, `package.json`

#### [NEW] Kubernetes Manifests — `infra/k8s/`
- `namespace.yaml`
- `mysql-deployment.yaml` + `mysql-pvc.yaml`
- `auth-service-deployment.yaml` + `auth-service-service.yaml`
- `user-service-deployment.yaml` + `user-service-service.yaml`
- `api-gateway-deployment.yaml` + `api-gateway-service.yaml`
- `frontend-deployment.yaml` + `frontend-service.yaml`
- `ingress.yaml` — nginx ingress controller
- `hpa.yaml` — HorizontalPodAutoscaler for gateway and services

#### [NEW] Monitoring — `infra/monitoring/`
- `prometheus.yml` — scrape configs for all services
- `grafana/provisioning/datasources/prometheus.yaml`
- `grafana/provisioning/dashboards/node-metrics.json`

---

### Interview Notes — `notes/`

#### [NEW] Topic-by-topic markdown files
| File | Topics Covered |
|---|---|
| `01-react-typescript.md` | Hooks, generics, strict mode, performance |
| `02-redux-rtk-query.md` | Slices, RTK Query lifecycle, cache invalidation |
| `03-expressjs-nodejs.md` | Event loop, middleware chain, error handling |
| `04-mysql-database.md` | Indexes, joins, transactions, normalization |
| `05-microservices.md` | Patterns: saga, CQRS, circuit breaker, service mesh |
| `06-docker.md` | Layers, multi-stage builds, networking |
| `07-kubernetes.md` | Pods, Services, Ingress, HPA, ConfigMaps |
| `08-aws.md` | ECS/EKS, RDS, S3, CloudFront, IAM, VPC |
| `09-auth-security.md` | JWT, OAuth2, PKCE, RBAC, OIDC |
| `10-grafana-prometheus.md` | Metrics types, PromQL, alert rules |
| `11-system-design.md` | Load balancing, CAP theorem, DB sharding |

---

## Verification Plan

### Automated (Docker Compose)
```bash
# From project root
docker-compose up --build -d

# Health checks
curl http://localhost:3000/health          # API Gateway
curl http://localhost:3001/health          # Auth Service
curl http://localhost:3002/health          # User Service
curl http://localhost:3000/metrics         # Prometheus metrics

# Auth flow
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234","name":"Test User"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
```

### Manual Browser Verification
1. Open `http://localhost:5173` → See the Login page with dark-mode UI
2. Register a new account → Should redirect to Dashboard
3. Dashboard should show RTK Query data loaded from the user service
4. Open `http://localhost:9090` → Prometheus targets all UP
5. Open `http://localhost:3001` (Grafana, admin/admin) → See Node.js metrics dashboard

### Kubernetes (optional local via minikube)
```bash
minikube start
kubectl apply -f infra/k8s/
kubectl get pods -n fullstack-platform
```
