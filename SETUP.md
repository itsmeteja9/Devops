# Complete DevOps Setup Guide

This guide will walk you through setting up the entire DevOps infrastructure with GCP, Kubernetes, Terraform, GitHub Actions, SonarQube, and Datadog integration.

## Prerequisites

- GCP Account with billing enabled
- GitHub Repository
- Node.js 24+ installed locally
- `gcloud` CLI installed
- `kubectl` installed
- `helm` 3+ installed
- `terraform` 1.0+ installed

## Step 1: Create New GCP Project

```bash
# Create a new GCP project with a unique ID
gcloud projects create devops-app-prod --name="DevOps Application"

# Set as active project
gcloud config set project devops-app-prod

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable serviceusage.googleapis.com
```

## Step 2: Create GitHub Actions Service Account

```bash
# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# Grant Editor role (for development; restrict in production)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/editor

# Create JSON key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Display key for copying
cat key.json
```

## Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets

| Secret | Value |
|--------|-------|
| `GCP_SA_KEY` | Entire JSON key file content from above |

### Optional Secrets

| Secret | Value | Use Case |
|--------|-------|----------|
| `SONAR_TOKEN` | SonarCloud/SonarQube token | Code quality scanning |
| `SONAR_HOST_URL` | SonarQube host URL | Self-hosted SonarQube |
| `DD_API_KEY` | Datadog API key | Application monitoring |

## Step 4: Configure GitHub Variables

Add these variables to your GitHub repository (Settings → Secrets and variables → Actions → Variables):

| Variable | Value |
|----------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID (e.g., devops-app-prod) |
| `SONAR_PROJECT_KEY` | SonarCloud project key (optional) |
| `SONAR_ORG` | SonarCloud organization (optional) |
| `DD_SITE` | `datadoghq.com` or `datadogheu.com` (optional) |

## Step 5: Update Terraform Configuration

Edit `terraform/terraform.tfvars`:

```hcl
project_id = "YOUR_PROJECT_ID"  # Replace with your GCP project ID
```

## Step 6: Set Up SonarQube (Optional)

### Using SonarCloud (Free, Recommended)

1. Go to https://sonarcloud.io
2. Sign up with GitHub
3. Create organization (e.g., `your-org`)
4. Add `SONAR_ORG` as GitHub variable
5. Create project → copy project key
6. Add `SONAR_PROJECT_KEY` as GitHub variable
7. Generate token: Account → Security → Generate Token
8. Add `SONAR_TOKEN` as GitHub secret

### Using Self-Hosted SonarQube

1. Deploy SonarQube instance
2. Create project and organization
3. Generate token
4. Add `SONAR_TOKEN` and `SONAR_HOST_URL` as secrets

## Step 7: Set Up Datadog (Optional)

1. Go to https://www.datadoghq.com
2. Sign up for free account
3. Get API Key: Organization Settings → API Keys
4. Add `DD_API_KEY` as GitHub secret
5. Set `DD_SITE` as GitHub variable (default: `datadoghq.com`)

## Step 8: Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform (without remote state for simplicity)
terraform init -backend=false

# Review changes
terraform plan

# Apply configuration
terraform apply

# Wait for GKE cluster to be ready (10-15 minutes)
gcloud container clusters list --region us-central1

# Get cluster credentials
gcloud container clusters get-credentials devops-gke --region=us-central1
```

## Step 9: Push Code and Run Workflow

```bash
# Add all files
git add .

# Commit
git commit -m "Fresh DevOps setup with complete CI/CD integration"

# Push to main branch
git push origin main
```

The GitHub Actions workflow will automatically:
1. ✅ Run unit tests
2. ✅ Analyze code with SonarQube (if configured)
3. ✅ Validate Terraform
4. ✅ Build and push Docker image
5. ✅ Scan image with Trivy
6. ✅ Deploy to GKE
7. ✅ Configure Datadog monitoring (if configured)

## Step 10: Access Your Application

```bash
# Get service external IP
kubectl get svc devops-app -n default

# Open in browser
# Copy the EXTERNAL-IP and open: http://<EXTERNAL-IP>
```

## Verify Integrations

### SonarQube
```bash
# Open SonarCloud/SonarQube
# https://sonarcloud.io/projects (for SonarCloud)
# Look for your project and verify scan results
```

### Datadog
```bash
# Open Datadog dashboard
# https://app.datadoghq.com/apm/services
# Look for devops-app service
```

### GKE Cluster
```bash
# Check pods
kubectl get pods -n default

# Check deployments
kubectl get deployment -n default

# View logs
kubectl logs -n default deployment/devops-app

# Port forward for local testing
kubectl port-forward -n default svc/devops-app 8080:80
```

## Cleanup

### Delete Kubernetes Resources
```bash
kubectl delete deployment devops-app -n default
kubectl delete svc devops-app -n default
```

### Destroy Infrastructure
```bash
cd terraform
terraform destroy
```

### Delete GCP Project
```bash
gcloud projects delete devops-app-prod
```

## Troubleshooting

### Cluster Not Ready
```bash
# Check cluster status
gcloud container clusters describe devops-gke --region=us-central1

# Wait for operation to complete
gcloud container operations list --region=us-central1
```

### Deployment Failed
```bash
# Check pod status
kubectl describe pod <pod-name> -n default

# View logs
kubectl logs <pod-name> -n default

# Check events
kubectl describe deployment devops-app -n default
```

### Workflow Failures
1. Check GitHub Actions log
2. Verify GitHub secrets are set correctly
3. Verify Terraform configuration is correct
4. Check GCP project permissions

## Documentation

- [Terraform Documentation](terraform/README.md)
- [Application Documentation](README.md)
- [Helm Chart Values](helm/devops-app/values.yaml)

## Support

For issues or questions, refer to:
- [GCP Documentation](https://cloud.google.com/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Terraform Documentation](https://www.terraform.io/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SonarCloud Documentation](https://docs.sonarcloud.io)
- [Datadog Documentation](https://docs.datadoghq.com)
