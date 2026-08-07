# DevOps - Terraform Infrastructure

Complete Terraform configuration for GCP infrastructure including:
- GKE Cluster
- Artifact Registry
- VPC and Networking
- Hello-World App Deployment with Helm

## 📋 Prerequisites

1. **GCP Project**: Create a GCP project
2. **Terraform**: Install Terraform >= 1.0
3. **gcloud CLI**: Install and configure gcloud
4. **kubectl**: Install kubectl
5. **Helm**: Install Helm 3+

## 🚀 Quick Start

### 1. Create Terraform state bucket
```bash
gsutil mb gs://devops-terraform-state
```

### 2. Update Configuration
Edit `terraform.tfvars`:
```hcl
project_id = "YOUR-PROJECT-ID"
region     = "us-central1"
```

### 3. Initialize Terraform
```bash
cd terraform
terraform init
```

### 4. Plan Infrastructure
```bash
terraform plan -out=tfplan
```

### 5. Apply Configuration
```bash
terraform apply tfplan
```

## 📦 What Gets Created

### Compute
- **GKE Cluster**: devops-gke
- **Node Pool**: 2-5 nodes (auto-scaling)
- **Machine Type**: n1-standard-2

### Networking
- **VPC**: devops-vpc
- **Subnet**: 10.0.0.0/20 with secondary ranges
- **Firewall Rules**: SSH access, internal traffic

### Container Registry
- **Artifact Registry**: devops-images

### Kubernetes
- **Namespace**: hello-world
- **Deployment**: hello-world app (3-10 replicas)
- **Service**: LoadBalancer
- **Auto-scaling**: HPA enabled

## 🔧 Configuration

Edit `terraform.tfvars` to customize:
- `project_id` - Your GCP project ID (REQUIRED)
- `region` - GCP region (default: us-central1)
- `machine_type` - Node machine type (default: n1-standard-2)
- `node_count` - Initial nodes (default: 2)
- `min_nodes` - Min auto-scaling nodes (default: 2)
- `max_nodes` - Max auto-scaling nodes (default: 5)

## 📝 Deploy Steps

```bash
# 1. Initialize
terraform init

# 2. Plan
terraform plan

# 3. Apply
terraform apply

# 4. Get credentials
gcloud container clusters get-credentials devops-gke --region us-central1

# 5. Check deployment
kubectl get all -n hello-world
```

## 🌐 Access Application

```bash
# Get the external IP
kubectl get svc hello-world -n hello-world

# Or port-forward
kubectl port-forward -n hello-world svc/hello-world 8080:80
```

## 🗑️ Cleanup

```bash
terraform destroy
```

## 📈 Useful Commands

```bash
# Check cluster status
kubectl cluster-info

# View all resources
kubectl get all -A

# Scale deployment
kubectl scale deployment hello-world -n hello-world --replicas=5

# Update deployment
helm upgrade hello-world ../helm/hello-world \
  --namespace hello-world \
  --set image.tag=v1.1.0

# View logs
kubectl logs -n hello-world deployment/hello-world
```

## 🔐 Security

- Non-root containers
- Read-only filesystem
- Service accounts with Workload Identity
- Network policies ready
- RBAC configured

## 🆘 Troubleshooting

### Terraform init fails
```bash
# Make sure you have the GCS bucket
gsutil ls gs://devops-terraform-state
```

### Pods not starting
```bash
kubectl describe pod POD_NAME -n hello-world
kubectl logs POD_NAME -n hello-world
```

### GKE cluster not ready
```bash
gcloud container clusters describe devops-gke --region us-central1
```

---

For more info, visit:
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
