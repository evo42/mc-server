#!/bin/bash

# BlueMap Production Deployment Script
# Sprint 3: Migration & Deployment - Kubernetes Orchestration
# Date: 2025-12-01

set -e

# Configuration
NAMESPACE="bluemap"
DOMAIN="bluemap.lerncraft.xyz"
KUBECTL_CONTEXT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi

    # Check required tools
    for tool in helm docker; do
        if ! command -v $tool &> /dev/null; then
            warning "$tool is not installed - some features may not work"
        fi
    done

    success "Prerequisites check completed"
}

# Create namespace
create_namespace() {
    log "Creating namespace: $NAMESPACE"

    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Add labels
    kubectl label namespace $NAMESPACE name=$NAMESPACE environment=production --overwrite

    success "Namespace created and configured"
}

# Apply ConfigMaps and Secrets
apply_config() {
    log "Applying ConfigMaps and Secrets..."

    # Apply ConfigMaps
    kubectl apply -f configmaps/ -n $NAMESPACE

    # Apply Secrets (from env file or generate)
    if [ -f ".env.production" ]; then
        log "Loading environment variables from .env.production"
        source .env.production
    else
        warning "No .env.production found, using default values"
    fi

    # Apply secrets
    kubectl apply -f ingress/bluemap-ingress.yaml -n $NAMESPACE

    success "Configuration applied"
}

# Deploy database layer
deploy_database() {
    log "Deploying PostgreSQL database..."

    kubectl apply -f database/postgres-statefulset.yaml -n $NAMESPACE

    # Wait for database to be ready
    log "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=bluemap-postgres --timeout=300s -n $NAMESPACE

    success "PostgreSQL database deployed"
}

# Deploy cache layer
deploy_cache() {
    log "Deploying Redis cache..."

    kubectl apply -f cache/redis-deployment.yaml -n $NAMESPACE

    # Wait for Redis to be ready
    log "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=bluemap-redis --timeout=300s -n $NAMESPACE

    success "Redis cache deployed"
}

# Deploy backend API
deploy_backend() {
    log "Deploying BlueMap Backend API..."

    kubectl apply -f backend/bluemap-backend-deployment.yaml -n $NAMESPACE

    # Wait for backend to be ready
    log "Waiting for backend API to be ready..."
    kubectl wait --for=condition=ready pod -l app=bluemap-backend --timeout=300s -n $NAMESPACE

    success "Backend API deployed"
}

# Deploy frontend
deploy_frontend() {
    log "Deploying BlueMap Frontend..."

    # Build and push Docker image
    if [ -f "../../admin-ui-spa/package.json" ]; then
        log "Building frontend Docker image..."
        cd ../../admin-ui-spa
        docker build -t bluemap-frontend:latest .
        docker tag bluemap-frontend:latest $DOMAIN/bluemap-frontend:latest
        docker push $DOMAIN/bluemap-frontend:latest
        cd - > /dev/null
    else
        warning "Frontend source not found, using placeholder image"
    fi

    kubectl apply -f frontend/bluemap-frontend-deployment.yaml -n $NAMESPACE

    # Wait for frontend to be ready
    log "Waiting for frontend to be ready..."
    kubectl wait --for=condition=ready pod -l app=bluemap-frontend --timeout=300s -n $NAMESPACE

    success "Frontend deployed"
}

# Deploy monitoring
deploy_monitoring() {
    log "Deploying monitoring stack..."

    # Deploy Prometheus
    kubectl apply -f monitoring/prometheus-deployment.yaml -n $NAMESPACE

    # Deploy Grafana
    kubectl apply -f monitoring/grafana-deployment.yaml -n $NAMESPACE

    # Wait for monitoring to be ready
    log "Waiting for monitoring stack to be ready..."
    kubectl wait --for=condition=ready pod -l app=prometheus --timeout=300s -n $NAMESPACE
    kubectl wait --for=condition=ready pod -l app=grafana --timeout=300s -n $NAMESPACE

    success "Monitoring stack deployed"
}

# Configure ingress
configure_ingress() {
    log "Configuring ingress and load balancer..."

    # Apply ingress configuration
    kubectl apply -f ingress/bluemap-ingress.yaml -n $NAMESPACE

    # Get ingress IP
    log "Getting ingress IP address..."
    INGRESS_IP=$(kubectl get ingress bluemap-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

    if [ "$INGRESS_IP" = "pending" ]; then
        warning "Load balancer IP is still pending, check again in a few minutes"
    else
        success "Ingress configured with IP: $INGRESS_IP"
        log "Update your DNS records to point to: $INGRESS_IP"
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."

    # Check all pods are running
    log "Checking pod status..."
    kubectl get pods -n $NAMESPACE

    # Check services
    log "Checking services..."
    kubectl get services -n $NAMESPACE

    # Check ingress
    log "Checking ingress..."
    kubectl get ingress -n $NAMESPACE

    # Test API endpoints
    if [ "$INGRESS_IP" != "pending" ] && [ "$INGRESS_IP" != "" ]; then
        log "Testing API endpoints..."

        # Test health endpoints
        curl -f http://$INGRESS_IP/health &> /dev/null && success "Health endpoint accessible" || warning "Health endpoint not accessible"
        curl -f http://$INGRESS_IP/api/health &> /dev/null && success "API health endpoint accessible" || warning "API health endpoint not accessible"
    fi

    success "Deployment verification completed"
}

# Main deployment function
main() {
    log "Starting BlueMap Production Deployment"
    log "======================================="

    check_prerequisites
    create_namespace
    apply_config
    deploy_database
    deploy_cache
    deploy_backend
    deploy_frontend
    deploy_monitoring
    configure_ingress
    verify_deployment

    log "======================================="
    success "BlueMap Production Deployment Completed Successfully!"
    log ""
    log "Deployment Summary:"
    log "- Namespace: $NAMESPACE"
    log "- Frontend: https://$DOMAIN"
    log "- API: https://api.$DOMAIN"
    log "- Admin: https://admin.$DOMAIN"
    log "- Monitoring: https://admin.$DOMAIN/grafana"
    log ""
    log "Next steps:"
    log "1. Update DNS records to point to the load balancer IP"
    log "2. Verify SSL certificates are issued"
    log "3. Run performance tests"
    log "4. Begin user training"
    log ""
    warning "Remember to monitor the deployment and check logs for any issues"
}

# Run main function
main "$@"