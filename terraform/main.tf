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

  # Backend configuration - enable after first successful deployment
  # backend "gcs" {
  #   bucket = "devops-poc-1786236741-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${google_container_cluster.gke.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
  }
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com"
  ])

  service            = each.value
  disable_on_destroy = false
}

# VPC Network - Already exists, skipping creation
# TODO: Import existing VPC into terraform state
# resource "google_compute_network" "vpc" {
#   name                    = "${var.project_name}-vpc"
#   auto_create_subnetworks = false
#   project                 = var.project_id
#
#   depends_on = [google_project_service.required_apis]
# }

# Reference existing VPC
data "google_compute_network" "vpc" {
  name    = "devops-vpc"
  project = var.project_id
}

# Reference existing subnet
data "google_compute_subnetwork" "subnet" {
  name    = "devops-subnet"
  region  = var.region
  project = var.project_id
}

# GKE Cluster
resource "google_container_cluster" "gke" {
  name     = var.cluster_name
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = data.google_compute_network.vpc.name
  subnetwork = data.google_compute_subnetwork.subnet.name

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
  }

  depends_on = [google_project_service.required_apis]

  lifecycle {
    create_before_destroy = true
  }
}

# Node Pool
resource "google_container_node_pool" "primary" {
  name       = "${var.project_name}-pool"
  cluster    = google_container_cluster.gke.name
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
    preemptible  = var.use_preemptible_nodes
    machine_type = var.machine_type
    disk_size_gb = var.disk_size

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      environment = var.environment
      managed_by  = "terraform"
    }

    tags = ["gke-node", var.project_name]
  }
}

# Artifact Registry
# Artifact Registry - Already exists, skipping creation
# TODO: Import existing repository into terraform state
# resource "google_artifact_registry_repository" "docker_repo" {
#   location      = var.region
#   repository_id = var.artifact_registry_repo
#   description   = "Docker images for ${var.project_name}"
#   format        = "DOCKER"
#   project       = var.project_id
#
#   depends_on = [google_project_service.required_apis]
# }

# Reference existing Artifact Registry
data "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = var.artifact_registry_repo
  project       = var.project_id
}

# Service Account for applications - Already exists, skipping creation
# TODO: Import existing service account into terraform state
# resource "google_service_account" "app_sa" {
#   account_id   = "${var.project_name}-app"
#   display_name = "Application Service Account"
#   project      = var.project_id
# }

# Reference existing service account
data "google_service_account" "app_sa" {
  account_id = "devops-app"
  project    = var.project_id
}

# Workload Identity Binding
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = data.google_service_account.app_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.app_namespace}/app-ksa]"
}

# Artifact Registry read access
resource "google_artifact_registry_repository_iam_member" "registry_access" {
  repository = data.google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${data.google_service_account.app_sa.email}"
  location   = var.region
}

# Kubernetes Namespace
resource "kubernetes_namespace" "app" {
  metadata {
    name = var.app_namespace
    labels = {
      "app.kubernetes.io/name" = var.project_name
    }
  }

  depends_on = [google_container_node_pool.primary]
}

# Kubernetes Service Account
resource "kubernetes_service_account" "app" {
  metadata {
    name      = "app-ksa"
    namespace = kubernetes_namespace.app.metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = data.google_service_account.app_sa.email
    }
  }
}

# Deploy application with Helm
resource "helm_release" "app" {
  name      = var.app_name
  chart     = "../helm/${var.app_name}"
  namespace = kubernetes_namespace.app.metadata[0].name
  version   = var.app_chart_version
  wait      = true
  timeout   = 600
  atomic    = true

  values = [
    yamlencode({
      replicaCount = var.app_replicas

      image = {
        repository = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo}/${var.app_name}"
        tag        = var.app_image_tag
        pullPolicy = "IfNotPresent"
      }

      service = {
        type = var.service_type
        port = var.app_port
      }

      ingress = {
        enabled = var.enable_ingress
      }

      resources = {
        limits = {
          cpu    = var.container_cpu_limit
          memory = var.container_memory_limit
        }
        requests = {
          cpu    = var.container_cpu_request
          memory = var.container_memory_request
        }
      }

      autoscaling = {
        enabled          = var.enable_autoscaling
        minReplicas      = var.app_min_replicas
        maxReplicas      = var.app_max_replicas
        targetCPUPercent = var.target_cpu_utilization
      }

      env = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "LOG_LEVEL"
          value = var.log_level
        }
      ]

      serviceAccount = {
        create = true
        name   = "app-ksa"
        annotations = {
          "iam.gke.io/gcp-service-account" = data.google_service_account.app_sa.email
        }
      }

      monitoring = {
        enabled = var.enable_monitoring
      }

      securityContext = {
        runAsNonRoot = true
        runAsUser    = 65534
      }
    })
  ]

  depends_on = [
    google_container_node_pool.primary,
    kubernetes_service_account.app
  ]
}

# Outputs
output "gke_cluster_name" {
  value       = google_container_cluster.gke.name
  description = "GKE Cluster Name"
}

output "gke_cluster_host" {
  value       = google_container_cluster.gke.endpoint
  description = "GKE Cluster Host"
  sensitive   = true
}

output "artifact_registry_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${data.google_artifact_registry_repository.docker_repo.repository_id}"
  description = "Artifact Registry URL"
}

output "kubernetes_namespace" {
  value       = kubernetes_namespace.app.metadata[0].name
  description = "Kubernetes Namespace"
}

output "app_service_account" {
  value       = data.google_service_account.app_sa.email
  description = "Application Service Account Email"
}
