# Script to Create GCP Service Account and Get the Key for GitHub Actions
# Run this in PowerShell (as Administrator recommended)

$PROJECT_ID = "devops-504816"
$SERVICE_ACCOUNT_NAME = "github-actions"
$KEY_FILE = "github-actions-key.json"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  GCP Service Account Setup for GitHub Actions" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set the project
Write-Host "📍 Step 1: Setting GCP project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID
Write-Host "✓ Project set to $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Step 2: Check if service account exists
Write-Host "📍 Step 2: Checking/Creating service account '$SERVICE_ACCOUNT_NAME'..." -ForegroundColor Yellow

$saEmail = "$SERVICE_ACCOUNT_NAME@${PROJECT_ID}.iam.gserviceaccount.com"

$existingAccount = & gcloud iam service-accounts describe $saEmail 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "ℹ️  Service account already exists, skipping creation" -ForegroundColor Cyan
} else {
    Write-Host "  Creating new service account..." -ForegroundColor Gray
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME `
        --display-name="GitHub Actions Service Account" `
        --description="Service account for GitHub Actions CI/CD pipeline"
    Write-Host "✓ Service account created: $SERVICE_ACCOUNT_NAME" -ForegroundColor Green
}
Write-Host ""

# Step 3: Grant required IAM roles
Write-Host "📍 Step 3: Granting IAM roles to service account..." -ForegroundColor Yellow

$roles = @(
    "roles/container.developer",
    "roles/artifactregistry.admin",
    "roles/artifactregistry.repositoryAdmin"
)

foreach ($role in $roles) {
    Write-Host "  • Granting $($role.Split('/')[-1]) role..." -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$saEmail" `
        --role="$role" `
        --quiet 2>$null | Out-Null
}

Write-Host "✓ IAM roles granted" -ForegroundColor Green
Write-Host ""

# Step 4: Create and download key
Write-Host "📍 Step 4: Creating service account key..." -ForegroundColor Yellow

if (Test-Path $KEY_FILE) {
    Write-Host "⚠️  Key file already exists: $KEY_FILE" -ForegroundColor Yellow
    $response = Read-Host "Do you want to create a new key? (y/n)"

    if ($response -eq "y" -or $response -eq "Y") {
        gcloud iam service-accounts keys create $KEY_FILE `
            --iam-account="$saEmail"
        Write-Host "✓ New key created: $KEY_FILE" -ForegroundColor Green
    } else {
        Write-Host "Using existing key file: $KEY_FILE" -ForegroundColor Cyan
    }
} else {
    gcloud iam service-accounts keys create $KEY_FILE `
        --iam-account="$saEmail"
    Write-Host "✓ Key created: $KEY_FILE" -ForegroundColor Green
}
Write-Host ""

# Step 5: Display the key
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  📋 KEY CONTENT (Copy this entire JSON to GitHub)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$keyContent = Get-Content $KEY_FILE
Write-Host $keyContent

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 6: Instructions
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✓ Copy the JSON content above (or from file: $KEY_FILE)" -ForegroundColor White
Write-Host ""
Write-Host "2. Go to GitHub:" -ForegroundColor White
Write-Host "   https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Click 'New repository secret'" -ForegroundColor White
Write-Host ""
Write-Host "4. Fill in:" -ForegroundColor White
Write-Host "   Name:  GCP_SA_KEY" -ForegroundColor Cyan
Write-Host "   Value: [Paste the entire JSON content from above]" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Click 'Add secret'" -ForegroundColor White
Write-Host ""
Write-Host "6. Done! Your GitHub Actions can now authenticate to GCP." -ForegroundColor Green
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan

# Optional: Copy to clipboard on Windows
Write-Host ""
Write-Host "💡 Tip: Copy the key to Windows clipboard:" -ForegroundColor Yellow
Write-Host "   (Get-Content $KEY_FILE | Set-Clipboard)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then you can paste it directly in GitHub!" -ForegroundColor Green
Write-Host ""
