#!/bin/bash

echo "🚀 NBA Draft HQ Deployment Setup"
echo ""
echo "This script will help you deploy to Vercel."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Run these commands to push your code:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/nba-draft-hq.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Go to Vercel and deploy:"
echo "   https://vercel.com/new"
echo ""
echo "4. Select your GitHub repository and click Deploy"
echo ""
echo "✅ Your site will be live in minutes!"
