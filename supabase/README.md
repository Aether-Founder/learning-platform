# Supabase Configuration & Migrations

This folder contains all Supabase-related configuration, SQL scripts, and migration files.

## 📁 Folder Structure

```
supabase/
├── README.md                          # This file
├── migrations/                        # SQL migration scripts
│   ├── 001_initial_schema.sql        # Initial database schema (ALREADY RAN ✅)
│   ├── 002_seed_data.sql             # Seed data (upcoming)
│   └── 003_*.sql                     # Future migrations
└── config/                            # Configuration files
    ├── supabase-client.ts            # Browser client config
    └── supabase-server.ts            # Server client config
```

## 🗄️ Migration History

| # | File | Description | Date Run | Status |
|---|------|-------------|----------|--------|
| 001 | `001_initial_schema.sql` | Initial database schema with 11 tables + RLS | 2026-08-06 | ✅ Complete |
| 002 | `002_seed_data.sql` | Import study content from JSON files | Pending | ⏳ |

## 📋 Database Tables

The following tables were created in migration `001`:

### Core Tables
1. **users** - User profiles (extends Supabase auth.users)
2. **subjects** - School subjects (Natuurkunde, Wiskunde, etc.)
3. **study_sets** - Collections of flashcards
4. **flashcards** - Individual Q&A cards

### Study Tracking
5. **study_sessions** - Track study time and performance
6. **card_reviews** - Individual card review history (for spaced repetition)
7. **reading_progress** - Track reading position in study materials

### Features
8. **achievements** - Badges and milestones
9. **calendar_events** - Agenda items (toets, examen, etc.)
10. **bookmarks** - Saved study materials

### Analytics
11. **analytics_events** - Track user interactions for insights

## 🔐 Security Features

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Public study sets are readable by everyone
- Automatic user profile creation on signup

## 🚀 Running Migrations

### Initial Schema (Already Done ✅)
The `001_initial_schema.sql` was run in Supabase SQL Editor.

### Future Migrations
To run a new migration:

1. Create SQL file in `migrations/` with format: `00X_description.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Create new query
4. Copy-paste the SQL content
5. Click Run
6. Update this README with status

### Or use Supabase CLI (Optional)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref zbppznuwwcjdbdbkexyq

# Run migrations
supabase db push
```

## 🔄 Rollback Strategy

If a migration fails:
1. Check error message in Supabase SQL Editor
2. Fix the SQL script
3. Drop tables if needed: `DROP TABLE IF EXISTS table_name CASCADE;`
4. Re-run the corrected migration

## 📊 Monitoring

Check database health:
- Supabase Dashboard → Database → Health
- Monitor table sizes and indexes
- Check RLS policies are working

## 🛠️ Useful SQL Queries

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Count Rows in All Tables
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

## 📝 Notes

- All migrations should be idempotent (can be run multiple times safely)
- Always test migrations in a development environment first
- Keep migrations small and focused
- Document breaking changes clearly
- Never edit migration files after they've been run in production

## 🔗 Links

- [Supabase Dashboard](https://supabase.com/dashboard/project/zbppznuwwcjdbdbkexyq)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
