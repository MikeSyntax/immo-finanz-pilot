# Immo Finanz Pilot – Prototyp (Stand 24.11.2026, Phase 3 begonnen)

## Starten (lokal, ohne Installation)
1. Ordner `immo-finanz-pilot/app/` öffnen.
2. `index.html` doppelklicken – die App öffnet sich im Browser (Chrome, Safari, Edge, Firefox).
3. Rechentest: `test.html` doppelklicken. Oben muss „✓ Alle … Prüfungen bestanden“ stehen.

## Online (erst nach deiner Entscheidung)
Wenn du in GitHub Desktop „Commit to main“ und „Push origin“ klickst, ist die App unter
`https://mikesyntax.github.io/immo-finanz-pilot/app/` erreichbar. Die Startseite des Repos bleibt der Platzhalter.

## Testablauf (ca. 5 Minuten)
0. **Einmalig: Supabase einrichten** – siehe `supabase/ANLEITUNG_SUPABASE.md`, danach „Mehr“ → „Meine Daten“ → „Verbindung prüfen“.
1. Einführung überspringen → „Mit Beispiel-Exposé testen“ → „Auslesen“.
   *Alternativ wie ein echter Nutzer:* „Eigenes Exposé“ → zustimmen → `daten/Beispiel-Expose_Leipzig_FIKTIV.pdf` hochladen → der Text wird auf deinem Gerät gelesen → „Auslesen“.
2. Prüfmaske: „Werte bestätigen“ ist gesperrt. Kaufpreis antippen → 139.000 € wählen → „Wert übernehmen“.
3. Ort/Bundesland antippen → „Übernehmen“.
4. „davon nicht umlagefähig“ antippen → „73,00 € als Annahme übernehmen“.
5. „Werte bestätigen“ → Lücken-Check → Finanzierung → Auswertung.
6. Erwartet: Rate 601,21 €, Cashflow −218,51 €, DSCR 0,65 grau (Annahme), Beleihungsauslauf 105,3 % kritisch, Gesamt „unvollständig“.

## Was in diesem Stand funktioniert / noch fehlt
- ✅ Alle Screens und Navigation, Prüfmaske mit Sperre, Lücken-Check, Finanzierung mit Rechenwegen, Auswertung mit Ampeln, So rechnet die Bank, 10-Jahres-Entwicklung, Marktvergleich Leipzig, Unterlagen A–E, Einstellungen, Haushalt (lokal), Transparenz, Export/Löschen, Rechenkern nach 03 v0.3 mit automatischem Test.
- ✅ Neu (Phase 3): PDF wird lokal in Text umgewandelt (pdf.js), Text vor dem Senden bearbeitbar, Fehler (kein PDF, Scan, zu groß, Passwort) verständlich; jede Fundstelle wird lokal gegen den Exposé-Text geprüft; „Meine Objekte“ über Supabase mit anonymer Anmeldung, Verbindungstest, Löschen auch in Supabase.
- ⏳ PDF-Erstellung (Phase 5) · Live-KI über Make (Woche 10) · Dark-Mode-Ausarbeitung · weitere Screens im Feinschliff.
- Demo-Modus: Die KI-Antwort für das Beispiel-Exposé ist vorbereitet und als „Demo“ gekennzeichnet. Es werden keine Daten gesendet.

## Dateien
| Datei | Inhalt |
|---|---|
| `index.html` | App-Rahmen |
| `css/app.css` | Gestaltung (helles Logo-Schema, Farben als Variablen) |
| `js/parameter.js` | alle Standardannahmen, Schwellen, Grunderwerbsteuer, Leipzig-Referenzen |
| `js/rechner.js` | Rechenkern (Formeln 03 v0.3) – die KI rechnet nie |
| `js/tests.js`, `test.html` | automatischer Rechentest T1, T3, Sonderfälle |
| `js/inhalte.js` | Unterlagen-Checkliste A–E, Glossar, Demo-Antwort Beispiel-Exposé |
| `js/zustand.js` | Datenmodell, lokale Speicherung, Export/Löschen |
| `js/app.js` | Bildschirme und Abläufe |
| `js/konfig.js` | Supabase-Adresse und öffentlicher Schlüssel (nie den Secret Key!) |
| `js/speicher.js` | „Meine Objekte“ in Supabase (anonyme Anmeldung), Rückfall lokal |
| `js/expose.js` | PDF-zu-Text auf dem Gerät, Fundstellen-Abgleich |
| `lib/pdfjs/` | PDF-Bibliothek pdf.js 3.11.174 (Apache-2.0), lokal eingebunden |
| `supabase/` | SQL-Einrichtung und Anleitung |
| `daten/` | fiktives Beispiel-Exposé zum Testen |

## PDF-Präsentation (Phase 5)
- Knopf „PDF erstellen“ unter „Präsentation für die Bank“. Das PDF entsteht komplett auf deinem Gerät (Bibliothek jsPDF 2.5.2, MIT-Lizenz, liegt in `lib/jspdf/`), es wird nichts verschickt.
- Bei offenen Punkten heißt die Datei `…_Entwurf.pdf` und jede Seite trägt das Wasserzeichen „ENTWURF“.
