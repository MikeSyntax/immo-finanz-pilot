-- Immo Finanz Pilot – Supabase-Einrichtung (einmalig im SQL Editor ausführen)
-- Stand 24.11.2026 · Speichert NUR Objekt- und Finanzierungsdaten (US-10 AK 4).
-- Keine Einkommens-, Haushalts-, Profil-, Alters- oder Fotodaten, keine Namen Dritter.

-- 1) Tabelle
create table if not exists public.objekte (
  nutzer        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id            text not null,
  titel         text,
  ort           text,
  kaufpreis     numeric,
  gesamt_status text check (gesamt_status in ('gruen','gelb','rot','unvollstaendig')),
  gruen         int,
  bewertet      int,
  daten         jsonb not null,
  erstellt      timestamptz not null default now(),
  geaendert     timestamptz not null default now(),
  primary key (nutzer, id),
  -- Schutz gegen Missbrauch: maximal ca. 200 KB je Objekt
  constraint daten_groesse check (pg_column_size(daten) < 200000),
  -- Schutz gegen versehentlich mitgeschickte lokale Daten
  constraint keine_lokalen_daten check (not (daten ? 'lokal') and not (daten ? 'haushalt') and not (daten ? 'profil') and not (daten ? 'fotos'))
);

-- 2) Zugriffsschutz je Zeile (Row Level Security): jede anonyme Kennung sieht nur ihre eigenen Objekte
alter table public.objekte enable row level security;

drop policy if exists "eigene objekte lesen" on public.objekte;
drop policy if exists "eigene objekte anlegen" on public.objekte;
drop policy if exists "eigene objekte aendern" on public.objekte;
drop policy if exists "eigene objekte loeschen" on public.objekte;

create policy "eigene objekte lesen"   on public.objekte for select to authenticated using (nutzer = (select auth.uid()));
create policy "eigene objekte anlegen" on public.objekte for insert to authenticated with check (nutzer = (select auth.uid()));
create policy "eigene objekte aendern" on public.objekte for update to authenticated using (nutzer = (select auth.uid())) with check (nutzer = (select auth.uid()));
create policy "eigene objekte loeschen" on public.objekte for delete to authenticated using (nutzer = (select auth.uid()));

-- Nicht angemeldete Aufrufe (nur öffentlicher Schlüssel) bekommen keinerlei Zugriff
revoke all on public.objekte from anon;
grant select, insert, update, delete on public.objekte to authenticated;

-- 3) Zeitstempel bei Änderung
create or replace function public.objekte_geaendert() returns trigger language plpgsql set search_path = '' as $$
begin new.geaendert := now(); return new; end; $$;
drop trigger if exists objekte_geaendert on public.objekte;
create trigger objekte_geaendert before update on public.objekte for each row execute function public.objekte_geaendert();

-- 4) "Alle meine Daten löschen": entfernt die anonyme Kennung samt aller Objekte (Kaskade)
create or replace function public.konto_loeschen() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.konto_loeschen() from public, anon;
grant execute on function public.konto_loeschen() to authenticated;
