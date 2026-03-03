# StaffHub Development Setup Guide

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **bun** or **pnpm**
- **PostgreSQL** 14 or higher (local or cloud)
- **Git** for version control

## Project Structure

```
staffhub-nextjs/
├── backend/               # Express API + Prisma
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, error handling
│   │   └── server.ts     # Express app
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/             # Next.js 14 App
    ├── src/
    │   ├── app/          # App Router pages
    │   ├── components/   # React components
    │   ├── lib/          # Utilities (API, auth)
    │   └── hooks/        # Custom hooks
    ├── package.json
    ├── next.config.js
    └── tailwind.config.js
```

## Backend Setup

### 1. Navigate to Backend

```bash
cd staffhub-nextjs/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/staffhub"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
```

**For PostgreSQL Cloud Options:**
- **Neon:** https://neon.tech (Free tier, serverless)
- **Railway:** https://railway.app (Free trial, easy setup)
- **Supabase:** https://supabase.com (Free tier with extras)

### 4. Set Up Database

Generate Prisma Client:
```bash
npx prisma generate
```

Create database and run migrations:
```bash
npx prisma migrate dev --name init
```

(Optional) Open Prisma Studio to view database:
```bash
npx prisma studio
```

### 5. Start Backend Server

**Development mode:**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

**Check it's working:**
```bash
curl http://localhost:5000/api/auth/verify
```

## Frontend Setup

### 1. Navigate to Frontend

```bash
cd staffhub-nextjs/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Frontend Server

**Development mode:**
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### 5. Open Browser

Navigate to:
- Landing page: http://localhost:3000
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register

## First Organization Setup

1. Go to http://localhost:3000/register
2. Fill in the registration form:
   - **Organization Name:** Your institution name
   - **Your Name:** Admin user name
   - **Email:** admin@example.com
   - **Password:** Choose a strong password
3. Click "Create organization"
4. You'll be logged in as ADMIN and redirected to admin dashboard

## Creating Test Users

After registering your organization, you can create test users through the API or Prisma Studio.

### Using Prisma Studio:

```bash
cd backend
npx prisma studio
```

1. Open the `User` model
2. Click "+ Add record"
3. Fill in:
   - email: test@example.com
   - name: Test User
   - role: STUDENT (or STAFF, SECURITY)
   - organizationId: (copy from existing user)
   - password: (bcrypt hash - see below)
4. Save

### To generate bcrypt password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('password123', 10))"
```

## Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd staffhub-nextjs/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd staffhub-nextjs/frontend
npm run dev
```

### Making Database Changes

1. Edit `backend/prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Prisma Client is auto-generated

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## API Testing

You can test the API using:

### cURL

**Register organization:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test University",
    "name": "Admin User",
    "email": "admin@test.edu",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.edu",
    "password": "password123"
  }'
```

**Get users (with token):**
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman Collection

You can import the API endpoints into Postman:

1. Base URL: `http://localhost:5000/api`
2. Set Authorization header: `Bearer YOUR_JWT_TOKEN`
3. Test endpoints:
   - POST `/auth/register`
   - POST `/auth/login`
   - GET `/auth/me`
   - GET `/users`
   - POST `/outpass`
   - GET `/outpass`
   - POST `/meetings`
   - GET `/staff`

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`
- Check PostgreSQL is running: `pg_ctl status`
- Verify DATABASE_URL in `.env`
- Check firewall settings

### Port Already in Use

**Backend (5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**Frontend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Not Generated

```bash
cd backend
npx prisma generate
```

### CORS Issues

CORS is configured in `backend/src/server.ts`. If you need to add origins:

```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
}));
```

### JWT Token Issues

- Check JWT_SECRET is set in backend `.env`
- Token expires after 7 days (configured in auth.controller.ts)
- Clear localStorage in browser if token is stale

## VS Code Extensions (Recommended)

- **Prisma** - Syntax highlighting for Prisma schema
- **ESLint** - JavaScript linting
- **Tailwind CSS IntelliSense** - Tailwind class autocomplete
- **TypeScript Vue Plugin** - TypeScript support

## Useful Commands

**Backend:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Open database GUI
npx prisma migrate dev    # Create migration
npx prisma db push   # Push schema (without migration)
```

**Frontend:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Next Steps

1. ✅ Complete the setup above
2. ✅ Create your first organization
3. ✅ Explore the dashboards (Admin, Staff, Student, Security)
4. 🔄 Build feature pages (outpass requests, meeting booking, etc.)
5. 🔄 Add UI components (Select, Dialog, Table, etc.)
6. 🔄 Implement real-time updates
7. 🔄 Add email notifications
8. 🔄 Deploy to production

## Getting Help

- Check `PROJECT_STATUS.md` for implementation status
- Review backend code in `backend/src/`
- Review frontend code in `frontend/src/`
- Check API documentation in main `README.md`

---

**Happy Coding! 🚀**
