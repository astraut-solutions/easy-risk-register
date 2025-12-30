-- End-to-end encryption (selected fields): storage layer support.
--
-- Posture:
--   - Client-side encryption only (PBKDF2 -> AES-GCM); server stores ciphertext + metadata.
--   - No server-side recovery: the database never stores plaintext for encrypted fields.
--
-- This migration adds an `encrypted_fields` JSONB column to `public.risks` so the backend can
-- store encrypted payloads without impacting list/search UX (title/category/status remain plaintext).

alter table public.risks
  add column if not exists encrypted_fields jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.risks
    add constraint risks_encrypted_fields_is_object
      check (jsonb_typeof(encrypted_fields) = 'object');
exception
  when duplicate_object then null;
end $$;

-- Optional: query patterns should not depend on encrypted_fields; avoid indexing by default.

-- Rollback (manual):
--   alter table public.risks drop constraint if exists risks_encrypted_fields_is_object;
--   alter table public.risks drop column if exists encrypted_fields;

