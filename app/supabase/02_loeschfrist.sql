-- Immo Finanz Pilot – automatische Löschfrist (Entscheidung Mike, 25.11.2026)
-- Einmalig im Supabase SQL Editor ausführen (nach 01_einrichtung.sql).
-- Regel: Objekte werden 6 Monate nach ihrer letzten Änderung gelöscht.
--        Pseudonyme (anonyme) Kennungen ohne Objekte werden 6 Monate nach der letzten Anmeldung gelöscht.
-- Läuft täglich um 03:15 UTC über die Supabase-Erweiterung pg_cron.

-- 1) Erweiterung für zeitgesteuerte Aufgaben einschalten
create extension if not exists pg_cron;

-- 2) Löschfunktion (nur für den Zeitplan, nicht über die Schnittstelle aufrufbar)
create or replace function public.loeschfrist_anwenden() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.objekte
   where geaendert < now() - interval '6 months';

  delete from auth.users u
   where u.is_anonymous = true
     and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '6 months'
     and not exists (select 1 from public.objekte o where o.nutzer = u.id);
end; $$;
revoke all on function public.loeschfrist_anwenden() from public, anon, authenticated;

-- 3) Täglichen Lauf planen (vorhandenen gleichnamigen Plan vorher entfernen)
select cron.unschedule(jobid) from cron.job where jobname = 'ifp-loeschfrist';
select cron.schedule('ifp-loeschfrist', '15 3 * * *', $$select public.loeschfrist_anwenden();$$);

-- Prüfen: select jobname, schedule, active from cron.job where jobname = 'ifp-loeschfrist';
