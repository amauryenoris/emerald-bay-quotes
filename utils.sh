#!/bin/bash

# Scripts de utilidad para Emerald Bay Quotes

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar menú
show_menu() {
    echo -e "${BLUE}==================================${NC}"
    echo -e "${GREEN}Emerald Bay Quotes - Utilidades${NC}"
    echo -e "${BLUE}==================================${NC}"
    echo ""
    echo "1. 🚀 Deploy a Vercel"
    echo "2. 🚀 Deploy a Netlify"
    echo "3. 🔨 Build local"
    echo "4. 👀 Preview producción"
    echo "5. 🧹 Limpiar cache"
    echo "6. 📦 Actualizar dependencias"
    echo "7. 🔍 Analizar bundle size"
    echo "8. ✅ Run tests (lint)"
    echo "9. 📊 Ver estadísticas del proyecto"
    echo "0. ❌ Salir"
    echo ""
    read -p "Selecciona una opción: " choice
}

# Deploy a Vercel
deploy_vercel() {
    echo -e "${BLUE}Deploying a Vercel...${NC}"
    npm run build
    vercel --prod
    echo -e "${GREEN}✅ Deploy completado!${NC}"
}

# Deploy a Netlify
deploy_netlify() {
    echo -e "${BLUE}Deploying a Netlify...${NC}"
    npm run build
    netlify deploy --prod
    echo -e "${GREEN}✅ Deploy completado!${NC}"
}

# Build local
build_local() {
    echo -e "${BLUE}Building proyecto...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build completado! Check ./dist${NC}"
}

# Preview producción
preview_prod() {
    echo -e "${BLUE}Iniciando preview...${NC}"
    npm run preview
}

# Limpiar cache
clean_cache() {
    echo -e "${BLUE}Limpiando cache...${NC}"
    rm -rf node_modules dist .vite
    echo -e "${GREEN}✅ Cache limpiado!${NC}"
    echo -e "${BLUE}Reinstalando dependencias...${NC}"
    npm install
    echo -e "${GREEN}✅ Listo!${NC}"
}

# Actualizar dependencias
update_deps() {
    echo -e "${BLUE}Actualizando dependencias...${NC}"
    npm update
    echo -e "${GREEN}✅ Dependencias actualizadas!${NC}"
}

# Analizar bundle size
analyze_bundle() {
    echo -e "${BLUE}Analizando bundle size...${NC}"
    npm run build
    npx vite-bundle-visualizer
}

# Run lint
run_lint() {
    echo -e "${BLUE}Running ESLint...${NC}"
    npm run lint
    echo -e "${GREEN}✅ Lint completado!${NC}"
}

# Estadísticas del proyecto
show_stats() {
    echo -e "${BLUE}📊 Estadísticas del Proyecto${NC}"
    echo ""
    echo -e "${GREEN}Líneas de código:${NC}"
    find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1
    echo ""
    echo -e "${GREEN}Archivos TypeScript/React:${NC}"
    find src -name "*.tsx" -o -name "*.ts" | wc -l
    echo ""
    echo -e "${GREEN}Tamaño del bundle (último build):${NC}"
    if [ -d "dist" ]; then
        du -sh dist
    else
        echo "No hay build disponible. Run 'npm run build' primero."
    fi
    echo ""
    echo -e "${GREEN}Dependencias:${NC}"
    echo "Total: $(cat package.json | jq '.dependencies | length') dependencias"
    echo "Dev: $(cat package.json | jq '.devDependencies | length') dev dependencies"
}

# Loop principal
while true; do
    show_menu
    case $choice in
        1) deploy_vercel ;;
        2) deploy_netlify ;;
        3) build_local ;;
        4) preview_prod ;;
        5) clean_cache ;;
        6) update_deps ;;
        7) analyze_bundle ;;
        8) run_lint ;;
        9) show_stats ;;
        0) echo -e "${GREEN}¡Hasta luego!${NC}"; exit 0 ;;
        *) echo -e "${RED}Opción inválida${NC}" ;;
    esac
    echo ""
    read -p "Presiona Enter para continuar..."
    clear
done
