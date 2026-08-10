terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${data.google_container_cluster.gke.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(data.google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
  }
}

resource "google_project_service" "required_apis" {
  for_each = toset([
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "secretmanager.googleapis.com"
  ])

  service            = each.value
  disable_on_destroy = false
}

data "google_compute_network" "vpc" {
  name    = "devops-vpc"
  project = var.project_id
}

data "google_compute_subnetwork" "subnet" {
  name    = "devops-subnet"
  region  = var.region
  project = var.project_id
}

data "google_container_cluster" "gke" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id
}

resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = var.artifact_registry_repo
  format        = "DOCKER"
  project       = var.project_id
}

data "google_service_account" "app_sa" {
  account_id = "devops-app"
  project    = var.project_id
}

resource "google_artifact_registry_repository_iam_member" "registry_access" {
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${data.google_service_account.app_sa.email}"
  location   = var.region
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "devops-db-password"

  labels = {
    environment = "production"
    app         = "devops"
  }

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_iam_member" "db_password_access" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_service_account.app_sa.email}"
}

output "gke_cluster_name" {
  value       = data.google_container_cluster.gke.name
  description = "GKE Cluster Name"
}

output "gke_cluster_host" {
  value       = data.google_container_cluster.gke.endpoint
  description = "GKE Cluster Host"
  sensitive   = true
}

output "artifact_registry_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
  description = "Artifact Registry URL"
}

output "app_service_account" {
  value       = data.google_service_account.app_sa.email
  description = "Application Service Account Email"
}

output "db_password_secret" {
  value       = google_secret_manager_secret.db_password.id
  description = "Database Password Secret ID"
}
