#!/bin/bash

# GOT NILK? - Production Deployment Script
# Run this script to deploy your DEFI game to production

set -e  # Exit on any error

echo "🚀 Starting GOT NILK? Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_success "All dependencies are available"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Run tests and linting
run_tests() {
    print_status "Running tests and linting..."
    
    # Type checking
    if npm run type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        exit 1
    fi
    
    # Linting
    if npm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found, but continuing..."
    fi
    
    # Tests (if available)
    if npm test --passWithNoTests; then
        print_success "Tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Build the application
build_app() {
    print_status "Building application..."
    
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_status "Please log in to Vercel..."
        vercel login
    fi
    
    # Deploy to production
    if vercel --prod; then
        print_success "Deployment to Vercel completed!"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get the deployment URL (this would need to be customized)
    DEPLOYMENT_URL=$(vercel ls --scope=team 2>/dev/null | grep "https://" | head -1 | awk '{print $2}' || echo "")
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        print_warning "Could not automatically detect deployment URL"
        print_status "Please manually verify your deployment at your Vercel dashboard"
        return
    fi
    
    print_status "Testing deployment at: $DEPLOYMENT_URL"
    
    # Test health endpoint
    if curl -f "$DEPLOYMENT_URL/api/health" &> /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - this might be normal if the endpoint doesn't exist yet"
    fi
    
    # Test main page
    if curl -f "$DEPLOYMENT_URL" &> /dev/null; then
        print_success "Main page is accessible"
    else
        print_error "Main page is not accessible"
    fi
}

# Main deployment flow
main() {
    echo "🎮 GOT NILK? - DEFI Game Deployment"
    echo "=================================="
    
    check_dependencies
    install_dependencies
    run_tests
    build_app
    deploy_to_vercel
    verify_deployment
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify your game is working at your Vercel URL"
    echo "2. Test wallet connection and game functionality"
    echo "3. Monitor error logs and performance"
    echo "4. Set up your custom domain if needed"
    echo ""
    echo "🚀 Your DEFI game is now live on HyperLiquid EVM!"
}

# Run the deployment
main "$@" 