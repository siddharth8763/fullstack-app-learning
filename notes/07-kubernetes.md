# Kubernetes Interview Notes

## Core Concepts

### What is Kubernetes?
- **Container Orchestration**: Automates deployment, scaling, management
- **Portable**: Runs on any cloud, on-premises, hybrid
- **Extensible**: Custom resources, operators
- **Self-healing**: Automatically restarts failed containers

```yaml
# Basic Pod example
apiVersion: v1
kind: Pod
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  containers:
  - name: web-app
    image: nginx:1.21
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### Kubernetes Architecture
- **Master Node**: Control plane components
  - **API Server**: Central management interface
  - **etcd**: Distributed key-value store
  - **Scheduler**: Assigns pods to nodes
  - **Controller Manager**: Runs controllers
- **Worker Nodes**: Run application pods
  - **kubelet**: Agent on each node
  - **kube-proxy**: Network proxy
  - **Container Runtime**: Docker, containerd

## Core Objects

### Pods
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
  labels:
    app: multi-container
spec:
  containers:
  - name: web-server
    image: nginx:1.21
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-data
      mountPath: /usr/share/nginx/html
  - name: content-sidecar
    image: busybox
    command: ["/bin/sh"]
    args:
      - -c
      - >
        while true; do
          echo "Time: $(date)" > /shared/index.html;
          sleep 30;
        done
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  volumes:
  - name: shared-data
    emptyDir: {}
```

### Deployments
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
  labels:
    app: web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx:1.21
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

### Services
```yaml
# ClusterIP Service
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP

---
# NodePort Service
apiVersion: v1
kind: Service
metadata:
  name: web-nodeport
spec:
  selector:
    app: web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30080
  type: NodePort

---
# LoadBalancer Service
apiVersion: v1
kind: Service
metadata:
  name: web-loadbalancer
spec:
  selector:
    app: web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

## Advanced Objects

### ConfigMaps and Secrets
```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "postgresql://localhost:5432/myapp"
  log_level: "info"
  config.yaml: |
    server:
      port: 8080
      host: "0.0.0.0"
    database:
      pool_size: 10

---
# Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database_password: cGFzc3dvcmQxMjM=  # base64 encoded
  api_key: YXBpLWtleS12YWx1ZQ==

---
# Pod using ConfigMap and Secret
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    - name: DATABASE_URL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database_url
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: database_password
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

### Persistent Volumes
```yaml
# PersistentVolume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: data-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /data/app

---
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard

---
# Pod using PVC
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: data-storage
      mountPath: /data
  volumes:
  - name: data-storage
    persistentVolumeClaim:
      claimName: data-pvc
```

### StatefulSets
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
spec:
  serviceName: "database"
  replicas: 3
  selector:
    matchLabels:
      app: database
  template:
    metadata:
      labels:
        app: database
    spec:
      containers:
      - name: database
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: myapp
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

## Networking

### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - example.com
    secretName: app-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

## Scaling and Auto-scaling

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

### Vertical Pod Autoscaler
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-deployment
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: web
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
```

## Security

### RBAC
```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account

---
# Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: app-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-role-binding
  namespace: default
subjects:
- kind: ServiceAccount
  name: app-service-account
  namespace: default
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io
```

### Pod Security Policies
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

## Common Interview Questions

### Q: What is the difference between Deployment and StatefulSet?
A: 
**Deployment:**
- Stateless applications
- Random pod names
- No stable network identity
- No ordered deployment/scaling

**StatefulSet:**
- Stateful applications (databases)
- Predictable pod names (web-0, web-1)
- Stable network identity
- Ordered deployment/scaling

### Q: How does Kubernetes handle service discovery?
A: Service discovery methods:
- **Environment variables**: Injected into pods
- **DNS**: Built-in DNS service (kube-dns/CoreDNS)
- **ClusterIP**: Internal load balancing
- **Headless Service**: Direct pod discovery

### Q: What is a Kubernetes Operator?
A: Operator is a method of packaging, deploying, and managing a Kubernetes application:
- **Custom Resource**: Application-specific API
- **Controller**: Reconciles desired vs actual state
- **Domain knowledge**: Encodes operational knowledge
- **Automation**: Self-healing, scaling, backups

### Q: How does Kubernetes handle rolling updates?
A: Rolling update process:
1. **Create new ReplicaSet** with updated pod template
2. **Gradually scale up** new ReplicaSet
3. **Gradually scale down** old ReplicaSet
4. **Monitor health** during rollout
5. **Rollback** if issues detected

### Q: What is the difference between ConfigMap and Secret?
A: 
**ConfigMap:**
- Non-sensitive configuration data
- Stored as plain text
- Base64 encoded (not encrypted)
- Environment variables or files

**Secret:**
- Sensitive data (passwords, tokens)
- Base64 encoded (not encrypted by default)
- Can be encrypted at rest
- Access controlled by RBAC

## Advanced Topics

### Custom Resources
```yaml
# Custom Resource Definition
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              engine:
                type: string
                enum: ["mysql", "postgresql"]
              size:
                type: string
                pattern: "^[0-9]+Gi$"
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database

---
# Custom Resource
apiVersion: example.com/v1
kind: Database
metadata:
  name: my-database
spec:
  engine: mysql
  size: 10Gi
```

### Operators
```go
// Operator controller example (simplified)
package controller

import (
    "context"
    "fmt"
    
    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "sigs.k8s.io/controller-runtime/pkg/controller"
    "sigs.k8s.io/controller-runtime/pkg/handler"
    "sigs.k8s.io/controller-runtime/pkg/manager"
    "sigs.k8s.io/controller-runtime/pkg/reconcile"
    "sigs.k8s.io/controller-runtime/pkg/source"
)

func Add(mgr manager.Manager) error {
    return controller.New("database-controller", mgr, controller.Options{
        Reconciler: &Reconciler{client: mgr.GetClient()},
    }).Watch(&source.Kind{Type: &corev1.Pod{}}, &handler.EnqueueRequestForObject{})
}

type Reconciler struct {
    client client.Client
}

func (r *Reconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
    // Reconciliation logic
    return reconcile.Result{}, nil
}
```

## Best Practices

### Resource Management
```yaml
# Always set resource requests and limits
resources:
  requests:
    memory: "64Mi"
    cpu: "250m"
  limits:
    memory: "128Mi"
    cpu: "500m"

# Use liveness and readiness probes
livenessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Security Best Practices
```yaml
# Use non-root users
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000

# Drop unnecessary capabilities
securityContext:
  capabilities:
    drop:
    - ALL
    add:
    - NET_BIND_SERVICE

# Use read-only filesystem
securityContext:
  readOnlyRootFilesystem: true

# Mount secrets as volumes
volumeMounts:
- name: secrets
  mountPath: /etc/secrets
  readOnly: true
```

### Monitoring and Logging
```yaml
# Add labels for monitoring
metadata:
  labels:
    app: web
    version: v1.0.0
    team: frontend

# Structured logging
env:
- name: LOG_FORMAT
  value: "json"
- name: LOG_LEVEL
  value: "info"

# Prometheus metrics
ports:
- name: metrics
  containerPort: 9090
```

## Commands Cheat Sheet

### Basic Commands
```bash
# Get cluster info
kubectl cluster-info
kubectl get nodes
kubectl get namespaces

# Resource management
kubectl get pods,svc,deployments
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- sh

# Apply and delete
kubectl apply -f deployment.yaml
kubectl delete -f deployment.yaml
kubectl delete pod <pod-name>

# Scaling
kubectl scale deployment <deployment-name> --replicas=5
kubectl autoscale deployment <deployment-name> --min=2 --max=10 --cpu-percent=70
```

### Troubleshooting
```bash
# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Debug pods
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl exec -it <pod-name> -- sh

# Check resources
kubectl top nodes
kubectl top pods
kubectl get pods -o wide

# Network debugging
kubectl port-forward <pod-name> 8080:80
kubectl get endpoints
kubectl get ingress
```

## Additional Topics

### Helm (Kubernetes Package Manager)
- **Helm Charts**: Pre-configured templates for Kubernetes resources. Like `npm` for K8s.
- **Values file**: Parameterize your manifests for different environments.
- **Release**: A running instance of a chart with a specific configuration.

```bash
# Install a chart
helm install my-release bitnami/nginx --set service.type=LoadBalancer

# Upgrade a release
helm upgrade my-release bitnami/nginx --set replicaCount=3

# Rollback
helm rollback my-release 1

# List releases
helm list
```

### StatefulSets vs Deployments
| Feature | Deployment | StatefulSet |
|---|---|---|
| Pod Identity | Random names (`app-xyz123`) | Stable, ordered names (`app-0`, `app-1`) |
| Storage | Shared or no persistent storage | Each pod gets its own PersistentVolumeClaim |
| Scaling | Parallel creation/deletion | Ordered, sequential (waits for previous pod to be ready) |
| Use Case | Stateless apps (web servers, APIs) | Stateful apps (databases, Kafka, Redis clusters) |
| DNS | Single service DNS | Each pod gets a stable DNS name |

### DaemonSets
- Ensures a copy of a pod runs on **every node** in the cluster (or a subset of nodes).
- **Use Case**: Log collectors (Fluentd), monitoring agents (Prometheus Node Exporter), network proxies (kube-proxy).
- When a new node is added to the cluster, the DaemonSet automatically schedules a pod on it.

### Jobs and CronJobs
- **Job**: Runs a pod to completion (one-time task). Retries on failure.
  - Use Case: Database migrations, data processing, batch jobs.
- **CronJob**: Schedules Jobs on a cron-like schedule.
  - Use Case: Nightly database backups, periodic report generation.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
spec:
  schedule: "0 2 * * *"   # Every day at 2:00 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: mysql:8.0
            command: ["sh", "-c", "mysqldump -h db-host mydb > /backup/dump.sql"]
          restartPolicy: OnFailure
```

### Horizontal Pod Autoscaler (HPA)
- Automatically scales the number of pod replicas based on CPU, memory, or custom metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### ConfigMaps and Secrets
- **ConfigMap**: Store non-sensitive configuration data (environment variables, config files).
- **Secret**: Store sensitive data (passwords, API keys, TLS certs). Base64-encoded (NOT encrypted by default).
- Both can be mounted as environment variables or as files inside containers.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "mysql-service"
  LOG_LEVEL: "info"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=   # base64 encoded
```

### Resource Requests and Limits
- **Requests**: The minimum resources guaranteed for a pod. Used by the scheduler to place pods.
- **Limits**: The maximum resources a pod can consume. Exceeding memory limit = OOMKilled.

```yaml
resources:
  requests:
    cpu: "250m"      # 0.25 CPU cores
    memory: "128Mi"  # 128 MiB RAM
  limits:
    cpu: "500m"      # 0.5 CPU cores
    memory: "256Mi"  # 256 MiB RAM
```

### Liveness vs Readiness vs Startup Probes
| Probe | Purpose | Failure Action |
|---|---|---|
| **Liveness** | Is the container still alive? | Restart the container |
| **Readiness** | Is the container ready to serve traffic? | Remove from Service endpoints (no traffic) |
| **Startup** | Has the container finished starting? | Block other probes until startup succeeds |

## Additional Interview Questions

### Q: What happens when a node fails in Kubernetes?
 A: The node controller detects the failure (no heartbeat for ~5 minutes). It marks the node as `NotReady` and evicts all pods. The Deployment controller then schedules replacement pods on healthy nodes. For StatefulSets, pods are NOT automatically rescheduled until the failed node is confirmed dead.

### Q: What is a Kubernetes Namespace?
A: A virtual partition within a cluster for resource isolation. Used to separate environments (dev, staging, prod) or teams. Resources in different namespaces are isolated by default but can communicate via DNS (`service-name.namespace.svc.cluster.local`).

### Q: How does Kubernetes service discovery work?
A: Kubernetes provides built-in DNS. Every Service gets a DNS entry: `<service-name>.<namespace>.svc.cluster.local`. Pods use this to communicate. Environment variables (`SERVICE_HOST`, `SERVICE_PORT`) are also injected into pods automatically.
