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

  backend "gcs" {
    bucket = "devops-terraform-state"
    prefix = "gcp-infrastructure"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${google_container_cluster.primary.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
  }
}

data "google_client_config" "default" {}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "devops-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id

  depends_on = [google_project_service.required_apis]
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "devops-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.4.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.8.0.0/20"
  }
}

# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  depends_on = [google_project_service.required_apis]
}

# Node Pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  cluster    = google_container_cluster.primary.name
  location   = var.region
  node_count = var.node_count

  autoscaling {
    min_node_count = var.min_nodes
    max_node_count = var.max_nodes
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    preemptible  = var.preemptible
    machine_type = var.machine_type
    disk_size_gb = 50

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      environment = var.environment
      managed-by  = "terraform"
    }

    tags = ["gke-node", "devops"]
  }
}

# Artifact Registry
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = var.artifact_registry_repo
  description   = "Docker images for DevOps"
  format        = "DOCKER"
  project       = var.project_id

  depends_on = [google_project_service.required_apis]
}

# Service Account for Workload Identity
resource "google_service_account" "devops_ksa" {
  account_id   = "devops-ksa"
  display_name = "DevOps Kubernetes Service Account"
  project      = var.project_id
}

# Workload Identity Binding
resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.devops_ksa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[hello-world/hello-world-ksa]"
}

# Artifact Registry access
resource "google_artifact_registry_repository_iam_member" "artifact_registry_access" {
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.devops_ksa.email}"
  location   = var.region
}

# Kubernetes Namespace
resource "kubernetes_namespace" "hello_world" {
  metadata {
    name = "hello-world"
  }

  depends_on = [google_container_node_pool.primary_nodes]
}

# ServiceAccount in Kubernetes
resource "kubernetes_service_account" "hello_world" {
  metadata {
    name      = "hello-world-ksa"
    namespace = kubernetes_namespace.hello_world.metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.devops_ksa.email
    }
  }
}

# Deploy Hello-World App using Helm
resource "helm_release" "hello_world" {
  name      = "hello-world"
  chart     = "../helm/hello-world"
  namespace = kubernetes_namespace.hello_world.metadata[0].name

  values = [
    yamlencode({
      replicaCount = 3

      image = {
        repository = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo}/hello-world"
        tag        = "latest"
        pullPolicy = "IfNotPresent"
      }

      service = {
        type = "LoadBalancer"
        port = 80
      }

      resources = {
        limits = {
          cpu    = "500m"
          memory = "512Mi"
        }
        requests = {
          cpu    = "250m"
          memory = "256Mi"
        }
      }

      autoscaling = {
        enabled          = true
        minReplicas      = 3
        maxReplicas      = 10
        targetCPUPercent = 70
      }

      env = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "8080"
        }
      ]

      serviceAccount = {
        create = true
        name   = "hello-world-ksa"
        annotations = {
          "iam.gke.io/gcp-service-account" = google_service_account.devops_ksa.email
        }
      }
    })
  ]

  depends_on = [google_container_node_pool.primary_nodes, kubernetes_service_account.hello_world]
}

# Outputs
output "kubernetes_cluster_name" {
  value       = google_container_cluster.primary.name
  description = "GKE Cluster Name"
}

output "kubernetes_cluster_host" {
  value       = google_container_cluster.primary.endpoint
  description = "GKE Cluster Host"
  sensitive   = true
}

output "artifact_registry_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
  description = "Full Artifact Registry URL"
}
