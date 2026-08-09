# DevOps Application

A modern, production-ready Node.js application deployed on Kubernetes with complete CI/CD pipeline.

## Features

- ✅ **Containerized**: Multi-stage Docker build using distroless images
- ✅ **Kubernetes Ready**: Helm charts for easy deployment
- ✅ **Health Checks**: Liveness and readiness probes
- ✅ **Infrastructure as Code**: Terraform configuration for GCP
- ✅ **CI/CD Pipeline**: GitHub Actions automation
- ✅ **Auto-Scaling**: Horizontal Pod Autoscaler configured
- ✅ **Monitoring**: Application health endpoints

## Tech Stack

- **Runtime**: Node.js 24
- **Framework**: Express.js
- **Container**: Docker
- **Orchestration**: Kubernetes (GKE)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Cloud**: Google Cloud Platform

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start

# Run tests
npm test
```

Visit `http://localhost:8080`

### Docker

```bash
# Build image
docker build -t devops-app:latest .

# Run container
docker run -p 8080:8080 devops-app:latest
```

### Kubernetes (GKE)

```bash
# Deploy with Helm
helm install devops-app ./helm/hello-world \
  --namespace hello-world \
  --set image.repository="your-registry/devops-app"

# Check status
kubectl get pods -n hello-world
kubectl get svc -n hello-world
```

## API Endpoints

- `GET /` - Homepage
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /api/info` - Application information

## Project Structure

```
.
├── app.js              # Express application
├── server.js           # Server entry point
├── Dockerfile          # Container configuration
├── package.json        # Dependencies
├── public/             # Static files
│   ├── index.html      # Homepage
│   ├── styles.css      # Styling
│   └── client.js       # Frontend logic
├── terraform/          # Infrastructure as Code
│   ├── main.tf         # Main configuration
│   ├── variables.tf    # Variable definitions
│   └── terraform.tfvars # Variable values
└── helm/               # Kubernetes Helm charts
    └── hello-world/    # Chart configuration
```

## CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Unit Tests** - Run test suite
2. **Code Quality** - SonarQube analysis (optional)
3. **Infrastructure Validation** - Terraform checks
4. **Build & Push** - Docker image to Artifact Registry
5. **Security Scan** - Trivy vulnerability scan
6. **Deploy** - To GKE with Helm
7. **Monitoring** - Datadog setup (optional)

## Environment Variables

- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `DD_API_KEY` - Datadog API key (optional)

## Health Checks

### Liveness Probe
Checks if the application is running:
```bash
curl http://localhost:8080/health
```

### Readiness Probe
Checks if the application is ready to serve traffic:
```bash
curl http://localhost:8080/ready
```

## Deployment

### Prerequisites

- GCP Project with billing enabled
- Terraform installed
- kubectl configured
- Helm 3+ installed

### Deploy Infrastructure

```bash
cd terraform

# Initialize
terraform init -backend=false

# Plan
terraform plan

# Apply
terraform apply
```

### Deploy Application

```bash
# Get cluster credentials
gcloud container clusters get-credentials devops-gke --region=us-central1

# Deploy with Helm
helm upgrade --install devops-app ./helm/hello-world \
  --namespace hello-world \
  --create-namespace

# Check deployment
kubectl get all -n hello-world
```

## Monitoring

### View Logs
```bash
kubectl logs -n hello-world deployment/hello-world
```

### Port Forward
```bash
kubectl port-forward -n hello-world svc/hello-world 8080:80
```

### Check Status
```bash
kubectl get pods -n hello-world
kubectl get svc -n hello-world
```

## Cleanup

### Delete Kubernetes Resources
```bash
helm uninstall devops-app -n hello-world
kubectl delete namespace hello-world
```

### Destroy Infrastructure
```bash
cd terraform
terraform destroy
```

## License

MIT

## Author

DevOps Team
