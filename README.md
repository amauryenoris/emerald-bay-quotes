# 🏢 Emerald Bay Quote System

Professional rental quote management system for Emerald Bay apartment community.

## ✨ Features

- 🌐 **Multi-language Support** - English and Spanish interface
- 👥 **User Management** - Role-based access (Admin/Agent)
- ✅ **Approval System** - Manual user activation by administrators
- 🎁 **Dynamic Specials** - Create and manage promotional offers
- 📊 **Professional Dashboard** - Search, filter, and view all quotes
- 📄 **PDF Generation** - Professional quote documents
- 🔒 **Enterprise Security** - Input sanitization, XSS protection, RLS
- 📱 **Responsive Design** - Works on all devices

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **PDF Generation:** jsPDF
- **Deployment:** Vercel
- **Cost:** $0/month

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (optional for deployment)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/emerald-bay-quotes.git
cd emerald-bay-quotes
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WEBHOOK_URL=your_n8n_webhook_url
```

4. Run development server:

```bash
npm run dev
```

## 🗄️ Database Setup

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed database setup instructions.

## 🔐 Security Features

- ✅ Input validation and sanitization
- ✅ XSS protection with DOMPurify
- ✅ CSRF protection via Supabase
- ✅ Row Level Security (RLS) policies
- ✅ Secure headers (CSP, X-Frame-Options, etc.)
- ✅ Environment variable protection
- ✅ Production error handling

## 📦 Project Structure

```
src/
├── components/
│   ├── common/              # Shared components
│   ├── features/
│   │   ├── auth/           # Login & Register
│   │   ├── dashboard/      # Quote dashboard
│   │   ├── admin/          # Admin panel
│   │   └── quotes/         # Quote components
│   ├── layout/             # Layout components
│   └── LanguageSelector.tsx
├── context/                # React contexts
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── lib/                    # Supabase client
│   └── supabase.ts
├── hooks/                  # Custom hooks
│   └── useLanguage.tsx
├── translations.ts         # i18n translations
├── utils/                  # Utilities & validators
│   ├── sanitize.ts
│   ├── validators.ts
│   └── errorHandler.ts
├── types/                  # TypeScript types
├── App.tsx                 # Main application component
└── main.tsx                # Entry point
```

## 🚀 Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WEBHOOK_URL`
4. Deploy

The application will automatically deploy on every push to the main branch.

## 👥 User Roles

### Agent

- Create quotes
- View all quotes
- Access dashboard
- Cannot access admin panel

### Admin

- All agent permissions
- Manage specials
- Approve/deactivate users
- Full system access

## 📄 License

Private - All rights reserved

## 👨‍💻 Developer

**Amaury Enoris**  
EVOX LLC  
Miami, Florida
