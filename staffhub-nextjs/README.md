# StaffHub - Multi-Tenant Staff Availability & Outpass Management System

A modern full-stack SaaS application for managing staff availability, student outpass requests, meetings, and campus security operations.

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with multi-tenant architecture
- **Authentication**: JWT-based authentication with role-based access control
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend + DB)

## 📁 Project Structure

```
staffhub-nextjs/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/      # Next.js 14 App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   └── package.json
│
├── backend/           # Express backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/       # Database schema and migrations
│   └── package.json
│
└── README.md
```

## 🚀 Features

### Multi-Tenant SaaS
- Organizations can sign up and create isolated workspaces
- Data isolation per organization
- Tenant-aware database queries
- Organization-level settings and branding

### Role-Based Access Control
- **Admin**: Organization management, user management, analytics
- **Staff**: Approve/reject requests, manage availability, view meetings
- **Student**: Submit outpass requests, book meetings, view approvals
- **Security**: Verify outpasses, track gate status, emergency requests

### Core Modules
- **Outpass Management**: Digital outpass requests with approval workflow
- **Meeting Scheduler**: Book appointments with staff members
- **Staff Availability**: Real-time availability tracking and management
- **Security Dashboard**: Outpass verification, gate tracking, emergency handling
- **Analytics**: Comprehensive dashboards for all roles

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+
- Git

### Backend Setup

```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your backend API URL

# Start development server
npm run dev
```

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/staffhub"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key tables:
- **organizations**: Tenant organizations
- **users**: User accounts linked to organizations
- **profiles**: Extended user information
- **staff_members**: Staff member records
- **outpass_requests**: Student outpass requests
- **meeting_requests**: Meeting booking requests
- **staff_availability**: Staff availability schedules

## 🎨 UI/UX

- Modern, responsive design with Tailwind CSS
- Dark mode support
- Mobile-first approach
- Accessible components (WCAG 2.1 AA compliant)

## 📦 Tech Stack Details

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS
- **Shadcn/ui**: Re-usable component library
- **React Hook Form**: Form validation
- **Zod**: Schema validation
- **TanStack Query**: State management and caching
- **Axios**: HTTP client

### Backend
- **Express**: Web framework
- **TypeScript**: Type-safe development
- **Prisma**: ORM for PostgreSQL
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Express Validator**: Request validation
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Morgan**: Logging

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Multi-tenant data isolation
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection
- Rate limiting
- Helmet security headers

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Railway/Render)
- Connect GitHub repository
- Set environment variables
- Deploy automatically on push

## 📝 API Documentation

API endpoints are documented in `/backend/API.md`

Base URL: `http://localhost:5000/api`

### Authentication
- POST `/auth/register` - Register new organization
- POST `/auth/login` - User login
- POST `/auth/verify` - Verify JWT token

### Organizations
- GET `/organizations/:id` - Get organization details
- PATCH `/organizations/:id` - Update organization

### Users
- GET `/users/profile` - Get current user profile
- PATCH `/users/profile` - Update profile

### Outpass
- GET `/outpass` - List outpass requests
- POST `/outpass` - Create outpass request
- PATCH `/outpass/:id` - Update outpass status

### Meetings
- GET `/meetings` - List meeting requests
- POST `/meetings` - Create meeting request
- PATCH `/meetings/:id` - Update meeting status

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

This is a private project. For internal use only.

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Department of Computer Science - Smart Staff Nilgiri Team

---

**Version**: 2.0.0
**Last Updated**: February 28, 2026
