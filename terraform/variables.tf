variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "cluster_name" {
  description = "GKE Cluster Name"
  type        = string
  default     = "devops-gke"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "n1-standard-2"
}

variable "node_count" {
  description = "Initial number of nodes"
  type        = number
  default     = 2
}

variable "min_nodes" {
  description = "Minimum number of nodes"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of nodes"
  type        = number
  default     = 5
}

variable "preemptible" {
  description = "Use preemptible nodes (cheaper, can be evicted)"
  type        = bool
  default     = false
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "devops-images"
}
