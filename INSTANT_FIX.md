# 🚀 INSTANT FIX - 60 Seconds

## DO THIS RIGHT NOW:

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)

### Step 2: Paste & Run This SQL
Copy the entire code below and paste into SQL Editor:

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

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_select_all" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "testimonials_insert_authenticated" ON public.testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public) VALUES ('testimonials-videos', 'testimonials-videos', true), ('testimonials-thumbnails', 'testimonials-thumbnails', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_testimonials_videos" ON storage.objects FOR SELECT USING (bucket_id = 'testimonials-videos');
CREATE POLICY "public_read_testimonials_thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'testimonials-thumbnails');
```

### Step 3: Click **RUN** (Green Button) ✅

### Step 4: Refresh Your App
- Go back to your app
- Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
- Error will be GONE ✅

---

## ✨ That's It! Done!

The testimonials carousel is now ready:
- ✅ Carousel works
- ✅ No more errors
- ✅ Table created
- ✅ Storage buckets ready

### Next: Add Your First Testimonial

You can now:
1. **Upload video manually** via Supabase Storage
2. **Add testimonial record** via Database Insert
3. **Create admin form** to upload testimonials
4. See carousel on home page with your video!

---

## Still Getting Error?

- Did you click **RUN** in SQL Editor? (Must click green button)
- Did you hard refresh? (Ctrl+Shift+R)
- Stop dev server and restart: `npm run dev`
- Check browser console for new errors

**That's all you need to do!** 🎉
