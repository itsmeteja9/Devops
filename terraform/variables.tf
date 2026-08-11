variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "devops"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Networking
variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
  default     = "10.0.0.0/20"
}

variable "pods_cidr" {
  description = "Pods CIDR range"
  type        = string
  default     = "10.4.0.0/14"
}

variable "services_cidr" {
  description = "Services CIDR range"
  type        = string
  default     = "10.8.0.0/20"
}

# GKE Cluster
variable "cluster_name" {
  description = "GKE Cluster name"
  type        = string
  default     = "devops-gke"
}

variable "machine_type" {
  description = "Node machine type"
  type        = string
  default     = "e2-medium"
}

variable "node_count" {
  description = "Initial node count"
  type        = number
  default     = 1
}

variable "min_nodes" {
  description = "Minimum number of nodes"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum number of nodes"
  type        = number
  default     = 3
}

variable "use_preemptible_nodes" {
  description = "Use preemptible nodes for cost savings"
  type        = bool
  default     = false
}

variable "disk_size" {
  description = "Node disk size in GB"
  type        = number
  default     = 50
}

# Artifact Registry
variable "artifact_registry_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "docker-repo"
}

# Application Configuration
variable "app_name" {
  description = "Application name"
  type        = string
  default     = "devops-app"
}

variable "app_namespace" {
  description = "Kubernetes namespace for application"
  type        = string
  default     = "default"
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 8080
}

variable "app_replicas" {
  description = "Initial application replicas"
  type        = number
  default     = 2
}

variable "app_image_tag" {
  description = "Application image tag"
  type        = string
  default     = "latest"
}

variable "app_chart_version" {
  description = "Helm chart version"
  type        = string
  default     = "1.0.0"
}

variable "service_type" {
  description = "Kubernetes service type"
  type        = string
  default     = "LoadBalancer"

  validation {
    condition     = contains(["LoadBalancer", "ClusterIP", "NodePort"], var.service_type)
    error_message = "Service type must be LoadBalancer, ClusterIP, or NodePort."
  }
}

# Container Resources
variable "container_cpu_limit" {
  description = "Container CPU limit"
  type        = string
  default     = "500m"
}

variable "container_cpu_request" {
  description = "Container CPU request"
  type        = string
  default     = "250m"
}

variable "container_memory_limit" {
  description = "Container memory limit"
  type        = string
  default     = "512Mi"
}

variable "container_memory_request" {
  description = "Container memory request"
  type        = string
  default     = "256Mi"
}

# Autoscaling
variable "enable_autoscaling" {
  description = "Enable Horizontal Pod Autoscaler"
  type        = bool
  default     = true
}

variable "app_min_replicas" {
  description = "Minimum application replicas"
  type        = number
  default     = 2
}

variable "app_max_replicas" {
  description = "Maximum application replicas"
  type        = number
  default     = 5
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization percentage"
  type        = number
  default     = 70
}

# Features
variable "enable_ingress" {
  description = "Enable Kubernetes Ingress"
  type        = bool
  default     = false
}

variable "enable_monitoring" {
  description = "Enable monitoring and logging"
  type        = bool
  default     = true
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"
}
