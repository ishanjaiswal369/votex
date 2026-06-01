# VoteX 🗳️

A distributed microservices-based voting application built with Node.js, containerized with Docker, deployed on Kubernetes using KIND, with GitOps-based continuous delivery via ArgoCD and automated CI/CD pipelines using GitHub Actions.

---

## Architecture

```text
User votes on /vote
      ↓
Vote Service (Node.js) → pushes vote to Redis
      ↓
Worker Service (Node.js) → picks from Redis → saves to MySQL
      ↓
Result Service (Node.js) → reads MySQL → shows results on /result
```

---

## Services

| Service | Description | Tech |
|---|---|---|
| **vote** | Web UI to cast votes | Node.js, Express |
| **worker** | Background processor | Node.js |
| **result** | Web UI to view results | Node.js, Express |
| **redis** | Temporary vote queue | Redis Alpine |
| **mysql** | Permanent vote storage | MySQL 8 |

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MySQL 8
- **Cache/Queue:** Redis
- **Containerization:** Docker
- **Orchestration:** Kubernetes (KIND - Kubernetes IN Docker)
- **CI/CD:** GitHub Actions
- **GitOps:** ArgoCD
- **Cluster:** 1 Control Plane + 2 Worker Nodes

---

## Project Structure

```text
votex/
├── vote/                   # Vote service
│   ├── app.js
│   ├── Dockerfile
│   └── package.json
├── worker/                 # Worker service
│   ├── app.js
│   ├── Dockerfile
│   └── package.json
├── result/                 # Result service
│   ├── app.js
│   ├── Dockerfile
│   └── package.json
├── k8s/                    # Kubernetes manifests
│   ├── vote-deployment.yaml
│   ├── worker-deployment.yaml
│   ├── result-deployment.yaml
│   ├── mysql-deployment.yaml
│   └── redis-deployment.yaml
├── .github/
│   └── workflows/
│       ├── vote.yml        # CI/CD for vote service
│       ├── worker.yml      # CI/CD for worker service
│       └── result.yml      # CI/CD for result service
├── kind-config.yml         # KIND cluster configuration
└── docker-compose.yml      # Local development setup
```

---

## CI/CD Pipeline

Each service has its own independent GitHub Actions workflow with **path-based triggering**:

- Push changes to `vote/` → only vote workflow runs → builds and pushes `votex-vote:latest` to Docker Hub
- Push changes to `worker/` → only worker workflow runs → builds and pushes `votex-worker:latest` to Docker Hub
- Push changes to `result/` → only result workflow runs → builds and pushes `votex-result:latest` to Docker Hub

---

## GitOps with ArgoCD

ArgoCD watches the `k8s/` folder in this repository. Any change pushed to the `k8s/` folder is automatically detected and deployed to the Kubernetes cluster — no manual `kubectl apply` needed.

---

## How to Run Locally

### Prerequisites
- Docker
- Docker Compose

### Steps

```bash
git clone https://github.com/YOUR_USERNAME/votex.git
cd votex
docker-compose up --build
```

- Vote page: [http://localhost:5000/vote](http://localhost:5000/vote)
- Result page: [http://localhost:5001/result](http://localhost:5001/result)

---

## How to Deploy on Kubernetes

### Prerequisites
- Docker
- KIND
- kubectl

### 1. Create KIND Cluster

```bash
kind create cluster --name votex --config kind-config.yml
```

### 2. Verify Nodes

```bash
kubectl get nodes
```

You should see:

```text
votex-control-plane   Ready   control-plane
votex-worker          Ready   <none>
votex-worker2         Ready   <none>
```

### 3. Deploy All Services

```bash
kubectl apply -f k8s/
```

### 4. Access the App

```bash
# Terminal 1
kubectl port-forward service/vote 5000:3000

# Terminal 2
kubectl port-forward service/result 5001:3000
```

- Vote page: [http://localhost:5000/vote](http://localhost:5000/vote)
- Result page: [http://localhost:5001/result](http://localhost:5001/result)

---

## Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Access ArgoCD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Get admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Open [https://localhost:8080](https://localhost:8080) and login with username `admin`.

---

## GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password |

---

## Key Concepts Demonstrated

- **Microservices Architecture** — 5 independent services with single responsibilities
- **Containerization** — each service has its own Dockerfile
- **Container Orchestration** — Kubernetes manages deployment, scaling, and self-healing
- **CI/CD** — automated build and push on every code change
- **GitOps** — Git is the single source of truth for cluster state
- **Service Discovery** — services communicate by name inside Kubernetes
- **Retry Pattern** — worker retries MySQL connection until it's ready
- **Rolling Updates** — zero downtime deployments via Kubernetes
