#!/bin/bash

# Script de deployment para Emerald Bay Quotes
# Uso: ./deploy.sh [vercel|netlify|github]

set -e

PLATFORM=${1:-vercel}

echo "🚀 Deploying Emerald Bay Quotes to $PLATFORM..."

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Build del proyecto
echo "🔨 Building proyecto..."
npm run build

# Deploy según plataforma
case $PLATFORM in
    vercel)
        echo "📤 Deploying a Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "❌ Vercel CLI no está instalado. Instalando..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    
    netlify)
        echo "📤 Deploying a Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "❌ Netlify CLI no está instalado. Instalando..."
            npm install -g netlify-cli
        fi
        netlify deploy --prod
        ;;
    
    github)
        echo "📤 Pushing a GitHub..."
        git add .
        echo "📝 Commit message:"
        read -p "Enter commit message: " COMMIT_MSG
        git commit -m "$COMMIT_MSG"
        git push origin main
        echo "✅ Pushed to GitHub. El deploy automático se iniciará en Vercel/Netlify"
        ;;
    
    *)
        echo "❌ Plataforma desconocida: $PLATFORM"
        echo "Uso: ./deploy.sh [vercel|netlify|github]"
        exit 1
        ;;
esac

echo "✅ Deploy completado exitosamente!"
echo "🌐 Tu aplicación debería estar disponible en unos momentos"
