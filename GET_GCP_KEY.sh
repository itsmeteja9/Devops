#!/bin/bash
################################################################################
# Script to Create GCP Service Account and Get the Key for GitHub Actions
################################################################################

set -e  # Exit on any error

PROJECT_ID="devops-504816"
SERVICE_ACCOUNT_NAME="github-actions"
KEY_FILE="github-actions-key.json"

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  GCP Service Account Setup for GitHub Actions"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Set the project
echo "📍 Step 1: Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID
echo "✓ Project set to $PROJECT_ID"
echo ""

# Step 2: Create service account
echo "📍 Step 2: Creating service account '$SERVICE_ACCOUNT_NAME'..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_NAME@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    echo "ℹ️  Service account already exists, skipping creation"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Service Account" \
        --description="Service account for GitHub Actions CI/CD pipeline"
    echo "✓ Service account created: $SERVICE_ACCOUNT_NAME"
fi
echo ""

# Step 3: Grant required IAM roles
echo "📍 Step 3: Granting IAM roles to service account..."

echo "  • Granting Kubernetes Engine Developer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/container.developer" \
    --condition=None \
    --quiet 2>/dev/null || echo "    ℹ️  Role may already be assigned"

echo "  • Granting Artifact Registry Administrator role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin" \
    --condition=None \
    --quiet 2>/dev/null || echo "    ℹ️  Role may already be assigned"

echo "  • Granting Artifact Registry Repository Administrator role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.repositoryAdmin" \
    --condition=None \
    --quiet 2>/dev/null || echo "    ℹ️  Role may already be assigned"

echo "✓ IAM roles granted"
echo ""

# Step 4: Create and download key
echo "📍 Step 4: Creating service account key..."
if [ -f "$KEY_FILE" ]; then
    echo "⚠️  Key file already exists: $KEY_FILE"
    read -p "Do you want to create a new key? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key file: $KEY_FILE"
    else
        gcloud iam service-accounts keys create $KEY_FILE \
            --iam-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
        echo "✓ New key created: $KEY_FILE"
    fi
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    echo "✓ Key created: $KEY_FILE"
fi
echo ""

# Step 5: Display the key
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  📋 KEY CONTENT (Copy this entire JSON to GitHub)"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
cat $KEY_FILE
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Step 6: Instructions
echo "✅ SETUP COMPLETE!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy the JSON content above (or from file: $KEY_FILE)"
echo ""
echo "2. Go to GitHub:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "3. Click 'New repository secret'"
echo ""
echo "4. Fill in:"
echo "   Name:  GCP_SA_KEY"
echo "   Value: [Paste the entire JSON content from above]"
echo ""
echo "5. Click 'Add secret'"
echo ""
echo "6. Done! Your GitHub Actions can now authenticate to GCP."
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"

# Optional: Copy to clipboard on macOS
if command -v pbcopy &> /dev/null; then
    echo ""
    echo "💡 Tip: On macOS, copy the key to clipboard:"
    echo "   cat $KEY_FILE | pbcopy"
fi

# Optional: Copy to clipboard on Linux (if xclip installed)
if command -v xclip &> /dev/null; then
    echo ""
    echo "💡 Tip: On Linux, copy the key to clipboard:"
    echo "   cat $KEY_FILE | xclip -selection clipboard"
fi

echo ""
