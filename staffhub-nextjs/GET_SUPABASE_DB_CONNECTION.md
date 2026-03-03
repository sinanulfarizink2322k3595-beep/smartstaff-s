# Get Supabase PostgreSQL Connection String

Your staffhub-nextjs backend needs a PostgreSQL connection. Since you already have Supabase, follow these steps:

## Option 1: Get Connection String from Supabase Dashboard (Recommended - 2 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hocuqeqmhjqloznddrbo)
2. Click **Project Settings** (gear icon in left sidebar)
3. Click **Database** in the left menu
4. Scroll to **Connection String** section
5. Select **URI** tab
6. Copy the connection string (looks like):
   ```
   postgresql://postgres.hocuqeqmhjqloznddrbo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual database password
8. **Important**: Add `?pgbouncer=true&connection_limit=1` to the end for Prisma

**Final format should be:**
```
postgresql://postgres.hocuqeqmhjqloznddrbo:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

## Option 2: Use Direct Connection (For migrations)

For running Prisma migrations, you need the **direct connection** (not pooled):

1. In the same Database settings page
2. Find **Connection String** section  
3. Select **Session mode** (Direct connection)
4. Copy this string (port 5432, not 6543)
5. Format:
   ```
   postgresql://postgres.hocuqeqmhjqloznddrbo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

## Update Backend .env

After getting your connection string, update `staffhub-nextjs/backend/.env`:

```env
# Replace this line:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/staffhub?schema=public"

# With your Supabase connection (for migrations - direct connection):
DATABASE_URL="postgresql://postgres.hocuqeqmhjqloznddrbo:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# For production/runtime (pooled connection):
DATABASE_POOLER_URL="postgresql://postgres.hocuqeqmhjqloznddrbo:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

## Quick Setup Script

Once you have the connection string, run this:

```powershell
# 1. Update .env with your Supabase connection string
# 2. Then run:
cd staffhub-nextjs/backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db push
```

## Troubleshooting

**If you don't remember your database password:**
1. Go to Project Settings → Database
2. Click **Reset Database Password**
3. Copy the new password
4. Use it in your connection string

**If connection fails:**
- Make sure you're using the correct region (check your Supabase dashboard)
- Ensure you added `?pgbouncer=true&connection_limit=1` for pooled connections
- Use direct connection (port 5432) for migrations

## Next Steps

After updating the connection string:
1. Run the database test script I'm creating
2. Test all features with real database
3. Deploy with confidence!
