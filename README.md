# Helm Demo App

A simple demo application showcasing Helm deployment on Google Kubernetes Engine (GKE).

## 📦 Structure

```
helm-demo/
├── app.js              # Express app
├── server.js           # Server entry point
├── package.json        # Node dependencies
├── Dockerfile          # Docker image
└── helm/
    └── helm-demo/
        ├── Chart.yaml         # Helm chart metadata
        ├── values.yaml        # Default values
        └── templates/         # Kubernetes templates
            ├── deployment.yaml
            ├── service.yaml
            ├── ingress.yaml
            ├── hpa.yaml
            ├── serviceaccount.yaml
            └── _helpers.tpl
```

## 🚀 Quick Start

### Build locally
```bash
cd helm-demo
docker build -t helm-demo .
docker run -p 8080:8080 helm-demo
```

### Deploy to GKE with Helm
```bash
# Get GKE credentials
gcloud container clusters get-credentials hello-world-gke --zone us-central1-a

# Deploy
helm upgrade --install helm-demo ./helm/helm-demo \
  --namespace helm-demo \
  --values helm/helm-demo/values.yaml \
  --set image.tag=v1.0.0 \
  --wait

# Check deployment
kubectl get all -n helm-demo

# View logs
kubectl logs -n helm-demo deployment/helm-demo
```

## 📊 Values

Edit `helm/helm-demo/values.yaml` to customize:
- `replicaCount` - Number of pod replicas
- `image.repository` - Docker image path
- `resources` - CPU/Memory limits
- `autoscaling` - Min/Max replicas
- `ingress` - External access configuration

## 🔄 Update Deployment

```bash
# Scale replicas
kubectl scale deployment helm-demo -n helm-demo --replicas=5

# Restart pods
kubectl rollout restart deployment/helm-demo -n helm-demo

# Update image
helm upgrade helm-demo ./helm/helm-demo \
  --namespace helm-demo \
  --set image.tag=v1.1.0
```

## 🧹 Cleanup

```bash
# Delete Helm release
helm uninstall helm-demo -n helm-demo

# Delete namespace
kubectl delete namespace helm-demo
```

## 📝 GitHub Actions

The workflow `.github/workflows/helm-demo-deploy.yml` automatically:
1. Builds Docker image on push to `helm-demo/`
2. Pushes to Google Artifact Registry
3. Deploys to GKE using Helm
4. Verifies deployment is healthy

---

**Separate from**: The main `hello-world` application (which has its own Helm chart and deployment)
