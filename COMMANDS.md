# ⚡ Quick Commands Cheatsheet

## 🚀 Deploy Commands

```bash
# Deploy to Vercel (production)
vercel --prod

# Deploy to Netlify (production)
netlify deploy --prod

# Deploy using script
./deploy.sh vercel
./deploy.sh netlify
./deploy.sh github
```

## 💻 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🔧 Maintenance

```bash
# Clean everything and reinstall
rm -rf node_modules dist .vite && npm install

# Update all dependencies
npm update

# Check for outdated packages
npm outdated

# Audit for vulnerabilities
npm audit
```

## 📦 Git Workflow

```bash
# First time setup
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/emerald-bay-quotes.git
git push -u origin main

# Regular workflow
git add .
git commit -m "Your commit message"
git push

# Undo last commit (before push)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD
```

## 🌐 Vercel Commands

```bash
# Login
vercel login

# Deploy to preview (test)
vercel

# Deploy to production
vercel --prod

# List all deployments
vercel ls

# Open project in browser
vercel open

# Remove a deployment
vercel rm [deployment-url]

# View logs
vercel logs [deployment-url]
```

## 🌐 Netlify Commands

```bash
# Login
netlify login

# Initialize project
netlify init

# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod

# Open project
netlify open

# View site status
netlify status

# View logs
netlify logs
```

## 🔍 Debug Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# List globally installed packages
npm list -g --depth=0

# Clear npm cache
npm cache clean --force

# Reinstall specific package
npm uninstall [package-name]
npm install [package-name]
```

## 📊 Project Stats

```bash
# Count lines of code
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l

# List all dependencies
npm list --depth=0

# Check bundle size
npm run build && du -sh dist

# Analyze bundle
npx vite-bundle-visualizer
```

## 🔐 Environment Variables

```bash
# Create local env file
cp .env.example .env.local

# Test with env vars
VITE_WEBHOOK_URL=https://new-url.com npm run dev
```

## 🗑️ Cleanup

```bash
# Remove node_modules
rm -rf node_modules

# Remove dist
rm -rf dist

# Remove .vite cache
rm -rf .vite

# Remove all at once
rm -rf node_modules dist .vite package-lock.json

# Then reinstall
npm install
```

## 🔄 Update Project from Bolt

```bash
# Export from Bolt (get .zip file)
# Extract locally
unzip emerald-bay-quotes.zip -d emerald-bay-quotes-new

# Backup current
mv emerald-bay-quotes emerald-bay-quotes-backup

# Use new version
mv emerald-bay-quotes-new emerald-bay-quotes

# Install and test
cd emerald-bay-quotes
npm install
npm run dev
```

## 📱 Test Responsive

```bash
# Start dev server
npm run dev

# Then use browser DevTools:
# - Press F12
# - Click device icon (Ctrl+Shift+M)
# - Test different devices
```

## 🐛 Common Fixes

```bash
# Port 5173 already in use
lsof -ti:5173 | xargs kill -9

# Permission denied
sudo chmod +x deploy.sh

# Module not found
npm install

# Build fails
rm -rf node_modules package-lock.json
npm install
npm run build

# Git issues
git status
git reset --hard HEAD
git clean -fd
```

## 🎨 Customize Branding

```bash
# Update colors in tailwind.config.js
# Update logo in public/
# Update title in index.html
# Update README.md

# Then rebuild
npm run build
vercel --prod
```

## 📧 Update Webhook URL

```bash
# Option 1: Edit .env.local
echo "VITE_WEBHOOK_URL=https://your-new-webhook.com" > .env.local

# Option 2: Edit src/App.tsx directly
# Find: const WEBHOOK_URL = ...
# Replace with new URL

# Then redeploy
npm run build
vercel --prod
```

## 🔑 Quick Shortcuts

```bash
# Full deploy from scratch
npm install && npm run build && vercel --prod

# Quick test cycle
npm run dev & open http://localhost:5173

# Emergency rollback on Vercel
vercel rollback

# View production logs
vercel logs --prod

# Check if site is up
curl -I https://your-site.vercel.app
```

## 💡 Pro Tips

```bash
# 1. Always test locally first
npm run dev
# Click around, test everything

# 2. Then preview build
npm run build && npm run preview

# 3. Finally deploy
vercel --prod

# 4. Monitor for errors
vercel logs --prod --follow

# 5. If issues, rollback immediately
vercel rollback
```

## 📞 Get Help

```bash
# Vercel help
vercel help

# Netlify help
netlify help

# npm help
npm help

# Check project health
npm run lint
npm run build
```

---

## 🎯 One-Liners for Common Tasks

```bash
# Fresh start
rm -rf node_modules dist .vite && npm install && npm run dev

# Quick deploy
npm run build && vercel --prod

# Update and deploy
npm update && npm run build && vercel --prod

# Check site is working
curl -I https://emerald-bay-quotes.vercel.app | grep "HTTP"

# View recent deployments
vercel ls | head -5
```

---

**Bookmark this file!** 🔖

*Cheatsheet by EVOX LLC*
