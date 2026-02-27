# ============================================
# SETUP SCRIPT - INSTALL SUPABASE DEPENDENCIES
# ============================================
# 
# Run this script to install all necessary packages for Supabase
# 
# Usage (PowerShell):
#   .\setup-supabase.ps1
# 
# If you get "cannot be loaded because running scripts is disabled", run:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 Supabase Setup Script              ║" -ForegroundColor Cyan
Write-Host "║  Installing Dependencies...            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
$npmVersion = npm -v 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/"
    exit 1
}

Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Installing @supabase/supabase-js..." -ForegroundColor Yellow
npm install @supabase/supabase-js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 NEXT STEPS:" -ForegroundColor Green
    Write-Host "   1. Create a .env file with Supabase credentials:" -ForegroundColor Green
    Write-Host "      SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Gray
    Write-Host "      SUPABASE_KEY=your-anon-key" -ForegroundColor Gray
    Write-Host "      SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Run SQL schema:" -ForegroundColor Green
    Write-Host "      Open SUPABASE-SCHEMA.sql in Supabase SQL Editor and execute" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Start the server:" -ForegroundColor Green
    Write-Host "      npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📚 For detailed instructions, see: SUPABASE-SETUP-GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Installation failed. Check the error message above." -ForegroundColor Red
    exit 1
}
