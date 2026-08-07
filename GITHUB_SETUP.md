# GitHub Configuration Guide

This document covers all required secrets and variables needed for the CI/CD pipeline.

---

## 🔐 GitHub Secrets Setup

### Location
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets

#### 1. **GCP_SA_KEY** ⭐ (REQUIRED)
**Purpose**: GCP Service Account credentials for authentication

**Value**: JSON key from your GCP Service Account
```json
{
  "type": "service_account",
  "project_id": "devops-504816",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "github-actions@devops-504816.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

**How to create**:
```bash
# In Google Cloud Console / Cloud Shell
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions Service Account"

gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@devops-504816.iam.gserviceaccount.com

# Copy entire contents of key.json to the GitHub secret
cat key.json
```

**Required IAM Roles**:
- `roles/container.developer` (GKE access)
- `roles/artifactregistry.admin` (Artifact Registry access)
- `roles/storage.admin` (Terraform state bucket)

---

#### 2. **SONAR_TOKEN** (Optional - for SonarQube/SonarCloud)
**Purpose**: Authentication token for code quality scanning

**Value**: Your SonarCloud or SonarQube token

**How to get**:
- **SonarCloud**: https://sonarcloud.io/account/security
  - Click "Generate" under "User tokens"
  - Give it a name like "GitHub Actions"
  - Copy the token value

- **SonarQube (Self-hosted)**:
  - Log in to your SonarQube instance
  - Go to **Administration** → **Security** → **Users**
  - Select your user → **Tokens**
  - Click "Generate"

**When to set**: Only if you want SonarQube/SonarCloud analysis in the pipeline

---

#### 3. **SONAR_HOST_URL** (Optional - if using self-hosted SonarQube)
**Purpose**: URL to your SonarQube instance

**Value Examples**:
- SonarCloud: `https://sonarcloud.io` (automatically configured, but you can override)
- Self-hosted: `https://sonarqube.your-domain.com`

**When to set**: Only if using self-hosted SonarQube (not needed for SonarCloud)

---

#### 4. **DD_API_KEY** (Optional - for Datadog monitoring)
**Purpose**: Datadog API key for application monitoring

**Value**: Your Datadog API key

**How to get**:
1. Go to https://app.datadoghq.com/organization/settings/api-keys
2. Click "New API Key"
3. Name it "GitHub Actions"
4. Copy the key value

**When to set**: Only if you want Datadog monitoring enabled in GKE

---

## 📋 GitHub Variables Setup

### Location
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository variable**

### Optional Variables

#### 1. **DD_SITE** (Optional - if using Datadog)
**Purpose**: Datadog site configuration

**Value**: One of:
- `datadoghq.com` (US region - default)
- `datadogheu.com` (EU region)
- `us3.datadoghq.com` (US region 3)
- `us5.datadoghq.com` (US region 5)

**When to set**: Only if using Datadog monitoring

---

## ✅ Complete Secrets Checklist

Print this checklist and mark as you add each secret:

```
REQUIRED:
☐ GCP_SA_KEY                   (GitHub Actions service account JSON key)

OPTIONAL (Code Quality):
☐ SONAR_TOKEN                  (SonarCloud/SonarQube authentication token)
☐ SONAR_HOST_URL               (SonarQube instance URL - only if self-hosted)

OPTIONAL (Monitoring):
☐ DD_API_KEY                   (Datadog API key)

OPTIONAL (Variables):
☐ DD_SITE                      (Datadog region - datadoghq.com or datadogheu.com)
```

---

## 🛠️ Environment Variables (Already in Workflow)

These are **hardcoded in the workflow** and don't need GitHub configuration:

```yaml
env:
  GCP_PROJECT_ID: devops-504816      # Your GCP project ID
  GCP_REGION: us-central1             # Your GCP region
  GAR_REPOSITORY: devops-images       # Artifact Registry repo name
  GKE_CLUSTER: devops-gke             # GKE cluster name
  DEPLOYMENT_NAME: hello-world        # Kubernetes deployment name
  HELM_RELEASE: hello-world           # Helm release name
  DOCKER_IMAGE_NAME: hello-world      # Docker image name
```

---

## 📝 Step-by-Step GitHub Setup

### 1️⃣ Add GCP_SA_KEY (Required)
```
Name: GCP_SA_KEY
Value: [Paste entire JSON key file contents]
```

### 2️⃣ Add SONAR_TOKEN (Optional)
```
Name: SONAR_TOKEN
Value: [Your SonarCloud/SonarQube token]
```

### 3️⃣ Add DD_API_KEY (Optional)
```
Name: DD_API_KEY
Value: [Your Datadog API key]
```

### 4️⃣ Add DD_SITE Variable (Optional)
```
Name: DD_SITE
Value: datadoghq.com
```

---

## 🔍 Verify Setup

### Check if secrets are configured:
```bash
# List repository secrets (requires GitHub CLI)
gh secret list
```

### Expected output:
```
GCP_SA_KEY          ✓ Set
SONAR_TOKEN         ✗ Not set (optional)
DD_API_KEY          ✗ Not set (optional)
```

---

## 🚀 Workflow Behavior Based on Secrets

| Stage | GCP_SA_KEY | SONAR_TOKEN | DD_API_KEY | Status |
|-------|:----------:|:-----------:|:----------:|--------|
| Unit Tests | ✓ | - | - | Always runs |
| SonarQube | ✓ | ✓ | - | Skips if SONAR_TOKEN missing |
| Terraform Validation | ✓ | - | - | Always runs |
| Build & Push | ✓ | - | - | Only on main branch |
| Deploy to GKE | ✓ | - | ✓ | Only on main branch |
| Datadog Config | ✓ | - | ✓ | Skips if DD_API_KEY missing |

---

## ⚠️ Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for sensitive data (API keys, credentials)
3. **Rotate keys regularly** (quarterly recommended)
4. **Limit secret access** to required workflows only
5. **Use separate service accounts** for each environment (dev/staging/prod)
6. **Monitor secret usage** in GitHub Actions logs

---

## 🆘 Troubleshooting

### "GCP_SA_KEY not found" error
- ✅ Check secret is added to GitHub Settings
- ✅ Check workflow uses `${{ secrets.GCP_SA_KEY }}`
- ✅ Push changes to main branch
- ✅ Re-run the workflow

### "SONAR_TOKEN not configured"
- This is **expected** if you haven't added the secret
- The pipeline will skip SonarQube analysis gracefully
- Add the secret when you want to enable SonarQube

### "Datadog monitoring not configured"
- This is **expected** if you haven't added DD_API_KEY
- The pipeline will skip Datadog setup gracefully
- Add the secret when you want to enable Datadog monitoring

---

## 📚 Related Documentation

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GCP Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [SonarCloud Setup](https://sonarcloud.io/account/security)
- [Datadog API Keys](https://docs.datadoghq.com/api/latest/)

