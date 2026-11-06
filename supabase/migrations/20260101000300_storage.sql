-- Public-read logo bucket. Uploads happen through the server with the service
-- role after file validation, and these policies additionally restrict direct
-- authenticated uploads to the owner's own business folder.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'business-logos',
      'business-logos',
      true,
      2097152,
      array['image/png', 'image/jpeg', 'image/webp']
    )
    on conflict (id) do update
      set public = true,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;

    execute 'drop policy if exists "business_logos_owner_insert" on storage.objects';
    execute 'create policy "business_logos_owner_insert" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = ''business-logos''
        and exists (
          select 1 from public.businesses b
          where b.id::text = (storage.foldername(name))[1]
            and b.owner_id = auth.uid()
        )
      )';

    execute 'drop policy if exists "business_logos_owner_update" on storage.objects';
    execute 'create policy "business_logos_owner_update" on storage.objects
      for update to authenticated
      using (
        bucket_id = ''business-logos''
        and exists (
          select 1 from public.businesses b
          where b.id::text = (storage.foldername(name))[1]
            and b.owner_id = auth.uid()
        )
      )';

    execute 'drop policy if exists "business_logos_owner_delete" on storage.objects';
    execute 'create policy "business_logos_owner_delete" on storage.objects
      for delete to authenticated
      using (
        bucket_id = ''business-logos''
        and exists (
          select 1 from public.businesses b
          where b.id::text = (storage.foldername(name))[1]
            and b.owner_id = auth.uid()
        )
      )';
  end if;
end;
$$;
