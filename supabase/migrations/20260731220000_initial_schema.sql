create extension if not exists pgcrypto;

create type public.ranking_format as enum ('blind-ranking', 'bracket', 'completed-result');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.report_target as enum ('post', 'comment', 'profile');
create type public.report_reason as enum ('spam', 'harassment', 'hate', 'sexual-content', 'violence', 'copyright', 'other');
create type public.moderation_status as enum ('pending', 'reviewing', 'actioned', 'dismissed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 50),
  bio text check (char_length(bio) <= 280),
  avatar_path text,
  is_private boolean not null default false,
  is_moderator boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index profiles_handle_unique on public.profiles (lower(handle));

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  format public.ranking_format not null,
  title text not null check (char_length(title) between 3 and 80),
  topic text not null check (char_length(topic) between 2 and 40),
  description text check (char_length(description) <= 280),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 100),
  position smallint not null check (position between 0 and 99),
  created_at timestamptz not null default timezone('utc', now()),
  unique (template_id, position)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  format public.ranking_format not null,
  title text not null check (char_length(title) between 3 and 80),
  topic text not null check (char_length(topic) between 2 and 40),
  caption text check (char_length(caption) <= 500),
  status public.content_status not null default 'draft',
  media_path text,
  thumbnail_path text,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.post_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 100),
  source_position smallint not null check (source_position between 0 and 99),
  result_position smallint check (result_position between 1 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, source_position)
);

create table public.ranking_sessions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ranking_placements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ranking_sessions(id) on delete cascade,
  post_item_id uuid not null references public.post_items(id) on delete cascade,
  rank smallint not null check (rank between 1 and 100),
  round smallint check (round between 1 and 20),
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, post_item_id),
  unique (session_id, rank)
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, post_id)
);

create table public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, post_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reporter_id, target_type, target_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('follow', 'like', 'comment', 'ranking-complete', 'moderation')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index templates_owner_created_idx on public.templates (owner_id, created_at desc);
create index templates_status_created_idx on public.templates (status, created_at desc);
create index template_items_template_idx on public.template_items (template_id, position);
create index posts_feed_idx on public.posts (published_at desc, id) where status = 'published';
create index posts_creator_idx on public.posts (creator_id, created_at desc);
create index post_items_post_idx on public.post_items (post_id, source_position);
create unique index post_items_result_unique on public.post_items (post_id, result_position) where result_position is not null;
create index sessions_player_idx on public.ranking_sessions (player_id, created_at desc);
create index placements_session_idx on public.ranking_placements (session_id, rank);
create index follows_followed_idx on public.follows (followed_id, created_at desc);
create index likes_post_idx on public.likes (post_id, created_at desc);
create index comments_post_idx on public.comments (post_id, created_at desc) where deleted_at is null;
create index reports_status_idx on public.reports (status, created_at);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger templates_updated_at before update on public.templates for each row execute function public.set_updated_at();
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger sessions_updated_at before update on public.ranking_sessions for each row execute function public.set_updated_at();
create trigger comments_updated_at before update on public.comments for each row execute function public.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New creator')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.template_items enable row level security;
alter table public.posts enable row level security;
alter table public.post_items enable row level security;
alter table public.ranking_sessions enable row level security;
alter table public.ranking_placements enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.comments enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users update their profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.profiles from authenticated;
grant update (handle, display_name, bio, avatar_path, is_private) on public.profiles to authenticated;

create policy "published or owned templates are readable" on public.templates for select using (status = 'published' or owner_id = (select auth.uid()));
create policy "users create owned templates" on public.templates for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owners update templates" on public.templates for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owners delete templates" on public.templates for delete to authenticated using (owner_id = (select auth.uid()));

create policy "visible template items are readable" on public.template_items for select using (exists (select 1 from public.templates where templates.id = template_items.template_id and (templates.status = 'published' or templates.owner_id = (select auth.uid()))));
create policy "owners create template items" on public.template_items for insert to authenticated with check (exists (select 1 from public.templates where templates.id = template_items.template_id and templates.owner_id = (select auth.uid())));
create policy "owners update template items" on public.template_items for update to authenticated using (exists (select 1 from public.templates where templates.id = template_items.template_id and templates.owner_id = (select auth.uid())));
create policy "owners delete template items" on public.template_items for delete to authenticated using (exists (select 1 from public.templates where templates.id = template_items.template_id and templates.owner_id = (select auth.uid())));

create policy "published or owned posts are readable" on public.posts for select using ((status = 'published' and not exists (select 1 from public.blocks where blocks.blocker_id = (select auth.uid()) and blocks.blocked_id = posts.creator_id)) or creator_id = (select auth.uid()));
create policy "users create owned posts" on public.posts for insert to authenticated with check (creator_id = (select auth.uid()));
create policy "owners update posts" on public.posts for update to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
create policy "owners delete posts" on public.posts for delete to authenticated using (creator_id = (select auth.uid()));

create policy "visible post items are readable" on public.post_items for select using (exists (select 1 from public.posts where posts.id = post_items.post_id and (posts.status = 'published' or posts.creator_id = (select auth.uid()))));
create policy "owners create post items" on public.post_items for insert to authenticated with check (exists (select 1 from public.posts where posts.id = post_items.post_id and posts.creator_id = (select auth.uid())));
create policy "owners update post items" on public.post_items for update to authenticated using (exists (select 1 from public.posts where posts.id = post_items.post_id and posts.creator_id = (select auth.uid())));
create policy "owners delete post items" on public.post_items for delete to authenticated using (exists (select 1 from public.posts where posts.id = post_items.post_id and posts.creator_id = (select auth.uid())));

create policy "players manage sessions" on public.ranking_sessions for all to authenticated using (player_id = (select auth.uid())) with check (player_id = (select auth.uid()));
create policy "players manage placements" on public.ranking_placements for all to authenticated using (exists (select 1 from public.ranking_sessions where ranking_sessions.id = ranking_placements.session_id and ranking_sessions.player_id = (select auth.uid()))) with check (exists (select 1 from public.ranking_sessions where ranking_sessions.id = ranking_placements.session_id and ranking_sessions.player_id = (select auth.uid())));

create policy "follows are readable" on public.follows for select using (true);
create policy "users create their follows" on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
create policy "users delete their follows" on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

create policy "likes are readable" on public.likes for select using (true);
create policy "users create their likes" on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users delete their likes" on public.likes for delete to authenticated using (user_id = (select auth.uid()));

create policy "users read their saves" on public.saves for select to authenticated using (user_id = (select auth.uid()));
create policy "users create their saves" on public.saves for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users delete their saves" on public.saves for delete to authenticated using (user_id = (select auth.uid()));

create policy "public comments are readable" on public.comments for select using (deleted_at is null and exists (select 1 from public.posts where posts.id = comments.post_id and posts.status = 'published'));
create policy "users create comments" on public.comments for insert to authenticated with check (author_id = (select auth.uid()) and exists (select 1 from public.posts where posts.id = comments.post_id and posts.status = 'published'));
create policy "authors update comments" on public.comments for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "authors delete comments" on public.comments for delete to authenticated using (author_id = (select auth.uid()));

create policy "users read their blocks" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "users create their blocks" on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "users delete their blocks" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create policy "users read their reports" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy "users create reports" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()) and status = 'pending');

create policy "users read their notifications" on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy "users update their notifications" on public.notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
