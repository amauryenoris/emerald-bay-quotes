# 🏢 Emerald Bay Quote Generator

Sistema profesional de cotizaciones para la comunidad residencial Emerald Bay en Hialeah, Florida.

## ✨ Características

- 🏠 **13 tipos de apartamentos** con precios dinámicos
- 🌐 **Sistema bilingüe** (Inglés/Español)
- 📊 **Cálculos automáticos** de prorrateo
- 💰 **Descuentos especiales** configurables
- 📄 **Generación de PDF** profesional
- 📧 **Envío automático** vía n8n webhook
- 🎨 **Diseño responsive** con Tailwind CSS

## 🚀 Deploy a Producción

### Opción 1: Vercel (Recomendado - GRATIS)

1. **Instala Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd emerald-bay-quotes
vercel --prod
```

4. **Dominio personalizado:**
- Ve a tu proyecto en vercel.com
- Settings → Domains
- Agrega: `quotes.emeraldbay.com` (o el que prefieras)

### Opción 2: Netlify

1. **Instala Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login y Deploy:**
```bash
netlify login
netlify init
netlify deploy --prod
```

### Opción 3: GitHub + Vercel (Deploy Automático)

1. **Sube a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit - Emerald Bay Quotes"
gh repo create emerald-bay-quotes --public --source=. --remote=origin --push
```

2. **Conecta con Vercel:**
- Ve a [vercel.com/new](https://vercel.com/new)
- Importa tu repositorio de GitHub
- Click en "Deploy" ✅

Cada vez que hagas `git push`, se deployará automáticamente.

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview
```

## 📝 Configuración del Webhook

El webhook de n8n está configurado en `src/App.tsx`:

```typescript
const WEBHOOK_URL = 'https://n8n.srv894089.hstgr.cloud/webhook/4723cc4d-53ba-4390-862b-602a7c5c010c';
```

Para cambiar el webhook:
1. Abre `src/App.tsx`
2. Modifica la constante `WEBHOOK_URL`
3. Redeploy la aplicación

## 🎯 Estructura del Proyecto

```
emerald-bay-quotes/
├── src/
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   ├── index.css            # Estilos globales
│   ├── components/
│   │   ├── LanguageSelector.tsx
│   │   └── PetRentDisplay.tsx
│   └── hooks/
│       └── useLanguage.tsx  # Hook de internacionalización
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 💵 Lógica de Precios

### Apartamentos y Precios Base
- **1/1** (Coral): $2,000
- **1/1** (Otros): $2,250
- **2/2**: $2,650 o $2,785
- **3/2**: $2,950 o $3,220
- **3/2.5** (Hemingway): $3,785 o $3,645

### Cargos Adicionales
- **Application Fee**: $50 por persona
- **Pet Rent**: $35 por mascota/mes
- **Extra Parking**: $50/mes
- **Animal Cleanup**: $500 (no reembolsable)
- **Security Deposit**: Igual a la renta mensual

### Descuentos Especiales
1. **Descuento Especial #1**:
   - $100 descuento en renta mensual
   - $500 descuento en depósito

2. **Descuento Especial #2**:
   - $500 descuento en depósito
   - $1,200 adicional en move-in
   - **Total**: $1,700 de descuento

### Prorrateo
Si la fecha de mudanza no es el día 1:
- Renta base: `(renta_mensual / 30) * días_restantes`
- Pet rent: `(35 / 30) * días_restantes * número_mascotas`
- Parking: `(50 / 30) * días_restantes`

## 🔧 Tecnologías

- **React 18** + **TypeScript**
- **Vite** (Build tool ultra rápido)
- **Tailwind CSS** (Estilos)
- **Lucide React** (Iconos)
- **jsPDF** / **html2canvas** (Generación de PDFs)
- **date-fns** (Manejo de fechas)

## 📊 Costos de Hosting

| Plataforma | Costo | Incluye |
|------------|-------|---------|
| **Vercel** | $0 (Gratis) | SSL, CDN, Dominio custom |
| **Netlify** | $0 (Gratis) | SSL, CDN, Forms |
| **Railway** | $5/mes | DB + Backend |
| **Bolt.new** | Limitado | No recomendado para producción |

## 🎨 Personalización

### Cambiar colores
Edita `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      // ...
    }
  }
}
```

### Agregar apartamentos
Edita el array `apartments` en `src/App.tsx`:

```typescript
const apartments = [
  { id: 'nuevo', name: 'Nuevo Apt (2/1)', category: '2/1' },
  // ...
];
```

### Modificar traducciones
Edita `src/hooks/useLanguage.tsx` en el objeto `translations`.

## 📧 Soporte

Para soporte técnico o preguntas:
- **Email**: info@emeraldbay.com
- **Desarrollador**: EVOX LLC - Amaury

## 📄 Licencia

© 2024 Emerald Bay - EVOX LLC. Todos los derechos reservados.

---

**Desarrollado con ❤️ por EVOX LLC**
