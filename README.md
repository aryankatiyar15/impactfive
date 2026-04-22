# ImpactFive

ImpactFive is a lean full-stack demo for the trainee PRD: members choose a charity, keep their latest five Stableford scores, and enter a simple number draw. Built with Next.js App Router, Supabase Auth + Database, Tailwind CSS, and Vercel-ready environment variables.

## Features

- Email/password signup and login through Supabase.
- User dashboard with profile, subscription status, charity selection, contribution percentage, participation summary, winnings overview, and Stableford score entry.
- Only the latest 5 scores are retained per user; duplicate score dates are blocked; existing score rows can be edited or deleted.
- Admin panel for users, scores, simulation/published draw triggering, and draw history.
- Demo subscription state only. Stripe/payment is intentionally not implemented for this version.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
   ```

3. In Supabase SQL Editor, run:

   ```bash
   supabase/schema.sql
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000`.

## Admin Access

After signing up, promote one user in Supabase SQL Editor:

```sql
update public.users
set is_admin = true
where email = 'admin@example.com';
```

## Vercel Deployment

- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
- Run `supabase/schema.sql` once in the target Supabase project.
- Deploy normally from the repository.
