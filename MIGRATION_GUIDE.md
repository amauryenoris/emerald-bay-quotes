# 📋 Guía de Migración: Bolt → Producción

## ✅ Estado Actual
- ❌ Hosteado en: `generador-de-cotizac-nomo.bolt.host`
- ❌ Limitaciones: Sin dominio custom, créditos limitados
- ❌ No escalable para producción

## 🎯 Objetivo
- ✅ Hostear en plataforma profesional
- ✅ Dominio personalizado (ej: `quotes.emeraldbay.com`)
- ✅ Deploy automático
- ✅ 100% GRATIS (Vercel) o muy económico

---

## 🚀 OPCIÓN 1: VERCEL (Recomendado)

### Por qué Vercel?
- ✅ **100% GRATIS** para siempre
- ✅ Deploy en **2 minutos**
- ✅ **SSL automático** (HTTPS)
- ✅ **CDN global** (carga ultra rápida)
- ✅ **Dominio custom gratis**
- ✅ **Deploy automático** desde GitHub

### Pasos para Deploy

#### 1. Preparar el proyecto

```bash
# Si tienes el .zip de Bolt, descomprímelo primero
cd ~/Downloads  # o donde esté tu .zip
unzip emerald-bay-quotes.zip

# Navega al proyecto
cd emerald-bay-quotes

# Instala dependencias
npm install
```

#### 2. Probar localmente (opcional)

```bash
npm run dev
# Abre http://localhost:5173
```

#### 3. Deploy a Vercel

**Método A: Con CLI (más rápido)**

```bash
# Instala Vercel CLI
npm install -g vercel

# Login
vercel login
# Se abrirá el navegador para autenticación

# Deploy
vercel --prod

# ✅ Listo! Te dará una URL como: https://emerald-bay-quotes.vercel.app
```

**Método B: Con interfaz web**

1. Ve a [github.com](https://github.com) y crea una cuenta (gratis)
2. Sube tu proyecto:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Crea el repo en GitHub desde la web, luego:
git remote add origin https://github.com/TU-USUARIO/emerald-bay-quotes.git
git push -u origin main
```

3. Ve a [vercel.com/new](https://vercel.com/new)
4. Click en "Import Git Repository"
5. Selecciona tu repositorio de GitHub
6. Click "Deploy"
7. ✅ ¡Listo en 2 minutos!

#### 4. Configurar dominio personalizado

1. Ve a tu proyecto en Vercel dashboard
2. Settings → Domains
3. Add domain: `quotes.emeraldbay.com`
4. Sigue las instrucciones para configurar DNS en tu proveedor

**Configuración DNS (ejemplo con GoDaddy/Namecheap):**
```
Type: CNAME
Name: quotes
Value: cname.vercel-dns.com
TTL: 1 hour
```

---

## 🚀 OPCIÓN 2: NETLIFY (Alternativa)

### Por qué Netlify?
- ✅ También **GRATIS**
- ✅ Excelente para formularios
- ✅ SSL automático
- ✅ Deploy automático

### Pasos para Deploy

```bash
# Instala Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Inicializa el proyecto
netlify init

# Deploy
netlify deploy --prod
```

**O desde la interfaz:**
1. Ve a [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Conecta GitHub
4. Deploy!

---

## 🚀 OPCIÓN 3: RAILWAY (Con Backend/DB)

Si en el futuro quieres agregar base de datos PostgreSQL:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

**Costo:** $5/mes incluye base de datos

---

## 🔄 Deploy Automático con GitHub

Una vez conectado GitHub + Vercel/Netlify:

```bash
# Haces cambios en tu código
code src/App.tsx

# Guardas y subes
git add .
git commit -m "Update pricing logic"
git push

# ✅ Deploy automático en 1 minuto!
```

---

## 🛠️ Checklist Post-Deploy

### Inmediato (5 minutos)
- [ ] Verificar que la app carga correctamente
- [ ] Probar generación de PDF
- [ ] Probar envío a n8n webhook
- [ ] Verificar que funciona en móvil
- [ ] Probar cambio de idioma EN/ES

### Primeras 24 horas
- [ ] Configurar dominio personalizado
- [ ] Actualizar URL en documentos/emails
- [ ] Actualizar URL en n8n (si es necesario)
- [ ] Notificar al equipo de ventas

### Primera semana
- [ ] Monitorear analytics en Vercel/Netlify
- [ ] Revisar errores (si los hay)
- [ ] Optimizar según uso real
- [ ] Agregar Google Analytics (opcional)

---

## 📊 Comparación de Plataformas

| Feature | Bolt | Vercel | Netlify | Railway |
|---------|------|--------|---------|---------|
| **Precio** | Créditos | GRATIS | GRATIS | $5/mes |
| **Dominio custom** | ❌ | ✅ | ✅ | ✅ |
| **SSL/HTTPS** | ✅ | ✅ | ✅ | ✅ |
| **Deploy auto** | ❌ | ✅ | ✅ | ✅ |
| **Backend** | ❌ | ❌ | ❌ | ✅ |
| **Base de datos** | ❌ | ❌ | ❌ | ✅ |
| **Velocidad** | Media | 🚀 | 🚀 | Alta |
| **Uptime** | No garantizado | 99.9% | 99.9% | 99.9% |

---

## ⚠️ Troubleshooting

### "npm: command not found"
```bash
# Instala Node.js primero
# Descarga desde: https://nodejs.org/
```

### "vercel: command not found"
```bash
npm install -g vercel
```

### "Build failed"
```bash
# Borra node_modules e intenta de nuevo
rm -rf node_modules package-lock.json
npm install
npm run build
```

### El webhook no funciona después del deploy
1. Verifica que la URL del webhook sea correcta en `src/App.tsx`
2. Verifica que n8n esté activo
3. Revisa los CORS en n8n si es necesario

---

## 🎓 Recursos Adicionales

- [Documentación Vercel](https://vercel.com/docs)
- [Documentación Netlify](https://docs.netlify.com)
- [GitHub para principiantes](https://guides.github.com/activities/hello-world/)
- [Custom domains en Vercel](https://vercel.com/docs/concepts/projects/custom-domains)

---

## 🆘 ¿Necesitas Ayuda?

Si tienes algún problema durante la migración:

1. **Revisa los logs** en Vercel/Netlify
2. **Consulta el README.md** del proyecto
3. **Contacta soporte:**
   - Vercel: [vercel.com/support](https://vercel.com/support)
   - Netlify: [netlify.com/support](https://netlify.com/support)

---

**¡Éxito con tu deploy! 🚀**

*Guía creada por EVOX LLC*
