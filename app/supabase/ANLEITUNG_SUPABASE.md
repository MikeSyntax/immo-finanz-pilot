# Supabase einrichten (ca. 5 Minuten, einmalig)

1. **SQL ausführen:** Supabase → dein Projekt → links „SQL Editor“ → „New query“ → Inhalt von `01_einrichtung.sql` einfügen → „Run“. Erwartet: „Success. No rows returned“.
2. **Anonyme Anmeldung einschalten:** links „Authentication“ → „Sign In / Providers“ (bzw. „Providers“) → **„Allow anonymous sign-ins“** einschalten → Speichern.
   Damit erhält jedes Gerät eine pseudonyme Kennung ohne Namen und ohne Login-Maske; der Zugriffsschutz sorgt dafür, dass jede Kennung nur ihre eigenen Objekte sieht.
3. **Empfohlen (Missbrauchsschutz):** „Authentication“ → „Rate Limits“: Anmeldungen pro Stunde niedrig lassen (Standard reicht für Tests).
4. **Prüfen:** App öffnen → „Mehr“ → „Meine Daten“ → **„Verbindung prüfen“**. Erwartet: drei grüne Haken.

## Was gespeichert wird
Nur Objekt- und Finanzierungsdaten (Adresse/Ort, Kaufpreis, Exposé-Angaben, Finanzierung, Unterlagen-Stand, Ampel-Status).
Nie: Einkommen, Haushalt, Profil, Alter, Fotos, Exposé-Volltext. Die Datenbank lehnt Datensätze mit solchen Bereichen zusätzlich ab.

## Schlüssel
- In der App steht nur der **öffentliche „publishable key“** (`sb_publishable_…`). Er darf öffentlich sein; der Schutz kommt aus den Regeln in Schritt 1.
- Den **„secret key“ / „service_role key“ niemals** in die App, ins Repo oder in den Chat geben.

## Löschen
„Meine Daten“ → „Alle Daten löschen“ löscht lokal **und** in Supabase (pseudonyme Kennung samt Objekten).

## Löschfrist (seit 25.11.2026)
`02_loeschfrist.sql` einmalig im SQL Editor ausführen: Objekte werden **6 Monate nach der letzten Änderung** automatisch gelöscht, Kennungen ohne Objekte 6 Monate nach der letzten Anmeldung (täglicher Lauf über pg_cron, 03:15 UTC). Prüfen: `select jobname, schedule, active from cron.job;`
