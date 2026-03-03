# SmartStaff Nilgiri - Enterprise Campus Management Platform

> 🚀 **Version 2.0** - Unified multi-tenant SaaS platform combining Next.js + Express with AI-powered features

A comprehensive enterprise-grade campus management system featuring digital outpass requests, meeting scheduling, staff availability tracking, and AI-powered organization building.

## 🌟 Key Features

### 🎯 Core Management Features
- ✅ **Multi-tenant Architecture** - Support unlimited organizations/campuses
- ✅ **Digital Outpass System** - Request, approve, track outpasses with emergency support
- ✅ **Meeting Scheduler** - Book appointments with staff members
- ✅ **Staff Availability** - Real-time availability tracking & analytics
- ✅ **Attendance Management** - Mark and track staff/student attendance
- ✅ **Role-based Access Control** - Admin, Staff, Student, Security dashboards
- ✅ **Real-time Notifications** - Instant updates on all activities
- ✅ **Feedback System** - Collect and manage feedback from users
- ✅ **Analytics Dashboard** - Comprehensive insights and reports

### 🤖 AI-Powered Features
- 🎨 **AI Organization Builder** - Generate complete department structures using GPT-4
- 📋 **Smart Templates** - 7 pre-built organization templates (works without OpenAI)
- 🔧 **Intelligent Role Creation** - AI-suggested roles and permissions
- ⚡ **One-click Setup** - Create entire organizational hierarchies instantly

### 🧪 Developer & DevOps Features
- ✅ **Comprehensive Testing Suite** - 45+ automated database tests
- 📊 **Performance Monitoring** - Query performance tracking & optimization
- 🏥 **Health Checks** - 28 database health checks for production monitoring
- 🌱 **Database Seeding** - Generate realistic sample data
- 📝 **Migration Helper** - Interactive database migration tools
- 📚 **Complete Documentation** - 4 comprehensive guides (1,650+ lines)

## 🏗️ Architecture

```
smartstaffnilgiri-main/
├── staffhub-nextjs/
│   ├── frontend/              # Next.js 14 with App Router
│   │   ├── src/
│   │   │   ├── app/          # Pages (App Router)
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── admin/
│   │   │   │   │   ├── staff/
│   │   │   │   │   ├── student/
│   │   │   │   │   └── security/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── components/
│   │   │   │   ├── ui/       # shadcn/ui components
│   │   │   │   └── ...
│   │   │   └── lib/          # API client, auth utils
│   │   └── package.json
│   │
│   └── backend/               # Express + TypeScript API
│       ├── src/
│       │   ├── controllers/  # API controllers
│       │   ├── routes/       # Express routes
│       │   ├── services/     # Business logic & AI service
│       │   ├── middleware/   # Auth, validation
│       │   └── types/
│       ├── prisma/
│       │   ├── schema.prisma # Database schema (13 models)
│       │   └── migrations/   # Database migrations
│       ├── scripts/          # Database testing utilities
│       │   ├── test-database.js      # 45+ tests
│       │   ├── seed-database.js      # Sample data
│       │   ├── db-health-check.js    # Health monitoring
│       │   ├── performance-utils.js  # Performance tools
│       │   ├── migrate-helper.js     # Migration helper
│       │   └── quick-test.js         # Quick validation
│       ├── docs/             # Comprehensive guides
│       └── package.json
│
├── src/                       # Legacy Vite features (being migrated)
├── package.json              # Root monorepo config
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
```powershell
# Required
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14

# Optional (for AI features)
- OpenAI API Key
```

### 1️⃣ Install Dependencies
```powershell
# Install all packages for monorepo, frontend, and backend
npm run install:all
```

### 2️⃣ Configure Environment

**Backend** (`staffhub-nextjs/backend/.env`):
```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/smartstaff"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# OpenAI API (Optional - for AI Organization Builder)
OPENAI_API_KEY="sk-proj-..."

# Server Configuration
PORT=5000
NODE_ENV="development"
```

**Frontend** (`staffhub-nextjs/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3️⃣ Setup Database
```powershell
# Run database migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed

# Verify database health
npm run db:health
```

### 4️⃣ Start Development
```powershell
# Start both frontend and backend simultaneously
npm run dev

# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

## 📚 Available Scripts

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start both frontend & backend with live reload |
| `npm run dev:frontend` | Start Next.js frontend only (port 3000) |
| `npm run dev:backend` | Start Express API only (port 5000) |

### Building & Production
| Command | Description |
|---------|-------------|
| `npm run build` | Build both frontend and backend for production |
| `npm run start` | Start both apps in production mode |
| `npm run build:frontend` | Build Next.js app |
| `npm run build:backend` | Build Express API |

### Database Management
| Command | Description |
|---------|-------------|
| `npm run db:migrate` | 🗄️ Run Prisma migrations |
| `npm run db:seed` | 🌱 Seed database with sample data |
| `npm run db:test` | 🧪 Run comprehensive database tests (45+ tests) |
| `npm run db:health` | 🏥 Run 28 health checks |
| `npm run db:quick` | ⚡ Quick validation test |
| `npm run db:perf` | 📊 Performance analysis |
| `npm run db:reset` | ⚠️ Reset database (deletes all data) |
| `npm run db:test:ai` | 🤖 Test AI Organization Builder |

### Utilities
| Command | Description |
|---------|-------------|
| `npm run lint` | Lint all workspaces |
| `npm run type-check` | TypeScript type checking |
| `npm run test` | Run test suite |
| `npm run clean` | Clean all node_modules and build files |
| `npm run install:all` | Install dependencies for all workspaces |

## 🗄️ Database Schema

**13 Prisma Models:**

```typescript
* Organization      - Multi-tenant organizations
* User              - Users with roles (ADMIN, STAFF, STUDENT, SECURITY)
* Department        - Organizational departments
* CustomRole        - Role definitions
* Permission        - Permission management
* StaffMember       - Staff information
* StaffAvailability - Availability schedules
* OutpassRequest    - Outpass management
* MeetingRequest    - Meeting bookings
* Attendance        - Attendance tracking
* Feedback          - User feedback
* Notification      - Push notifications
* AuditLog          - System audit trail
```

## 🤖 AI Organization Builder

### Test AI Features (No Database Required)
```powershell
# Generate organization structure with AI
npm run db:test:ai "Create a computer science department with 5 courses"

# Try different templates
npm run db:test:ai "Create a healthcare facility with emergency care"
npm run db:test:ai "Create a tech startup with engineering teams"
```

### Available Templates (Work without OpenAI API)
1. 🏥 Healthcare Facility
2. 🎓 Educational Institution
3. 💼 Corporate Office
4. 🏭 Manufacturing Plant
5. 🏪 Retail Business
6. 💻 Technology Startup
7. 🏛️ Government Agency

### Using AI in Production
- Set `OPENAI_API_KEY` in backend `.env`
- Navigate to Admin Dashboard → AI Organization Builder
- Describe your organization in natural language
- AI generates complete structure with departments, roles & permissions
- Review and adjust before applying

## 🧪 Database Testing

### Comprehensive Test Suite
```powershell
# Quick validation (30 seconds)
npm run db:quick

# Full test suite - 45+ tests (2-3 minutes)
npm run db:test

# Health check - 28 checks
npm run db:health

# Performance profiling
npm run db:perf
```

### What Gets Tested?
- ✅ Connection & Schema validation
- ✅ Multi-tenant isolation
- ✅ Role-based access control
- ✅ Cascade deletes & referential integrity
- ✅ Complex queries & joins
- ✅ Performance benchmarks
- ✅ Data consistency
- ✅ Index effectiveness

## 🔐 Authentication & Authorization

### API Authentication
- JWT-based token authentication
- Tokens expire in 7 days (configurable)
- Role-based access control (RBAC)
- Organization-scoped data isolation

### Roles & Permissions
| Role | Capabilities |
|------|-------------|
| **ADMIN** | Full system access, user management, AI org builder |
| **STAFF** | Approve outpasses/meetings, manage availability |
| **STUDENT** | Request outpasses, book meetings, view staff availability |
| **SECURITY** | Verify outpasses, create emergency requests, gate logs |

### Protected Routes
```typescript
// API Middleware
authenticate()                        // Requires valid JWT
authorize('ADMIN', 'STAFF')          // Role-based access
organizationScope()                   // Organization isolation

// Frontend
<ProtectedRoute allowedRoles={['ADMIN']}>
  <AdminPage />
</ProtectedRoute>
```

## 📊 API Documentation

**Base URL:** `http://localhost:5000/api`

### Authentication Endpoints
```
POST /auth/register    - Register new organization + admin user
POST /auth/login       - Login (returns JWT token)
```

### Resource Endpoints
```
/users                 - User CRUD (ADMIN only)
/departments           - Department management
/staff                 - Staff member management
/outpass               - Outpass request lifecycle
/meetings              - Meeting booking system
/feedback              - Feedback collection
/notifications         - Notification system
/attendance            - Attendance tracking
/orgbuilder            - AI Organization Builder (ADMIN only)
```

**All endpoints require authentication** (except `/auth/*`)

## 🎨 Tech Stack

### Frontend
- ⚛️ **Next.js 14** - React framework with App Router
- 🎨 **Tailwind CSS** - Utility-first styling
- 🧩 **Radix UI** - Accessible component primitives
- 🔄 **Tanstack Query** - Data fetching & caching
- 📡 **Axios** - HTTP client
- 🎭 **TypeScript** - Type safety

### Backend
- 🟢 **Node.js** - JavaScript runtime
- 🚂 **Express** - Web framework
- 🗃️ **Prisma ORM** - Database toolkit
- 🐘 **PostgreSQL** - Relational database
- 🔐 **JWT** - Authentication
- 🤖 **OpenAI GPT-4** - AI features (optional)
- 📝 **TypeScript** - Type safety

### Testing & DevOps
- ✅ **Vitest** - Unit testing
- 🧪 **Custom Test Suite** - Database testing (2,850+ lines)
- 📊 **Performance Profiling** - Query optimization
- 🏥 **Health Monitoring** - Production readiness checks

## 📖 Documentation

Detailed guides available in `staffhub-nextjs/backend/docs/`:

1. **`DATABASE_MIGRATION_GUIDE.md`** (450 lines)
   - Migration workflows & best practices
   - Schema evolution strategies
   - Rollback procedures

2. **`DATABASE_TESTING_GUIDE.md`** (600 lines)
   - Complete testing infrastructure
   - 45+ test descriptions
   - CI/CD integration

3. **`DATABASE_PERFORMANCE_GUIDE.md`** (350 lines)
   - Query optimization techniques
   - Indexing strategies
   - Performance monitoring

4. **`AI_ORGANIZATION_BUILDER.md`** (250 lines)
   - AI feature architecture
   - Template customization
   - API usage examples

## 🚀 Deployment

### Production Build
```powershell
# Build both frontend and backend
npm run build

# Start production servers
npm run start
```

### Environment Variables (Production)
```env
# Backend
DATABASE_URL="postgresql://..."     # Production DB
JWT_SECRET="..."                     # Strong secret (min 32 chars)
NODE_ENV="production"
PORT=5000

# Frontend
NEXT_PUBLIC_API_URL="https://api.yourcompany.com/api"
```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Backend**: Railway, Render, Heroku, AWS ECS
- **Database**: Railway PostgreSQL, Supabase, AWS RDS

## 🔧 Troubleshooting

### Database Connection Issues
```powershell
# Check PostgreSQL is running
# Windows: Check Services
# Verify DATABASE_URL format

# Test connection
npm run db:health
```

### Migration Issues
```powershell
# Reset database (WARNING: deletes data)
npm run db:reset

# Run migrations again
npm run db:migrate
```

### Port Conflicts
```env
# Change backend port in .env
PORT=5001

# Update frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## 📝 Project Status

### ✅ Completed (v2.0)
- [x] Multi-tenant architecture
- [x] Complete authentication system
- [x] All API endpoints
- [x] AI Organization Builder
- [x] Database testing suite (45+ tests)
- [x] Health monitoring system
- [x] Performance optimization tools
- [x] Comprehensive documentation
- [x] Admin dashboard
- [x] Basic role dashboards

### 🚧 In Progress
- [ ] Migrating all Vite UI pages to Next.js
- [ ] Complete student feature pages
- [ ] Complete staff feature pages
- [ ] Complete security feature pages
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard

### 🎯 Roadmap
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Export to PDF/Excel
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Dark mode enhancements

## 🤝 Contributing

This is a private project for Nilgiri campus management.

## 📧 Support

For support, contact the SmartStaff development team.

## 📄 License

MIT License - See LICENSE file for details.

---

**🎓 Built with ❤️ for efficient campus management at Nilgiri**

**What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

This project can be deployed to any static hosting service that supports React applications:

```sh
# Build for production
npm run build

# The built files will be in the dist/ directory
```

## Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
