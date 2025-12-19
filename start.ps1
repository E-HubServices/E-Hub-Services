# E-Hub Services Backend - Quick Start Script

Write-Host "🚀 Starting E-Hub Services Backend Setup..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env.local and add your credentials:" -ForegroundColor Red
    Write-Host "   - CONVEX_DEPLOYMENT" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_CONVEX_URL" -ForegroundColor Yellow
    Write-Host "   - RAZORPAY_KEY_ID" -ForegroundColor Yellow
    Write-Host "   - RAZORPAY_KEY_SECRET" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to open .env.local for editing..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    notepad .env.local
    Write-Host ""
    Write-Host "After saving .env.local, press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Starting Convex development server..." -ForegroundColor Cyan
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   - Generate TypeScript types" -ForegroundColor Gray
Write-Host "   - Deploy functions to Convex" -ForegroundColor Gray
Write-Host "   - Watch for changes" -ForegroundColor Gray
Write-Host ""

# Start Convex dev
npx convex dev
