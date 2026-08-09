# Complete DevOps POC - Step by Step Guide

**This guide will set up:**
- ✅ Fresh GCP Project
- ✅ GitHub Actions CI/CD Pipeline
- ✅ SonarQube (Code Coverage, Duplicates, Reliability, Maintainability)
- ✅ Datadog Integration (APM, Logs, Metrics)
- ✅ Terraform Infrastructure as Code
- ✅ GKE Deployment with Helm
- ✅ Complete Observability

**Estimated Time: 1-2 hours**

---

## **PHASE 1: GCP PROJECT SETUP (10 minutes)**

### **Step 1.1: Create GCP Project**

```bash
# Create unique project ID (replace with your name)
PROJECT_ID="devops-poc-$(date +%s)"
PROJECT_NAME="DevOps POC"

# Create project
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Set as active
gcloud config set project $PROJECT_ID

# Save project ID for later
echo "PROJECT_ID=$PROJECT_ID" > .env.gcp
```

### **Step 1.2: Enable Required APIs**

```bash
# Enable all required services
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  serviceusage.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### **Step 1.3: Create Service Account**

```bash
PROJECT_ID=$(gcloud config get-value project)

# Create GitHub Actions service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/container.developer

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/artifactregistry.admin

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/compute.admin

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/iam.securityAdmin

# Create JSON key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Display key (copy this)
echo "=== GCP_SA_KEY (Copy this to GitHub Secret) ==="
cat key.json
```

---

## **PHASE 2: SONARQUBE SETUP (15 minutes)**

### **Step 2.1: Create SonarCloud Account**

1. Go to: **https://sonarcloud.io**
2. Sign up with GitHub
3. Select "Import projects from GitHub"
4. Install GitHub App
5. Authorize your repository

### **Step 2.2: Get SonarCloud Tokens**

```bash
# Go to: https://sonarcloud.io/account/security

# Generate token named "GitHub Actions"
# Copy the token (looks like: squ_1a2b3c4d...)

# Also get your Organization ID
# Go to: https://sonarcloud.io/organizations
# Click your org → Settings → Organization ID
```

### **Step 2.3: Create SonarCloud Project**

1. In SonarCloud, click "Create Project"
2. Select your repository
3. Choose "GitHub" as the location
4. Get the **Project Key** (e.g., `your-org_repo-name`)

---

## **PHASE 3: DATADOG SETUP (10 minutes)**

### **Step 3.1: Create Datadog Account**

1. Go to: **https://www.datadoghq.com**
2. Sign up (free tier available)
3. Go to: **Organization Settings → API Keys**
4. Create new API key named "GitHub Actions"
5. Copy the API key

### **Step 3.2: Get Datadog Site**

Check your Datadog URL:
- `https://app.datadoghq.com` → Use `datadoghq.com`
- `https://app.datadogheu.com` → Use `datadogheu.com`

---

## **PHASE 4: GITHUB CONFIGURATION (10 minutes)**

### **Step 4.1: Add GitHub Secrets**

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these **SECRETS** (the sensitive data):

| Secret Name | Value |
|------------|-------|
| `GCP_SA_KEY` | Entire JSON key from Step 1.3 |
| `SONAR_TOKEN` | SonarCloud token from Step 2.2 |
| `DD_API_KEY` | Datadog API key from Step 3.1 |

### **Step 4.2: Add GitHub Variables**

Go to: **Repository → Settings → Secrets and variables → Actions → Variables**

Add these **VARIABLES** (the non-sensitive config):

| Variable Name | Value |
|--------------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID from Step 1.1 |
| `SONAR_ORG` | Your SonarCloud org ID from Step 2.2 |
| `SONAR_PROJECT_KEY` | Your SonarCloud project key from Step 2.3 |
| `DD_SITE` | `datadoghq.com` or `datadogheu.com` from Step 3.2 |
| `GCP_REGION` | `us-central1` |
| `GKE_CLUSTER` | `devops-gke` |

---

## **PHASE 5: UPDATE LOCAL TERRAFORM (5 minutes)**

### **Step 5.1: Update terraform.tfvars**

Edit `terraform/terraform.tfvars`:

```hcl
project_id = "YOUR_PROJECT_ID"  # From Step 1.1
project_name = "devops-poc"
region = "us-central1"
```

---

## **PHASE 6: PUSH CODE TO GITHUB (5 minutes)**

```bash
# From your local machine
cd C:\Users\parva\Devops

# Add all files
git add .

# Commit
git commit -m "Complete POC: SonarQube + Datadog + GKE + Terraform"

# Push to main
git push origin main
```

---

## **PHASE 7: MONITOR WORKFLOW EXECUTION (15-20 minutes)**

### **Step 7.1: Watch GitHub Actions**

1. Go to: **Repository → Actions**
2. Click the latest workflow run
3. Watch the pipeline:
   - ✅ Unit Tests (2 min)
   - ✅ SonarQube Scan (3-5 min)
   - ✅ Terraform Validation (2 min)
   - ✅ Docker Build & Push (5 min)
   - ✅ Image Security Scan (2 min)
   - ✅ GKE Deployment (3-5 min)

### **Step 7.2: Check SonarQube Results**

1. Go to: **SonarCloud → Your Project**
2. View:
   - 📊 Code Coverage percentage
   - 🔍 Duplicated Code
   - 🛡️ Security Hotspots
   - ⚙️ Maintainability Index
   - 🐛 Bugs Found
   - 📈 Overall Grade (A-E)

### **Step 7.3: Check Datadog Observability**

1. Go to: **Datadog Dashboard**
2. Navigate to:
   - **APM → Services** (see `devops-app` service)
   - **Logs → Live Tail** (see application logs)
   - **Metrics** (see memory, CPU, requests)
   - **Infrastructure** (see pod metrics)

---

## **PHASE 8: ACCESS YOUR APPLICATION (5 minutes)**

### **Step 8.1: Get Service IP**

```bash
# Authenticate to GCP
gcloud auth activate-service-account --key-file=key.json
gcloud config set project $(gcloud config get-value project)

# Get GKE credentials
gcloud container clusters get-credentials devops-gke --region=us-central1

# Get service external IP
kubectl get svc devops-app -n default

# Copy EXTERNAL-IP and open in browser
# http://<EXTERNAL-IP>
```

### **Step 8.2: Test Health Endpoints**

```bash
EXTERNAL_IP=$(kubectl get svc devops-app -n default -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health
curl http://$EXTERNAL_IP/health

# Test app info
curl http://$EXTERNAL_IP/api/info

# View logs
kubectl logs -n default deployment/devops-app
```

---

## **PHASE 9: VERIFY COMPLETE OBSERVABILITY**

### **Step 9.1: SonarQube Verification**

Check these metrics in SonarQube:

- ✅ **Code Coverage** (target: >80%)
- ✅ **Duplicated Lines** (target: <3%)
- ✅ **Reliability Rating** (target: A)
- ✅ **Security Hotspots** (review and fix)
- ✅ **Maintainability Index** (target: >70)
- ✅ **Cyclomatic Complexity** (lower is better)

### **Step 9.2: Datadog Verification**

Check these in Datadog:

- ✅ **Request Volume** (requests/min)
- ✅ **Response Time** (p50, p95, p99)
- ✅ **Error Rate** (% errors)
- ✅ **Memory Usage** (MB)
- ✅ **CPU Usage** (%)
- ✅ **Application Logs** (INFO, WARN, ERROR)
- ✅ **Traces** (distributed tracing)
- ✅ **Pod Metrics** (GKE integration)

---

## **PHASE 10: CLEANUP (Optional)**

### **Step 10.1: Delete All Resources**

```bash
PROJECT_ID=$(gcloud config get-value project)

# Delete GKE resources
kubectl delete deployment devops-app -n default
kubectl delete svc devops-app -n default

# Destroy Terraform infrastructure
cd terraform
terraform destroy -auto-approve

# Delete GCP project
gcloud projects delete $PROJECT_ID --quiet
```

---

## **TROUBLESHOOTING**

### **Workflow Failures**

| Error | Solution |
|-------|----------|
| `GCP_SA_KEY not found` | Check GitHub secret is added correctly |
| `SONAR_TOKEN not found` | Check GitHub secret is added (not variable) |
| `GKE cluster not found` | Wait 10-15 min for cluster to be created |
| `Datadog not configured` | OK - it's optional, skip if not needed |

### **SonarQube Issues**

```bash
# If project not found in SonarCloud:
# 1. Go to SonarCloud
# 2. Click "+" → "Create Project"
# 3. Select your repo
# 4. Update SONAR_PROJECT_KEY variable
```

### **Datadog Issues**

```bash
# If metrics not showing:
# 1. Check DD_API_KEY is correct
# 2. Wait 5 minutes for data to appear
# 3. Check pod logs: kubectl logs -n default deployment/devops-app
```

---

## **SUMMARY**

By following this guide, you'll have:

✅ **Automated CI/CD Pipeline** - Tests, builds, deploys automatically  
✅ **Code Quality Gates** - SonarQube scans every commit  
✅ **Full Observability** - Datadog tracks every request  
✅ **Infrastructure as Code** - Terraform manages GCP resources  
✅ **Kubernetes Deployment** - Helm charts on GKE  
✅ **Security Scanning** - Trivy scans Docker images  
✅ **Production Ready** - All best practices implemented  

---

## **NEXT STEPS**

1. ✅ Complete Phases 1-4 (GCP, SonarQube, Datadog, GitHub)
2. ✅ Run the workflow (Phase 6)
3. ✅ Monitor execution (Phase 7)
4. ✅ Verify results (Phase 8-9)
5. 📊 Review metrics in SonarQube and Datadog dashboards
6. 🔧 Make improvements based on findings
7. 📈 Track progress over time

---

## **QUICK REFERENCE**

```bash
# Check workflow status
gh run list --repo YOUR_REPO

# Watch SonarQube
https://sonarcloud.io/dashboard?id=YOUR_ORG_YOUR_REPO

# Watch Datadog
https://app.datadoghq.com/apm/services

# Access app
http://EXTERNAL_IP

# View logs
kubectl logs -f -n default deployment/devops-app

# Cleanup
gcloud projects delete PROJECT_ID --quiet
```

---

**Ready to start? Begin with PHASE 1!** 🚀
