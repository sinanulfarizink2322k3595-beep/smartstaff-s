# SmartStaff Nilgiri - Architecture Documentation

## System Architecture Overview

SmartStaff Nilgiri v2.0 is a **monorepo-based multi-tenant SaaS platform** that combines modern web technologies with AI capabilities for campus management.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                 │
│  (Students, Staff, Security, Admin)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js 14)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - React Server Components (RSC)                    │    │
│  │  - App Router (file-based routing)                  │    │
│  │  - Tanstack Query (data fetching/caching)           │    │
│  │  - Radix UI Components                              │    │
│  │  - Tailwind CSS                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ REST API (JSON)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend (Express + TypeScript)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Layer                                          │    │
│  │  ├─ Authentication (JWT)                            │    │
│  │  ├─ Authorization (RBAC)                            │    │
│  │  ├─ Organization Scoping (Multi-tenant)             │    │
│  │  └─ Rate Limiting & Validation                      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Business Logic Layer                               │    │
│  │  ├─ User Management                                 │    │
│  │  ├─ Outpass Workflow                                │    │
│  │  ├─ Meeting Scheduler                               │    │
│  │  ├─ Attendance Tracking                             │    │
│  │  └─ AI Organization Builder (OpenAI GPT-4)          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Data Access Layer (Prisma ORM)                     │    │
│  │  ├─ Type-safe queries                               │    │
│  │  ├─ Migration management                            │    │
│  │  ├─ Connection pooling                              │    │
│  │  └─ Query optimization                              │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               PostgreSQL Database                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - 13 core tables                                   │    │
│  │  - Multi-tenant isolation                           │    │
│  │  - ACID compliance                                  │    │
│  │  - Indexes for performance                          │    │
│  │  - Foreign key constraints                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│            External Services                                 │
│  - OpenAI API (GPT-4) for AI features                       │
│  - Email Service (planned)                                   │
│  - SMS Gateway (planned)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo Structure

### Workspace Architecture

```
smartstaffnilgiri-main/              # Monorepo root
│
├── package.json                      # Root workspace config
│   └── workspaces: [frontend, backend]
│
├── staffhub-nextjs/
│   ├── frontend/                     # Next.js workspace
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   ├── components/           # React components
│   │   │   └── lib/                  # Utilities
│   │   ├── public/
│   │   └── package.json              # Frontend deps
│   │
│   └── backend/                      # Express workspace
│       ├── src/
│       │   ├── controllers/          # Request handlers
│       │   ├── routes/               # API routes
│       │   ├── services/             # Business logic
│       │   ├── middleware/           # Auth, validation
│       │   └── types/                # TypeScript types
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema
│       │   └── migrations/           # Schema versions
│       ├── scripts/                  # Testing utilities
│       ├── docs/                     # Documentation
│       └── package.json              # Backend deps
│
└── src/                              # Legacy Vite app (being migrated)
```

### Dependency Management

- **Hoisting**: Shared dependencies hoisted to root
- **Isolation**: Workspace-specific deps stay local
- **Scripts**: Root scripts delegate to workspaces

---

## 🔐 Authentication & Authorization Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /api/auth/login
     │    { email, password }
     ▼
┌──────────────────┐
│  Auth Controller │
└────┬─────────────┘
     │
     │ 2. Validate credentials
     │ 3. Query user from DB
     ▼
┌──────────────────┐
│   User Service   │
└────┬─────────────┘
     │
     │ 4. bcrypt.compare()
     │ 5. Generate JWT token
     ▼
┌──────────────────┐
│   JWT Payload    │
│  {               │
│    userId,       │
│    organizationId│
│    role,         │
│    exp           │
│  }               │
└────┬─────────────┘
     │
     │ 6. Return token to client
     ▼
┌──────────┐
│  Client  │
│  Stores: │
│  - Token │
│  - User  │
└────┬─────┘
     │
     │ 7. Subsequent requests
     │    Header: Authorization: Bearer <token>
     ▼
┌────────────────────┐
│  Auth Middleware   │
│  1. Verify JWT     │
│  2. Decode payload │
│  3. Attach to req  │
└────┬───────────────┘
     │
     │ 8. Role check
     ▼
┌───────────────────┐
│ Authorize('ADMIN')│
│ Check req.user   │
└────┬──────────────┘
     │
     │ 9. Org scope
     ▼
┌──────────────────┐
│  Query with      │
│  organizationId  │
└──────────────────┘
```

---

## 🗄️ Database Architecture

### Multi-tenant Strategy: **Shared Database, Discriminated by organizationId**

```
┌─────────────────────────────────────────┐
│          PostgreSQL Database            │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Organizations Table             │  │
│  │  id | name | domain | createdAt  │  │
│  │  1  | ACME | acme   | 2024-01-01 │  │
│  │  2  | XYZ  | xyz    | 2024-01-02 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Users Table                     │  │
│  │  id | orgId | name | role        │  │
│  │  1  | 1     | John | ADMIN       │  │
│  │  2  | 1     | Jane | STAFF       │  │
│  │  3  | 2     | Bob  | ADMIN       │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Departments                     │  │
│  │  id | orgId | name               │  │
│  │  1  | 1     | CS                 │  │
│  │  2  | 1     | IT                 │  │
│  │  3  | 2     | HR                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ... (All tables have organizationId)  │
└─────────────────────────────────────────┘
```

**Isolation Strategy:**
- Every query filtered by `organizationId`
- Middleware automatically injects org filter
- Foreign keys maintain referential integrity
- Indexes on `organizationId` for performance

### Database Models

```typescript
Organization  ─┬─> User
               ├─> Department ─> CustomRole ─> Permission
               ├─> StaffMember ─> StaffAvailability
               ├─> OutpassRequest
               ├─> MeetingRequest
               ├─> Attendance
               ├─> Feedback
               ├─> Notification
               └─> AuditLog
```

---

## 🔄 Request Processing Flow

### Example: Student creates outpass request

```
1. Client (Frontend)
   ├─> User fills outpass form
   └─> POST /api/outpass
       Body: {
         reason: "Home visit",
         fromDate: "2024-03-01",
         toDate: "2024-03-03"
       }
       Header: Authorization: Bearer <JWT>

2. Backend (Express)
   ├─> Middleware: authenticate()
   │   ├─> Verify JWT signature
   │   ├─> Decode payload → req.user = { userId, orgId, role }
   │   └─> Next()
   │
   ├─> Middleware: authorize('STUDENT')
   │   ├─> Check req.user.role === 'STUDENT'
   │   └─> Next()
   │
   ├─> Controller: createOutpass()
   │   ├─> Validate request body
   │   ├─> Call outpassService.create()
   │   └─> Return response
   │
   └─> Service: outpassService.create()
       ├─> Prisma query:
       │   await prisma.outpassRequest.create({
       │     data: {
       │       ...body,
       │       userId: req.user.userId,
       │       organizationId: req.user.orgId,
       │       status: 'PENDING'
       │     }
       │   })
       │
       ├─> Create notification for staff
       └─> Return created outpass

3. Database (PostgreSQL)
   ├─> Insert into outpass_requests table
   ├─> Insert into notifications table
   └─> Return inserted rows

4. Backend Response
   └─> Status: 201 Created
       Body: { outpass: { id, status, ... } }

5. Client Updates
   ├─> Tanstack Query invalidates cache
   ├─> Refetch outpass list
   └─> Show success toast
```

---

## 🤖 AI Organization Builder Architecture

```
┌──────────────────────────┐
│  Admin Dashboard (UI)    │
│  - Input: Description    │
│  - Output: Org Structure │
└────────┬─────────────────┘
         │
         │ POST /api/orgbuilder/generate
         │ { description, useAI: true }
         ▼
┌────────────────────────────┐
│  OrgBuilder Controller     │
└────────┬───────────────────┘
         │
         │ Call: aiService.generateStructure()
         ▼
┌────────────────────────────┐
│     AI Service             │
│  ┌──────────────────────┐  │
│  │ Has OpenAI API Key?  │  │
│  └──────┬───────────────┘  │
│         │                   │
│    Yes  │  No              │
│    ┌────▼────┐  ┌─────────▼┐
│    │ OpenAI  │  │ Fallback ││
│    │ GPT-4   │  │ Template ││
│    └────┬────┘  └─────┬────┘
│         │             │      │
│         └─────┬───────┘      │
└───────────────┼──────────────┘
                │
                │ Return: {
                │   departments: [...],
                │   roles: [...],
                │   permissions: [...]
                │ }
                ▼
┌────────────────────────────┐
│     Controller             │
│  - Parse AI output         │
│  - Validate structure      │
│  - Return to client        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│     Frontend               │
│  - Display preview         │
│  - Allow editing           │
│  - Confirm to apply        │
└────────┬───────────────────┘
         │
         │ POST /api/orgbuilder/apply
         ▼
┌────────────────────────────┐
│    Database                │
│  - Create departments      │
│  - Create roles            │
│  - Create permissions      │
│  - Create relationships    │
└────────────────────────────┘
```

---

## 📊 Performance Optimization

### Frontend Optimization

1. **Next.js App Router**
   - Server-side rendering (SSR)
   - Static site generation (SSG)
   - Incremental static regeneration (ISR)
   - Automatic code splitting

2. **React Query**
   - Intelligent caching
   - Background refetching
   - Stale-while-revalidate
   - Optimistic updates

3. **Component Optimization**
   - React.memo for expensive components
   - useCallback for function stability
   - Lazy loading with dynamic imports
   - Image optimization with next/image

### Backend Optimization

1. **Database**
   - Connection pooling (Prisma)
   - Indexes on frequently queried columns
   - Composite indexes for common queries
   - Query result caching

2. **API**
   - Response compression (gzip)
   - Rate limiting per role
   - Pagination for list endpoints
   - Field selection (only request needed data)

3. **Prisma ORM**
   - N+1 query prevention with includes
   - Batch operations
   - Transaction support
   - Prepared statements

---

## 🔒 Security Architecture

### Layers of Security

```
1. Network Layer
   ├─> HTTPS/TLS encryption
   ├─> CORS configuration
   └─> Rate limiting

2. Authentication Layer
   ├─> JWT tokens (httpOnly cookies in production)
   ├─> Bcrypt password hashing
   ├─> Token expiration (7 days)
   └─> Refresh token rotation (planned)

3. Authorization Layer
   ├─> Role-based access control (RBAC)
   ├─> Resource ownership validation
   └─> Organization-scoped queries

4. Data Layer
   ├─> SQL injection prevention (Prisma parameterized queries)
   ├─> XSS protection (React auto-escaping)
   ├─> CSRF protection (planned)
   └─> Input validation (Zod schemas)

5. Audit Layer
   ├─> Audit log for sensitive operations
   ├─> Error logging (without sensitive data)
   └─> Access logs
```

---

## 📈 Scalability Considerations

### Horizontal Scaling

```
Load Balancer
     │
     ├─> Frontend Server 1 (Next.js)
     ├─> Frontend Server 2 (Next.js)
     └─> Frontend Server 3 (Next.js)

API Gateway
     │
     ├─> Backend Server 1 (Express)
     ├─> Backend Server 2 (Express)
     └─> Backend Server 3 (Express)
               │
               ▼
      Database Connection Pool
               │
               ▼
      PostgreSQL (Primary + Replicas)
```

### Caching Strategy

```
Client Cache (React Query)
     ↓
CDN Cache (Static Assets)
     ↓
Application Cache (Redis - planned)
     ↓
Database Query Cache (Prisma)
     ↓
Database
```

---

## 🧪 Testing Architecture

### Testing Pyramid

```
        ▲
       /E2\        E2E Tests (Planned)
      /───\        - Full user workflows
     /Unit \       - Critical paths
    /───────\      
   /Component\     Component Tests
  /───────────\    - React components
 /Integration  \   - API endpoints
/───────────────\  
                   Unit Tests
                   - Business logic
                   - Utilities
                   ──────────────
                   Database Tests
                   - Schema validation
                   - Query performance
                   - Multi-tenant isolation
```

---

## 🚀 Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────┐
│          Vercel (Frontend)          │
│  - Next.js SSR/SSG                  │
│  - Edge Functions                   │
│  - CDN Distribution                 │
└────────────┬────────────────────────┘
             │
             │ API Calls
             ▼
┌─────────────────────────────────────┐
│       Railway/Render (Backend)      │
│  - Express API                      │
│  - Auto-scaling                     │
│  - Health checks                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Railway PostgreSQL (Database)     │
│  - Managed PostgreSQL               │
│  - Automated backups                │
│  - Connection pooling               │
└─────────────────────────────────────┘
```

---

## 📚 Technology Decisions

### Why Next.js over Vite?

| Feature | Next.js | Vite |
|---------|---------|------|
| SSR | ✅ Built-in | ❌ Requires setup |
| Routing | ✅ File-based | ❌ Manual |
| API Routes | ✅ Yes | ❌ No |
| SEO | ✅ Excellent | ⚠️ Limited |
| Performance | ✅ Optimized | ✅ Fast dev |
| Production | ✅ Vercel | ⚠️ Manual |

### Why PostgreSQL over MongoDB?

- Strong ACID compliance
- Relational data structure fits campus management
- Complex queries and joins
- Foreign key constraints
- Mature ecosystem
- Better data integrity

### Why Express over NestJS?

- Simpler learning curve
- More flexibility
- Lighter weight
- Faster development
- \Better for small-medium teams
- Extensive ecosystem

---

## 🔄 Migration Strategy (Vite → Next.js)

1. **Phase 1**: Set up Next.js infrastructure ✅
2. **Phase 2**: Migrate components to Next.js
3. **Phase 3**: Port pages to App Router
4. **Phase 4**: Connect to Express API
5. **Phase 5**: Replace Supabase with Express endpoints
6. **Phase 6**: Testing and validation
7. **Phase 7**: Deprecate Vite app

---

**This architecture provides:**
- ✅ Scalability for growth
- ✅ Security at multiple layers
- ✅ Performance optimization
- ✅ Developer experience
- ✅ Maintainability
- ✅ Production-readiness

---

**Last Updated:** February 28, 2026  
**Version:** 2.0.0
