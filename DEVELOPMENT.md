# Development Documentation

## Project Overview

This is a hostel management system for Central University, built with React, TypeScript, Vite, Tailwind CSS, and Supabase for backend services.

## Technology Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage)
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Main navigation header
│   ├── HostelCard.tsx  # Hostel display card
│   ├── HostelFilters.tsx
│   ├── AddHostelModal.tsx
│   ├── EditHostelModal.tsx
│   └── HostelDetailsModal.tsx
├── pages/              # Route pages
│   ├── Index.tsx       # Public hostel listing page
│   ├── AdminLogin.tsx  # Admin authentication page
│   ├── AdminDashboard.tsx # Admin management interface
│   └── NotFound.tsx    # 404 page
├── integrations/
│   └── supabase/       # Supabase client and types
│       ├── client.ts   # Supabase client instance
│       └── types.ts    # Auto-generated database types
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── data/               # Mock data (legacy)

supabase/
├── config.toml         # Supabase configuration
└── migrations/         # Database migrations
```

## Database Schema

### Tables

#### `hostels`
Stores hostel information and metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | text | No | - | Hostel name |
| description | text | No | - | Hostel description |
| location | text | No | - | General location |
| address | text | No | - | Full address |
| google_maps_link | text | Yes | - | Google Maps URL |
| manager_name | text | No | - | Manager's full name |
| manager_email | text | No | - | Manager's email |
| manager_phone | text | No | - | Manager's phone |
| total_rooms | integer | No | 0 | Total number of rooms |
| available_rooms | integer | No | 0 | Currently available rooms |
| starting_price | integer | No | - | Lowest price point |
| images | text[] | Yes | {} | Array of image URLs |
| created_at | timestamp | No | now() | Creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |

**RLS Policies:**
- `SELECT`: Anyone can view hostels
- `INSERT/UPDATE/DELETE`: Only admins (requires admin role)

#### `room_types`
Stores different room configurations for each hostel.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| hostel_id | uuid | No | - | Foreign key to hostels |
| type | text | No | - | Room type (1-in-a-room, etc.) |
| price_per_student | integer | No | - | Price per student |
| available_rooms | integer | No | 0 | Available rooms of this type |
| created_at | timestamp | No | now() | Creation timestamp |

**RLS Policies:**
- `SELECT`: Anyone can view room types
- `INSERT/UPDATE/DELETE`: Only admins

#### `user_roles`
Stores user role assignments for authorization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Reference to auth.users |
| role | app_role | No | - | User role (admin/moderator/user) |
| created_at | timestamp | No | now() | Creation timestamp |

**RLS Policies:**
- `SELECT/INSERT/DELETE`: Only admins
- Unique constraint on (user_id, role)

#### `profiles`
Stores additional user profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | Primary key (references auth.users) |
| email | text | No | - | User email |
| full_name | text | Yes | - | User's full name |
| created_at | timestamp | No | now() | Creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |

**RLS Policies:**
- `SELECT/UPDATE`: Users can only access their own profile

### Database Functions

#### `has_role(user_id uuid, role app_role)`
Security definer function to check if a user has a specific role.
Used in RLS policies to prevent recursive security checks.

### Enums

#### `app_role`
- `admin`: Full system access
- `moderator`: Limited administrative access
- `user`: Regular user access

## Authentication & Authorization

### Authentication Flow

1. **User Login** (AdminLogin.tsx):
   - User submits email and password
   - `supabase.auth.signInWithPassword()` authenticates the user
   - On success, checks `user_roles` table for 'admin' role
   - If not admin, signs user out immediately
   - If admin, redirects to `/admin/dashboard`

2. **Session Persistence**:
   - Supabase client configured with `localStorage` persistence
   - Auto-refresh token enabled
   - Sessions persist across browser refreshes

3. **Protected Routes**:
   - AdminDashboard checks for valid session on mount
   - Checks for admin role via `user_roles` table
   - Redirects to `/admin` if not authenticated or not admin

### Security Best Practices

- ✅ Role-based access control using separate `user_roles` table
- ✅ Row-Level Security (RLS) enabled on all tables
- ✅ Security definer function to prevent RLS recursion
- ✅ Server-side role verification (not client-side)
- ✅ Automatic sign-out if unauthorized
- ❌ Never store roles in localStorage or sessionStorage
- ❌ Never use hardcoded credentials in production

## Setting Up Development Environment

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   
   Create a `.env` file (already configured in this project):
   ```
   VITE_SUPABASE_URL=https://coruxfhqovudriizlemc.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Public site: http://localhost:5173
   - Admin login: http://localhost:5173/admin

## Creating Your First Admin User

**IMPORTANT**: Before you can log in to the admin dashboard, you must create an admin user.

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to [Supabase Users](https://supabase.com/dashboard/project/coruxfhqovudriizlemc/auth/users)
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Click "Create user"
5. Copy the user ID from the users table
6. Go to [SQL Editor](https://supabase.com/dashboard/project/coruxfhqovudriizlemc/sql/new)
7. Run this SQL:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('paste-user-id-here', 'admin');
   ```

### Method 2: Via SQL (All at once)

You can create both the user and role in one SQL script, but you'll need to know the user ID that Supabase will generate. It's easier to use Method 1.

## Admin Dashboard Features

### Dashboard Statistics
- Total hostels count
- Total rooms across all hostels
- Available rooms count
- Occupancy rate calculation

### Hostel Management
- **View**: See all hostel details including room types and pricing
- **Add**: Create new hostel with multiple room types
- **Edit**: Update hostel information and room configurations
- **Delete**: Remove hostels (with confirmation dialog)

### Data Validation
- Form validation using React Hook Form + Zod
- Required fields enforcement
- Email and phone format validation
- Numeric validation for prices and room counts

## API Integration (Supabase)

### Supabase Client

Import the client:
```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Common Operations

#### Fetching Hostels
```typescript
const { data: hostels, error } = await supabase
  .from('hostels')
  .select('*')
  .order('created_at', { ascending: false });
```

#### Fetching with Relationships
```typescript
const { data, error } = await supabase
  .from('hostels')
  .select(`
    *,
    room_types (*)
  `);
```

#### Creating a Hostel
```typescript
const { data, error } = await supabase
  .from('hostels')
  .insert({
    name: 'New Hostel',
    description: 'Description',
    location: 'Location',
    // ... other fields
  })
  .select()
  .single();
```

#### Updating a Hostel
```typescript
const { error } = await supabase
  .from('hostels')
  .update({ name: 'Updated Name' })
  .eq('id', hostelId);
```

#### Deleting a Hostel
```typescript
const { error } = await supabase
  .from('hostels')
  .delete()
  .eq('id', hostelId);
```

#### Authentication
```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await supabase.auth.signOut();

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Check role
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .eq('role', 'admin')
  .single();
```

## Database Migrations

Migrations are stored in `supabase/migrations/` and are automatically applied when changes are made.

### Creating a Migration

Database changes should be made through Lovable's migration tool or manually via the Supabase dashboard SQL editor.

### Migration Best Practices

1. Always enable RLS on new tables
2. Create appropriate RLS policies
3. Use security definer functions for role checks
4. Add indexes for frequently queried columns
5. Use triggers for automatic timestamp updates

## Styling Guidelines

### Design System

The project uses a semantic token system defined in `src/index.css` and `tailwind.config.ts`.

**DO:**
- ✅ Use semantic tokens: `bg-background`, `text-foreground`, `border-border`
- ✅ Use design system colors: `bg-primary`, `text-primary`
- ✅ Follow shadcn/ui component patterns

**DON'T:**
- ❌ Use direct colors: `text-white`, `bg-black`, `text-blue-500`
- ❌ Create custom styles outside the design system

### Responsive Design

All components should be mobile-responsive:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## Testing

### Manual Testing Checklist

#### Public Site (/)
- [ ] Hostels display correctly
- [ ] Filters work (location, price, rooms)
- [ ] Hostel cards show correct information
- [ ] Details modal opens with full information
- [ ] Images display properly
- [ ] Responsive on mobile/tablet/desktop

#### Admin Login (/admin)
- [ ] Login form validation works
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows error message
- [ ] Already logged-in users auto-redirect
- [ ] Admin role verification works
- [ ] Non-admin users are rejected

#### Admin Dashboard (/admin/dashboard)
- [ ] Statistics display correctly
- [ ] Hostel list shows all hostels
- [ ] Add hostel modal works
- [ ] Edit hostel modal works
- [ ] Delete confirmation works
- [ ] Logout works
- [ ] Unauthorized users are redirected

## Deployment

### Deploying via Lovable

1. Click "Publish" in the top right of the Lovable editor
2. Your app will be deployed to a Lovable subdomain
3. Optional: Connect a custom domain in Project Settings

### Environment Variables

Ensure these are set in your deployment environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These are already configured in the `.env` file for this project.

## Troubleshooting

### "Invalid login credentials" Error

**Cause**: No user exists with the provided credentials, or user exists but doesn't have admin role.

**Solution**: 
1. Verify user exists in Supabase Auth
2. Check `user_roles` table has entry for this user with 'admin' role
3. See "Creating Your First Admin User" section

### "Unauthorized: Admin access required"

**Cause**: User exists and can log in, but doesn't have admin role in `user_roles` table.

**Solution**: Add admin role via SQL:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

### Hostels Not Displaying

**Cause**: Database is empty or RLS policies are blocking access.

**Solution**: 
1. Check Supabase table has data
2. Verify RLS policies allow public SELECT on hostels table
3. Check browser console for errors

### Session Not Persisting

**Cause**: Browser blocking localStorage or cookies.

**Solution**: 
1. Check browser privacy settings
2. Ensure localStorage is enabled
3. Try incognito mode to test

## Code Quality Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` type unless absolutely necessary
- Use type imports: `import type { Type } from './types'`

### React Best Practices

- Use functional components
- Implement proper error boundaries
- Clean up effects with return functions
- Memoize expensive computations
- Use proper key props in lists

### Git Workflow

- Create feature branches from main
- Write descriptive commit messages
- Keep commits focused and atomic
- Test before pushing

## Future Enhancements

Potential features to implement:

1. **Student Portal**: Allow students to browse and book rooms
2. **Booking System**: Room reservation and payment processing
3. **Email Notifications**: Automated emails for bookings
4. **Advanced Search**: Full-text search, map view
5. **Reviews & Ratings**: Student feedback system
6. **Analytics Dashboard**: Booking trends, occupancy reports
7. **Multi-language Support**: Internationalization
8. **Mobile App**: React Native version

## Support & Resources

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## License

[Add your license information here]
