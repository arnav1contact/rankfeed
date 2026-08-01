create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind)
  values (new.followed_id, new.follower_id, 'follow');
  return new;
end;
$$;

create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient_id uuid;
begin
  select creator_id into v_recipient_id from public.posts where id = new.post_id;
  if v_recipient_id is not null and v_recipient_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, kind, post_id)
    values (v_recipient_id, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient_id uuid;
begin
  select creator_id into v_recipient_id from public.posts where id = new.post_id;
  if v_recipient_id is not null and v_recipient_id <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, kind, post_id, comment_id)
    values (v_recipient_id, new.author_id, 'comment', new.post_id, new.id);
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_ranking_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient_id uuid;
begin
  if new.completed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.completed_at is not null then
    return new;
  end if;
  select creator_id into v_recipient_id from public.posts where id = new.post_id;
  if v_recipient_id is not null and v_recipient_id <> new.player_id then
    insert into public.notifications (recipient_id, actor_id, kind, post_id)
    values (v_recipient_id, new.player_id, 'ranking-complete', new.post_id);
  end if;
  return new;
end;
$$;

create trigger follows_create_notification
  after insert on public.follows
  for each row execute function public.notify_on_follow();

create trigger likes_create_notification
  after insert on public.likes
  for each row execute function public.notify_on_like();

create trigger comments_create_notification
  after insert on public.comments
  for each row execute function public.notify_on_comment();

create trigger sessions_insert_notification
  after insert on public.ranking_sessions
  for each row execute function public.notify_on_ranking_completion();

create trigger sessions_complete_notification
  after update of completed_at on public.ranking_sessions
  for each row execute function public.notify_on_ranking_completion();

drop index if exists public.notifications_recipient_idx;
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc, id desc);
create index notifications_unread_recipient_idx on public.notifications (recipient_id) where read_at is null;

revoke insert, delete on public.notifications from anon, authenticated;
revoke update on public.notifications from authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on function public.notify_on_follow() from public;
revoke all on function public.notify_on_like() from public;
revoke all on function public.notify_on_comment() from public;
revoke all on function public.notify_on_ranking_completion() from public;
