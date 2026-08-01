create or replace function public.complete_ranking_session(
  p_post_id uuid,
  p_ranked_labels text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if coalesce(array_length(p_ranked_labels, 1), 0) < 1 then
    raise exception 'At least one ranked item is required';
  end if;

  if not exists (
    select 1 from public.posts
    where id = p_post_id and status = 'published'
  ) then
    raise exception 'Published ranking not found';
  end if;

  insert into public.ranking_sessions (post_id, player_id)
  values (p_post_id, (select auth.uid()))
  returning id into v_session_id;

  insert into public.ranking_placements (session_id, post_item_id, rank)
  with requested as (
    select
      ranked.label,
      ranked.rank,
      row_number() over (partition by ranked.label order by ranked.rank) as occurrence
    from unnest(p_ranked_labels) with ordinality as ranked(label, rank)
    where ranked.rank between 1 and 100
  ), available as (
    select
      post_items.id,
      post_items.label,
      row_number() over (partition by post_items.label order by post_items.source_position) as occurrence
    from public.post_items
    where post_items.post_id = p_post_id
  )
  select v_session_id, available.id, requested.rank::smallint
  from requested
  join available using (label, occurrence);

  if not found then
    raise exception 'No ranked items matched this post';
  end if;

  update public.ranking_sessions
  set completed_at = timezone('utc', now())
  where id = v_session_id;

  return v_session_id;
end;
$$;

revoke all on function public.complete_ranking_session(uuid, text[]) from public;
grant execute on function public.complete_ranking_session(uuid, text[]) to authenticated;
