# GOT NILK? - Production Deployment Script (PowerShell)
param([switch]$SkipTests, [switch]$SkipBuild)
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting GOT NILK? Production Deployment..." -ForegroundColor Cyan

function Write-Status { param([string]$Message); Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message); Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message); Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message); Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Check dependencies
Write-Status "Checking dependencies..."
try { $nodeVersion = node --version; Write-Success "Node.js found: $nodeVersion" }
catch { Write-Error "Node.js is not installed"; exit 1 }

try { $npmVersion = npm --version; Write-Success "npm found: $npmVersion" }
catch { Write-Error "npm is not installed"; exit 1 }

try { $vercelVersion = vercel --version; Write-Success "Vercel CLI found: $vercelVersion" }
catch { Write-Warning "Installing Vercel CLI..."; npm install -g vercel }

# Install dependencies
Write-Status "Installing project dependencies..."
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to install dependencies"; exit 1 }
Write-Success "Dependencies installed"

# Run tests
if (-not $SkipTests) {
    Write-Status "Running linter..."
    npm run lint
    if ($LASTEXITCODE -eq 0) { Write-Success "Linting passed" }
    else { Write-Warning "Linting issues found, continuing..." }
}

# Build
if (-not $SkipBuild) {
    Write-Status "Building application..."
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }
    Write-Success "Build completed"
}

# Deploy
Write-Status "Deploying to Vercel..."
vercel --prod
if ($LASTEXITCODE -ne 0) { Write-Error "Deployment failed"; exit 1 }
Write-Success "🎉 Deployment completed successfully!"

Write-Host ""
Write-Host "🚀 Your DEFI game is now live on HyperLiquid EVM!" -ForegroundColor Green 