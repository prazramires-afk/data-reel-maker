# Creator Platform — Phased Plan

This is too large to ship in one pass without it breaking. I'd like to confirm scope and split it into 3 phases so each one lands solid.

## Phase 1 — Foundation (recommended to ship first)

**Database**
- `profiles` table: `id` (FK auth.users), `username` (unique, lowercase, 3–24 chars), `display_name`, `bio`, `avatar_url`, `website_url`, `twitter_url`, `youtube_url`, `tiktok_url`, timestamps. RLS: anyone can read, owner can update, trigger auto-creates row on signup.
- Extend `projects`: `description`, `thumbnail_url`, `view_count`, `like_count`, `share_count`, `download_count`, `allow_remix`, `allow_download`, `allow_embed`. View counts updated via RPC.
- `project_events` table (view/like/share/download) for analytics, with daily rollup query.
- Storage bucket `avatars` (public read, owner write).

**Routes / UI**
- `/u/:username` — public creator profile (avatar, name, bio, social links, stats, grid of public videos). Full SEO meta + ProfilePage JSON-LD.
- `/dashboard` — shell with sidebar (Overview, My Videos, Drafts, Published, Analytics, Profile, Account).
- `/dashboard/profile` — edit avatar, display name, username, bio, social URLs with live preview.
- Onboarding: prompt for username on first login if missing.

## Phase 2 — Video management

- Dashboard pages: Overview cards, My Videos (all), Drafts (not yet published), Published (public only).
- Per-video actions: Edit, Duplicate, Download, Publish/Unpublish, Delete (with confirm dialog).
- Edit metadata modal: title, description, thumbnail upload, visibility toggles (public/private, allow remix/download/embed).
- Wire delete to cascade: removes from `/community`, profile, and public URL.
- Auto-generate thumbnail from first canvas frame on export if user doesn't upload one.

## Phase 3 — Analytics + Account

- Track events client-side → `project_events` insert (anonymous + authed).
- Analytics page: daily/weekly/monthly chart (recharts), top videos table, traffic sources from `referrer`.
- Account settings: change email (Supabase `updateUser`), change password, export data (JSON download of profile + projects), delete account (RPC that deletes profile, projects, events).
- "Follow Creator" UI stub (button only, no backend) marked future-ready.

## Out of scope (would need separate asks)

- Real follow/notification system (DB + feeds)
- Remix flow (cloning another user's project as a starting point)
- Embed iframe + embed code generator
- Comment system, likes from non-authed users
- Push notifications, email digests

## Questions before I start

1. **Username collisions**: anyone whose email is already in `auth.users` won't have a username yet. OK to force a one-time "pick a username" modal on next login?
2. **Existing community videos** were published without a username/profile. OK to auto-derive a username from email (e.g. `user_a3f2`) so existing `/community/...` links keep an author?
3. **Phase 1 only now**, then we ship 2 and 3 in follow-ups? Or do you want all three back-to-back (longer single change, higher risk)?
4. **Analytics**: track view events from any visitor (anonymous OK) or only logged-in viewers? Anonymous gives realistic numbers but means anyone can inflate counts — usually fine for a creator product.

Reply with answers and I'll start Phase 1 (DB migration + `/u/:username` + dashboard shell + profile editor).
