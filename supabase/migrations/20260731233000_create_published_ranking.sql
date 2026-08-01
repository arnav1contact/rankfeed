create or replace function public.create_published_ranking(
  p_format public.ranking_format,
  p_title text,
  p_topic text,
  p_items text[],
  p_caption text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_post_id uuid;
  clean_items text[];
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  clean_items := array(
    select btrim(item)
    from unnest(p_items) with ordinality as supplied(item, position)
    where char_length(btrim(item)) between 1 and 100
    order by position
    limit 24
  );

  if coalesce(array_length(clean_items, 1), 0) = 0 then
    raise exception 'At least one ranking item is required';
  end if;

  insert into public.posts (creator_id, format, title, topic, caption, status, published_at)
  values ((select auth.uid()), p_format, btrim(p_title), btrim(p_topic), p_caption, 'published', timezone('utc', now()))
  returning id into new_post_id;

  insert into public.post_items (post_id, label, source_position, result_position)
  select
    new_post_id,
    item,
    (position - 1)::smallint,
    case when p_format = 'completed-result' then position::smallint else null end
  from unnest(clean_items) with ordinality as normalized(item, position);

  return new_post_id;
end;
$$;

revoke all on function public.create_published_ranking(public.ranking_format, text, text, text[], text) from public;
grant execute on function public.create_published_ranking(public.ranking_format, text, text, text[], text) to authenticated;
