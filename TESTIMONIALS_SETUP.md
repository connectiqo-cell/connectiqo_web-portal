# Testimonials Feature Setup

This document outlines the testimonials feature that has been added to the Connectiqo platform.

## Overview

A complete testimonials section has been implemented with:
- ✅ Video carousel component for displaying testimonials
- ✅ API for managing testimonials
- ✅ Admin upload component for adding new testimonials
- ✅ Testimonial carousel on the home page (MarketingHome)
- ✅ Database migration file
- ✅ Upload script for seeding testimonials

## Components & Files Created

### 1. **Database & Migrations**
- `supabase/migrations/20260729000000_create_testimonials_table.sql`
  - Creates `testimonials` table with fields: user_name, user_title, user_avatar_url, video_url, thumbnail_url, rating, message, order_index
  - Sets up RLS policies
  - Creates storage buckets: `testimonials-videos` and `testimonials-thumbnails`

### 2. **API Layer**
- `src/lib/api/testimonialApi.ts`
  - `getTestimonials()` - Fetch all testimonials
  - `addTestimonial()` - Add new testimonial to database
  - `uploadVideo()` - Upload video to Supabase storage
  - `uploadThumbnail()` - Upload thumbnail image to Supabase storage

### 3. **UI Components**
- `src/components/home/TestimonialsCarousel.tsx`
  - Displays testimonials in a carousel format
  - Features video player with play button overlay
  - Left sidebar with testimonial list
  - Navigation buttons and dot indicators
  - Rating display (stars)

- `src/components/admin/TestimonialUpload.tsx`
  - Form to add new testimonials
  - File upload inputs for video and thumbnail
  - Fields: user name, title, rating, message
  - Handles video/thumbnail upload to Supabase
  - Adds testimonial record to database

### 4. **Integration**
- Updated `src/app/page.tsx` to fetch testimonials
- Updated `src/components/home/HomeGate.tsx` to pass testimonials prop
- Updated `src/components/home/MarketingHome.tsx` to include TestimonialsCarousel

## Database Schema

```sql
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_title TEXT,
  user_avatar_url TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  rating SMALLINT (1-5),
  message TEXT,
  created_at TIMESTAMP,
  order_index INTEGER
);
```

## Setup Instructions

### Step 1: Apply Database Migration

Run the migration to create the testimonials table:

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply manually via Supabase dashboard
# Copy contents of supabase/migrations/20260729000000_create_testimonials_table.sql
# and run in Supabase SQL Editor
```

### Step 2: Create Storage Buckets

If the migration buckets don't auto-create, manually create in Supabase Storage:
- Bucket name: `testimonials-videos` (Public)
- Bucket name: `testimonials-thumbnails` (Public)

### Step 3: Upload First Testimonial

#### Option A: Using Upload Component (Admin UI)
1. Create an admin page that imports `TestimonialUpload` component
2. Add to a protected admin route
3. Use the form to upload testimonials

#### Option B: Using Upload Script
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export SUPABASE_SERVICE_KEY="your_service_key"

# Run upload script
node scripts/upload-testimonial.mjs
```

#### Option C: Manual Upload via Dashboard
1. Go to Supabase Dashboard
2. Storage → testimonials-videos → Upload video file
3. Database → testimonials → Insert row with:
   - user_name: "Name"
   - user_title: "Title"
   - rating: 5
   - message: "Testimonial text"
   - video_url: "Storage public URL"
   - order_index: 0

## Usage

### Display on Home Page (Already Integrated)
The testimonials carousel automatically displays on the marketing home page when testimonials exist:

```tsx
{testimonials.length > 0 && <TestimonialsCarousel testimonials={testimonials} />}
```

### Add Testimonial Upload to Admin Page
```tsx
import { TestimonialUpload } from "@/components/admin/TestimonialUpload";

export function AdminPage() {
  return (
    <div>
      <TestimonialUpload onSuccess={() => console.log("Added!")} />
    </div>
  );
}
```

### Query Testimonials Programmatically
```tsx
import { testimonialApi } from "@/lib/api/testimonialApi";
import { createClient } from "@/lib/supabase/client";

const client = createClient();
const testimonials = await testimonialApi.getTestimonials(client);
```

## Features

### TestimonialsCarousel Component
- **Video Player**: Embedded video with play button overlay
- **Navigation**: Previous/Next buttons + dot indicators
- **Sidebar List**: Quick access to all testimonials with ratings
- **Star Ratings**: Visual 1-5 star display
- **Responsive**: Works on mobile, tablet, and desktop
- **Theme-aware**: Respects light/dark mode

### Upload Form Features
- **Video Upload**: Drag-drop or click to select video file
- **Thumbnail Upload**: Optional thumbnail image (auto-generated if not provided)
- **User Info**: Name and title fields
- **Rating**: 1-5 star rating selector
- **Message**: Optional testimonial text
- **Validation**: Required field checking
- **Feedback**: Success/error messages

## Styling

All components use existing design tokens:
- Colors: `accent-link`, `text-primary`, `text-secondary`, `surface-panel`
- Spacing: Tailwind utilities matching project conventions
- Theme support: Automatic light/dark mode via CSS variables

## Example Testimonial Data

```json
{
  "user_name": "Sarah Johnson",
  "user_title": "Entrepreneur",
  "user_avatar_url": "https://...",
  "video_url": "https://..../video.mp4",
  "thumbnail_url": "https://..../thumbnail.jpg",
  "rating": 5,
  "message": "Connectiqo has transformed how I mentor. The platform is intuitive and the community is incredible!",
  "order_index": 0
}
```

## Next Steps (Optional Enhancements)

1. **Admin Dashboard**: Create dedicated admin page for managing testimonials
2. **Testimonial Moderation**: Add status field (pending/approved/rejected)
3. **Auto-Thumbnails**: Generate thumbnails from video automatically
4. **Analytics**: Track testimonial views/clicks
5. **Testimonials by Category**: Filter testimonials by mentor category
6. **Edit/Delete**: Allow admins to modify/remove testimonials
7. **Sorting**: Drag-to-reorder testimonials

## Troubleshooting

### Videos not displaying
- Check storage bucket is public
- Verify video_url is correct
- Check browser console for CORS errors

### Upload failing
- Ensure SUPABASE_SERVICE_KEY env var is set
- Check storage bucket permissions
- Verify file size is reasonable

### Testimonials not showing on home page
- Run the migration: `supabase migration up`
- Check database has testimonials records
- Verify getTestimonials() returns data

## File Locations

```
src/
├── app/
│   └── page.tsx (updated)
├── components/
│   ├── admin/
│   │   └── TestimonialUpload.tsx (new)
│   └── home/
│       ├── HomeGate.tsx (updated)
│       ├── MarketingHome.tsx (updated)
│       └── TestimonialsCarousel.tsx (new)
└── lib/
    └── api/
        └── testimonialApi.ts (new)

supabase/
└── migrations/
    └── 20260729000000_create_testimonials_table.sql (new)

scripts/
└── upload-testimonial.mjs (new)
```

## Support

For issues or questions, check:
1. Database RLS policies are correct
2. Storage buckets are public
3. Supabase environment variables are set
4. Video files are valid MP4 format
5. Server/Edge Function logs in Supabase dashboard
