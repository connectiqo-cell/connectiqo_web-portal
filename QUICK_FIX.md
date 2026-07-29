# Fix: Failed to fetch testimonials - Table Doesn't Exist

## The Problem
The error "Failed to fetch testimonials: {}" means the `testimonials` table doesn't exist in your Supabase database yet.

## The Solution

### ✅ OPTION 1: Apply Migration (Recommended)

If you have Supabase CLI installed:

```bash
# Navigate to project folder
cd c:\Users\sande\Desktop\website

# Apply the migration
supabase migration up
```

### ✅ OPTION 2: Manual SQL (Fastest)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire SQL from:
   ```
   supabase/migrations/20260729000000_create_testimonials_table.sql
   ```
3. Paste into the SQL Editor
4. Click **Run**
5. Refresh your app

### ✅ OPTION 3: Create Table with One Query

Go to Supabase **SQL Editor** and paste:

```sql
-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_title TEXT,
  user_avatar_url TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  rating SMALLINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create public read policy
CREATE POLICY "testimonials_select_all" ON public.testimonials
  FOR SELECT USING (true);

-- Create insert policy for authenticated users
CREATE POLICY "testimonials_insert_authenticated" ON public.testimonials
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('testimonials-videos', 'testimonials-videos', true),
  ('testimonials-thumbnails', 'testimonials-thumbnails', true)
ON CONFLICT (id) DO NOTHING;
```

Then click **Run** ✅

---

## After Applying the Migration

1. **Refresh your browser** (Ctrl+R or Cmd+R)
2. The error should be gone ✅
3. The testimonials carousel will appear (once you add testimonials)

---

## Verify It Worked

Check in Supabase Dashboard:
1. Go to **Database** → **Tables**
2. Look for `testimonials` table
3. Should show 0 rows initially

---

## Next Steps

1. **Add testimonials** using:
   - Admin upload form (create: `src/app/admin/testimonials/page.tsx`)
   - Or manual SQL insert
   - Or the upload script: `scripts/upload-testimonial.mjs`

2. **Refresh app** and you'll see the carousel!

---

## Troubleshooting

**Still seeing error after running migration?**
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Stop dev server and restart: `npm run dev`

**Migration already exists?**
- You might have run it twice
- That's okay - `CREATE TABLE IF NOT EXISTS` will skip it
- No data loss

**Can't find SQL Editor?**
- Supabase Dashboard → Your Project → SQL Editor (left sidebar)

---

**Done! The testimonials feature is now ready to use.** 🎉
