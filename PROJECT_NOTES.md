# Task Manager — Project Notes

## Overview
A multi-container Task Manager app built for learning Docker, containers, and Kubernetes.

**Stack:**
- Frontend: React + Vite + Nginx
- Backend: Node.js + Express
- Database: PostgreSQL
- Cache: Redis

**Locations:**
- Local: `/Users/boomdeb/Claude/task-manager/`
- GitHub: `https://github.com/boomdeb37448/task-manager`
- VM: `192.168.1.136` (root / P@ssw0rd), Ubuntu 24.04

---

## Phase 1 — App Design
Chose Task Manager because it naturally needs multiple services (frontend, backend, database, cache), making it ideal for learning Docker multi-container setups and Kubernetes concepts.

---

## Phase 2 — Local Scaffolding
Created project structure on Mac:
- `Dockerfile` for each service (multi-stage build for frontend)
- `docker-compose.yml` wiring all 4 containers on `app-network`
- Task CRUD API: create, read, update, delete
- React UI for managing tasks

---

## Phase 3 — Deploy to Linux VM
- Installed Docker CE on Ubuntu 24.04 via official apt repository
- Copied files to VM via SCP
- Ran `docker compose up -d`
- All 4 containers running successfully

---

## Phase 4 — GitHub
- Created repo `task-manager` under account `boomdeb37448`
- Pushed all code to `main` branch via GitHub CLI (`gh`)

---

## Phase 5 — Dashboard Page
Added `/dashboard` route showing:
- SVG architecture diagram with live status dots per container
- Container cards: image, status, ports, CPU %, memory (MB)
- Auto-refresh every 5 seconds
- Backend reads Docker socket via `dockerode` npm package

**Key file:** `backend/src/routes/containers.js`

---

## Phase 6 — Kubernetes (minikube)
**On the VM:**

1. Expanded disk (VM had only ~2GB free):
   ```bash
   lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
   resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv
   ```

2. Installed minikube (docker driver):
   ```bash
   minikube start --driver=docker --force
   ```

3. Created K8s manifests in `/k8s/`:
   | File | Contents |
   |------|----------|
   | `01-namespace.yaml` | Namespace `task-manager` |
   | `02-configmap.yaml` | App environment config |
   | `03-secret.yaml` | DB password (base64) |
   | `04-postgres.yaml` | Deployment + PVC + ClusterIP Service |
   | `05-redis.yaml` | Deployment + ClusterIP Service |
   | `06-backend.yaml` | Deployment + ClusterIP Service |
   | `07-frontend.yaml` | Deployment + NodePort Service (:8080) |
   | `08-rbac.yaml` | ServiceAccount, Role, RoleBinding |

4. Built images inside minikube's Docker context (critical step):
   ```bash
   eval $(minikube docker-env)
   docker build -t task-manager-frontend:latest ./frontend
   docker build -t task-manager-backend:latest ./backend
   ```

5. Applied manifests:
   ```bash
   kubectl apply -f k8s/
   ```

6. Set up persistent port-forward via systemd:
   - File: `/etc/systemd/system/k8s-portforward.service`
   - Command: `kubectl port-forward -n task-manager svc/frontend 8080:80 --address=0.0.0.0`

7. Opened firewall:
   ```bash
   ufw allow 8080
   ```

**Access URL:** `http://192.168.1.136:8080`

---

## Phase 7 — Dashboard Updated for Kubernetes
Backend auto-detects environment at startup:

```js
const isK8s = fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
```

- **K8s mode:** calls K8s API via HTTPS using service account token, lists pods in namespace
- **Docker mode:** uses `dockerode` + Docker socket

RBAC setup (`08-rbac.yaml`):
- ServiceAccount: `backend-sa`
- Role: `pod-reader` (list/get pods)
- RoleBinding: binds `backend-sa` to `pod-reader`

---

## Phase 8 — K8s Architecture Diagram
SVG diagram updated to show real Kubernetes concepts:
- Dashed namespace boundary (`task-manager`)
- NodePort :8080 badge on the entry arrow (external traffic)
- Each pod box shows: status dot, pod name, image/port, service type (NodePort / ClusterIP)
- Live colored dots: green = running, red = stopped

---

## Phase 9 — Horizontal Pod Autoscaler (HPA)
Configured the backend to auto-scale between 1–3 pods based on CPU load.

**Changes made:**
- `k8s/06-backend.yaml` — added resource requests (100m CPU, 128Mi memory) so HPA can calculate percentages
- `k8s/09-hpa.yaml` — HPA: min 1 pod, max 3 pods, scale up when CPU > 50%
- Architecture diagram updated to show HPA alongside the Backend pod

**How it works:**
1. metrics-server addon collects CPU/memory from each pod every 15s
2. HPA checks metrics every 30s and calculates desired replicas
3. If CPU > 50%: scale up immediately
4. If CPU < 50%: wait 5-minute cooldown before scaling down (prevents flapping)

**Enable metrics-server:**
```bash
minikube addons enable metrics-server
```

**What we observed during the test:**
| Event | CPU | Replicas |
|-------|-----|----------|
| Idle | 3% | 1 |
| Load test started | 206% | 1 → 3 (within ~75s) |
| Load spread across 3 pods | 62% | 3 |
| Load test stopped | 1% | 3 (cooldown) |
| After 5-min cooldown | 3% | 3 → 1 |

---

## Phase 10 — Ingress Controller
Replaced NodePort on the frontend service with a proper nginx Ingress Controller.

**What changed:**
- `k8s/07-frontend.yaml` — Service changed from `NodePort` → `ClusterIP` (no longer directly exposed)
- `k8s/10-ingress.yaml` — Ingress resource: routes all `/*` traffic to frontend service
- systemd port-forward updated to target `ingress-nginx-controller` instead of `frontend`
- Architecture diagram updated: Ingress Controller box shown above the namespace boundary

**Before (NodePort):**
```
Browser → NodePort :8080 → Frontend Service (NodePort) → Frontend Pod
```

**After (Ingress):**
```
Browser → NodePort :8080 → Ingress Controller (nginx) → Frontend Service (ClusterIP) → Frontend Pod
```

**Why Ingress is better than NodePort:**
- Single entry point for all traffic — no port per service
- Can route by path or hostname (e.g. `/api` → backend, `/` → frontend)
- Supports TLS termination in one place
- Standard in production clusters (EKS, GKE, AKS all use it)

**Key files:**
- Ingress resource: `k8s/10-ingress.yaml`
- Ingress controller lives in: `namespace: ingress-nginx` (installed via minikube addon)
- systemd service: `/etc/systemd/system/k8s-portforward.service`

**Fix needed for systemd:** kubectl needs `KUBECONFIG` explicitly set when run by systemd (minimal environment):
```ini
[Service]
Environment="KUBECONFIG=/root/.kube/config"
```

---

## Phase 11 — CI/CD with GitHub Actions
Every `git push` to `main` now automatically builds images and deploys to Kubernetes.

**Why self-hosted runner?**
The VM is on a private network (192.168.1.x) — GitHub's cloud runners can't SSH into it. A self-hosted runner runs ON the VM and connects OUT to GitHub, so no public access is needed.

**Components:**
- `.github/workflows/deploy.yml` — workflow definition
- GitHub Actions runner service on VM: `/root/actions-runner/`
- systemd service: `actions.runner.boomdeb37448-task-manager.vm-runner.service`

**Workflow steps (runs on every push to main):**
1. Checkout code (from GitHub to runner's workspace)
2. Build frontend image (inside minikube's Docker context)
3. Build backend image (inside minikube's Docker context)
4. Apply K8s manifests (`kubectl apply -f k8s/`)
5. Restart deployments (`kubectl rollout restart`)
6. Wait for rollout to complete
7. Verify pods are running

**Pipeline runs in ~36 seconds.**

**Runner setup commands (for reference):**
```bash
# On the VM
mkdir -p /root/actions-runner && cd /root/actions-runner
curl -sL https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-linux-x64-2.323.0.tar.gz | tar xz
RUNNER_ALLOW_RUNASROOT="1" ./config.sh \
  --url https://github.com/boomdeb37448/task-manager \
  --token <TOKEN_FROM_GITHUB> \
  --name vm-runner --unattended --replace
RUNNER_ALLOW_RUNASROOT="1" ./svc.sh install root
RUNNER_ALLOW_RUNASROOT="1" ./svc.sh start
```

**Get a new registration token (tokens expire after 1 hour):**
```bash
gh api repos/boomdeb37448/task-manager/actions/runners/registration-token -X POST --jq '.token'
```

---

## Phase 12 — Health Checks (Liveness & Readiness Probes)
Added probes to every service so Kubernetes knows when a pod is alive and when it's ready for traffic.

**Two types of probes:**

| Probe | Question K8s asks | Action on failure |
|-------|-------------------|-------------------|
| **Liveness** | "Is the pod still alive?" | Restart the container |
| **Readiness** | "Is the pod ready to receive traffic?" | Remove from Service load balancer (no restart) |

**Probe methods used:**
- `httpGet` — sends an HTTP GET request; pass = 2xx/3xx response
- `exec` — runs a command inside the container; pass = exit code 0

**Changes per service:**

| Service | Liveness | Readiness |
|---------|----------|-----------|
| **Frontend** | `httpGet /health` (nginx returns 200) | `httpGet /` (page loads) |
| **Backend** | `httpGet /health` (always ok if running) | `httpGet /ready` (checks DB connection) |
| **Postgres** | `exec pg_isready` | `exec pg_isready` |
| **Redis** | `exec redis-cli ping` | `exec redis-cli ping` |

**Backend `/ready` endpoint** checks the DB before saying it's ready:
```js
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', db: err.message });
  }
});
```
If the backend pod can't reach the database, K8s removes it from the load balancer — no traffic is sent to a pod that can't serve requests.

**RBAC additions** (`k8s/08-rbac.yaml`):
- Added `pods/log` (get) so backend can fetch logs via K8s API
- Added `deployments` (get, patch) so backend can trigger rolling restarts

**Dashboard changes:**
- Each pod card now shows a **"✓ Ready" (green)** or **"✗ Not Ready" (amber)** chip
- **Restart button** — triggers a K8s rolling restart by patching the deployment's `restartedAt` annotation
- **Logs button** — opens a slide-in panel with the last 100 log lines, color-coded by severity

**Important probe timing settings:**
- `initialDelaySeconds` — how long to wait before the first probe (give the container time to start)
- `periodSeconds` — how often to run the probe
- `failureThreshold` — how many consecutive failures before acting
- `timeoutSeconds` — how long to wait for a response

---

## Problems & Solutions

| Problem | Solution |
|---------|----------|
| Docker not found on VM | Installed Docker CE via official apt repo |
| VM disk full (~2GB free) | `lvextend` + `resize2fs` to expand LVM partition |
| Port-forward dying when SSH disconnects | Created systemd service to keep it alive |
| Port 8080 blocked externally | `ufw allow 8080` |
| Old image not updating in minikube | Always build inside minikube's Docker context: `eval $(minikube docker-env)` |
| Dashboard showed Docker socket error in K8s | Root cause was stale image — fixed by minikube docker-env build |
| Architecture diagram arrows overlapping boxes | Recalculated all SVG y-coordinates to align with box edges |
| SvcBadge overlapping pod title text | Removed SvcBadge, integrated service info as text lines inside taller boxes |

---

## Useful Commands

```bash
# SSH to VM
ssh root@192.168.1.136

# Check all pods
kubectl get pods -n task-manager

# Check services
kubectl get svc -n task-manager

# Rebuild and redeploy a service (must be on VM)
eval $(minikube docker-env)
docker build -t task-manager-frontend:latest ./frontend
kubectl rollout restart deployment/frontend -n task-manager

# Check port-forward service
systemctl status k8s-portforward

# Scale a deployment (e.g. scale redis to 0 to test dashboard)
kubectl scale deployment redis --replicas=0 -n task-manager
kubectl scale deployment redis --replicas=1 -n task-manager

# View logs
kubectl logs -n task-manager deployment/backend

# Check HPA status
kubectl get hpa -n task-manager

# Watch HPA in real time
kubectl get hpa -n task-manager -w

# Run a quick load test against backend
kubectl run load-test -n task-manager --image=busybox --restart=Never -- \
  /bin/sh -c "while true; do wget -q -O- http://backend:5000/api/tasks; done"

# Stop the load test
kubectl delete pod load-test -n task-manager

# Check pod CPU/memory usage
kubectl top pods -n task-manager

# Check ingress
kubectl get ingress -n task-manager
kubectl describe ingress task-manager-ingress -n task-manager

# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# Check probe configuration on a pod
kubectl describe pod -n task-manager -l app=backend | grep -A 12 "Liveness\|Readiness"

# Check if backend /health and /ready endpoints work
BACKEND_IP=$(kubectl get pod -n task-manager -l app=backend -o jsonpath="{.items[0].status.podIP}")
curl -s http://$BACKEND_IP:5000/health
curl -s http://$BACKEND_IP:5000/ready

# See live probe events (restart/readiness failures show here)
kubectl get events -n task-manager --sort-by='.lastTimestamp' | tail -20
```
