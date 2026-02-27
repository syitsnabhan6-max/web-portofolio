#!/bin/bash

# ============================================
# SETUP SCRIPT - INSTALL SUPABASE DEPENDENCIES
# ============================================
# 
# Run this script to install all necessary packages for Supabase
# 
# Usage:
#   bash setup-supabase.sh
# 
# Or on Windows (PowerShell):
#   .\setup-supabase.ps1

echo "╔════════════════════════════════════════╗"
echo "║  🚀 Supabase Setup Script              ║"
echo "║  Installing Dependencies...            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing @supabase/supabase-js..."
npm install @supabase/supabase-js

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "📝 NEXT STEPS:"
    echo "   1. Create a .env file with Supabase credentials:"
    echo "      SUPABASE_URL=https://your-project.supabase.co"
    echo "      SUPABASE_KEY=your-anon-key"
    echo "      SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "   2. Run SQL schema:"
    echo "      Open SUPABASE-SCHEMA.sql in Supabase SQL Editor and execute"
    echo ""
    echo "   3. Start the server:"
    echo "      npm start"
    echo ""
    echo "📚 For detailed instructions, see: SUPABASE-SETUP-GUIDE.md"
else
    echo "❌ Installation failed. Check npm output above."
    exit 1
fi
