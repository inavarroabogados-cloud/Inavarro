begin;
alter table public.portal_documents add column storage_provider text not null default 'supabase';
alter table public.portal_documents add column drive_file_id text;
alter table public.portal_documents add constraint portal_documents_storage_check check (
(storage_provider = 'supabase' and drive_file_id is null) or
(storage_provider = 'google-drive' and drive_file_id ~ '^[A-Za-z0-9_-]+$' and drive_file_id is not null));
create unique index portal_documents_drive_file_id_key on public.portal_documents(drive_file_id) where drive_file_id is not null;
alter policy documents_insert on public.portal_documents with check (
portal_private.ready() and portal_private.acknowledged() and portal_private.case_access(case_id)
and uploaded_by = (select auth.uid()) and (shared = 0 or portal_private.staff())
and storage_provider = 'supabase' and drive_file_id is null and portal_private.object_exists(path));
commit;
