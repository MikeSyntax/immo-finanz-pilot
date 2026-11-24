/* Immo Finanz Pilot – feste Inhalte: Unterlagen-Checkliste A–E (06 US-11), Glossar (US-04 AK 6, C4),
   Demo-Antwort für das Beispiel-Exposé E3 (Demo-Modus, keine echte KI). */
(function () {
  "use strict";
  var IFP = window.IFP;

  /* Unterlagen-Checkliste A–E – vollständig laut 06 v0.7 */
  IFP.UNTERLAGEN = [
    { gruppe: "A", titel: "Objekt", ki: true, posten: [
      { id: "A1", name: "Exposé", wofuer: "Grunddaten des Objekts", wer: "Makler" },
      { id: "A2", name: "Grundriss", wofuer: "Raumaufteilung, Plausibilität der Fläche", wer: "Makler / Verwaltung" },
      { id: "A3", name: "Wohnflächenberechnung", wofuer: "Die Bank rechnet mit der Wohnfläche, nicht mit der Nutzfläche", wer: "Makler / Verkäufer" },
      { id: "A4", name: "Energieausweis", wofuer: "Energiezustand, gesetzlich vorgeschrieben", wer: "Makler / Verkäufer" },
      { id: "A5", name: "Baujahr und Modernisierungen (Heizung, Fenster, Dach, Fassade)", wofuer: "Restnutzungsdauer und Risiko anstehender Kosten", wer: "Makler / Verwaltung" },
      { id: "A6", name: "Fotos", wofuer: "Zustand für die Bank sichtbar machen", wer: "Makler / ich selbst" } ] },
    { gruppe: "B", titel: "Rechtliches", ki: true, posten: [
      { id: "B1", name: "Aktueller Grundbuchauszug (max. 3 Monate alt)", wofuer: "Eigentum, Lasten, Rechte Dritter", wer: "Grundbuchamt / Notar" },
      { id: "B2", name: "Teilungserklärung mit Aufteilungsplan und Gemeinschaftsordnung", wofuer: "Was genau gekauft wird, Sondernutzungsrechte", wer: "Verwaltung / Grundbuchamt" },
      { id: "B3", name: "Flurkarte / Lageplan", wofuer: "Lage des Grundstücks", wer: "Vermessungsamt / Makler" },
      { id: "B4", optional: true, name: "Auskunft Baulastenverzeichnis (falls nötig)", wofuer: "Öffentlich-rechtliche Lasten", wer: "Bauamt" },
      { id: "B5", optional: true, name: "Erbbaurechtsvertrag (falls Erbbaurecht)", wofuer: "Laufzeit und Erbbauzins beeinflussen den Wert", wer: "Verkäufer / Notar" } ] },
    { gruppe: "C", titel: "WEG & Verwaltung", ki: true, posten: [
      { id: "C1", name: "Hausgeldabrechnungen der letzten 2–3 Jahre", wofuer: "Tatsächliche Kosten", wer: "Verwaltung" },
      { id: "C2", name: "Aufteilung Hausgeld umlagefähig / nicht umlagefähig", wofuer: "Nur der nicht umlagefähige Teil belastet dich – nötig für Cashflow und DSCR", wer: "Verwaltung" },
      { id: "C3", name: "Aktueller Wirtschaftsplan", wofuer: "Geplante Kosten der Gemeinschaft", wer: "Verwaltung" },
      { id: "C4", name: "Protokolle der Eigentümerversammlungen (letzte 3 Jahre)", wofuer: "Beschlüsse, Streit, anstehende Sanierungen", wer: "Verwaltung" },
      { id: "C5", name: "Beschluss-Sammlung", wofuer: "Alle gültigen Beschlüsse", wer: "Verwaltung" },
      { id: "C6", name: "Höhe der Erhaltungsrücklage (gesamt und anteilig)", wofuer: "Puffer für Reparaturen", wer: "Verwaltung" },
      { id: "C7", name: "Beschlossene oder geplante Sonderumlagen", wofuer: "Zusätzliche Kosten nach dem Kauf", wer: "Verwaltung" },
      { id: "C8", name: "Verwalter-Kontakt, ggf. Verwalterzustimmung", wofuer: "Manche Gemeinschaften verlangen eine Zustimmung zum Verkauf", wer: "Verwaltung" } ] },
    { gruppe: "D", titel: "Vermietung", ki: true, posten: [
      { id: "D1", name: "Mietvertrag", wofuer: "Miethöhe, Laufzeit, Sonderregeln", wer: "Verkäufer" },
      { id: "D2", name: "Aktuelle Kaltmiete und letzte Mieterhöhung", wofuer: "Nachhaltig erzielbare Miete", wer: "Verkäufer" },
      { id: "D3", name: "Nebenkostenabrechnung", wofuer: "Umlagen korrekt, keine Nachforderungen", wer: "Verkäufer / Verwaltung" },
      { id: "D4", name: "Kaution", wofuer: "Wird beim Kauf übertragen", wer: "Verkäufer" },
      { id: "D5", name: "Mietrückstände / Mietstreitigkeiten", wofuer: "Risiko für den Cashflow", wer: "Verkäufer" },
      { id: "D6", name: "Kündigungen", wofuer: "Drohender Leerstand", wer: "Verkäufer" } ] },
    { gruppe: "E", titel: "Persönlich (für die Bank)", ki: false, posten: [
      { id: "E1", name: "Selbstauskunft", wofuer: "Formular der Bank zu deinen Finanzen", wer: "ich selbst" },
      { id: "E2", name: "Einkommensnachweise (Gehalt oder BWA/Steuerbescheide)", wofuer: "Tragfähigkeit der Finanzierung", wer: "ich selbst" },
      { id: "E3", name: "Eigenkapitalnachweis", wofuer: "Herkunft des Eigenkapitals", wer: "ich selbst" },
      { id: "E4", name: "Übersicht bestehender Darlehen und Immobilien", wofuer: "Gesamtbelastung", wer: "ich selbst" },
      { id: "E5", name: "Ausweis", wofuer: "Identifikation", wer: "ich selbst" } ] }
  ];

  IFP.GLOSSAR = {
    DSCR: "Schuldendienstdeckungsgrad: Wie oft deckt die Nettomiete (Kaltmiete minus nicht umlagefähiges Hausgeld) die Kreditrate? Unter 1,0 reicht die Miete nicht.",
    Beleihungswert: "Der Wert, den die Bank für die Wohnung ansetzt. Er liegt meist unter dem Kaufpreis (Sicherheitsabschlag).",
    Beleihungsauslauf: "Darlehen geteilt durch Beleihungswert. Über 100 % heißt: Das Darlehen ist höher als der Wert, den die Bank ansetzt.",
    "Markt-LTV": "Darlehen im Verhältnis zum Kaufpreis (Loan-to-Value = Darlehen zu Wert). Wirkt meist günstiger als der Beleihungsauslauf.",
    Kaufpreisfaktor: "Kaufpreis geteilt durch Jahreskaltmiete: Wie viele Jahresmieten kostet die Wohnung?",
    Bruttomietrendite: "Jahreskaltmiete geteilt durch Kaufpreis, ohne Kosten.",
    Nettomietrendite: "Jahreskaltmiete minus nicht umlagefähiges Hausgeld, geteilt durch die Gesamtinvestition inklusive Nebenkosten.",
    Cashflow: "Was nach Kaltmiete, nicht umlagefähigem Hausgeld, Mietausfallwagnis und Kreditrate monatlich übrig bleibt (vor Steuern). Negativ = Zuzahlung.",
    Kaufnebenkosten: "Grunderwerbsteuer, Notar und Grundbuch sowie Maklerprovision.",
    Annuität: "Gleichbleibende Monatsrate aus Zins und Tilgung. Der Zinsanteil sinkt, der Tilgungsanteil steigt.",
    Zinsbindung: "Zeitraum, in dem der Zins fest vereinbart ist. Danach wird neu verhandelt (Anschlussfinanzierung).",
    Restschuld: "Was nach einer bestimmten Zeit vom Darlehen noch offen ist.",
    Haushaltsüberschuss: "Was dir nach allen Einnahmen und Ausgaben inklusive der neuen Finanzierung im Monat übrig bleibt – so prüft die Bank die Tragfähigkeit.",
    "Nicht umlagefähiges Hausgeld": "Teil des Hausgelds, den du als Vermieter selbst trägst (z. B. Verwaltung, Rücklage).",
    Mietausfallwagnis: "Pauschaler Abzug für Leerstand oder ausbleibende Mietzahlungen.",
    "Nötige Miete/m²": "Rückwärtsrechnung: Welche Miete pro m² wäre nötig, damit der Kaufpreis deine Zielrendite erreicht?",
    Eigenkapitalrendite: "Cashflow plus Tilgung im ersten Jahr, geteilt durch dein Eigenkapital (vereinfacht, ohne Wertsteigerung und Steuer)."
  };

  /* Demo-Antwort für E3 – im Demo-Modus anstelle einer echten KI-Antwort. Fundstellen = Originalwortlaut aus dem Beispiel-Exposé. */
  IFP.DEMO_E3 = {
    quelle: "Beispiel-Expose_Leipzig_FIKTIV.pdf",
    adresse: "Beispielweg 12, 04277 Leipzig",
    felder: {
      KP: { kandidaten: [
        { wert: 139000, seite: 1, ort: "Preisübersicht", zitat: "Kaufpreis 139.000 €" },
        { wert: 193000, seite: 2, ort: "Objektdaten im Überblick", zitat: "Kaufpreis 193.000 €" } ],
        unsicher: true, grund: "Im Exposé stehen zwei verschiedene Kaufpreise.", pruefung: "2.380 €/m² × 58,4 m² ≈ 139.000 €" },
      WFL: { wert: 58.4, seite: 2, ort: "Objektdaten", zitat: "Wohnfläche ca. 58,4 m²" },
      KM: { wert: 465, seite: 1, ort: "Die Wohnung", zitat: "Die aktuelle Nettokaltmiete beträgt 465 € im Monat" },
      WM: { wert: null, nichtGefunden: true },
      HG: { wert: 215, seite: 2, ort: "Laufende Kosten", zitat: "Hausgeld gesamt 215 € / Monat" },
      HG_um: { wert: 142, seite: 2, ort: "Laufende Kosten", zitat: "davon umlagefähig 142 € / Monat" },
      HG_nu: { wert: null, nichtGefunden: true, hinweisRechnung: "Nicht ausdrücklich genannt. Rechnerisch 215 € − 142 € = 73 € (darin enthalten: Instandhaltungsrücklage 38 €). Nur als Annahme übernehmen oder bei der Verwaltung erfragen." },
      BJ: { wert: 1912, seite: 2, ort: "Objektdaten", zitat: "Baujahr 1912", zusatz: "Kernsanierung 1997" },
      ORT: { wert: "Leipzig", seite: 1, ort: "Kopf", zitat: "04277 Leipzig" },
      BL: { wert: "Sachsen", abgeleitet: true, grund: "Aus dem Ort Leipzig abgeleitet – bitte bestätigen." },
      MAK: { wert: 0.0357, seite: 1, ort: "Preisübersicht", zitat: "Käuferprovision 3,57 % inkl. MwSt." },
      ZI: { wert: 2, seite: 2, ort: "Objektdaten", zitat: "Zimmer 2" },
      ENERGIE: { wert: "Verbrauchsausweis, 142 kWh/(m²·a)", seite: 2, ort: "Objektdaten", zitat: "Energieausweis Verbrauchsausweis" },
      VERMIETET: { wert: "seit 03/2021", seite: 2, ort: "Objektdaten", zitat: "Vermietet seit 03/2021" }
    },
    unterlagen: { A1: "enthalten", A2: "fehlt", A3: "fehlt", A4: "erwaehnt", A5: "enthalten", A6: "fehlt",
      B1: "fehlt", B2: "fehlt", B3: "fehlt", B4: "fehlt", B5: "fehlt",
      C1: "fehlt", C2: "enthalten", C3: "fehlt", C4: "fehlt", C5: "fehlt", C6: "enthalten", C7: "fehlt", C8: "fehlt",
      D1: "erwaehnt", D2: "enthalten", D3: "fehlt", D4: "fehlt", D5: "fehlt", D6: "fehlt" },
    fundstellenUnterlagen: {
      A1: "Vermietete Altbauwohnung mit Balkon", A4: "Energieausweis Verbrauchsausweis", A5: "Sanierung 1997 (Kernsanierung)",
      C2: "davon umlagefähig 142 € / Monat", C6: "Rücklage der WEG (gesamt) ca. 61.000 €", D1: "seit März 2021 an eine Einzelperson vermietet",
      D2: "Die aktuelle Nettokaltmiete beträgt 465 € im Monat"
    },
    warnungen: [
      { feld: "KP", titel: "Zwei verschiedene Kaufpreise", zitat: "Kaufpreis 139.000 € (Seite 1) · Kaufpreis 193.000 € (Seite 2)",
        erklaerung: "Widersprüchliche Angaben fallen der Bank auf. Kläre vor dem Bankgespräch, welcher Preis gilt." },
      { feld: "HG_nu", titel: "Aufteilung des Hausgelds nur teilweise angegeben", zitat: "davon umlagefähig 142 € / Monat",
        erklaerung: "Der nicht umlagefähige Anteil ist nicht ausdrücklich genannt. Er bestimmt Cashflow und DSCR – bei der Verwaltung erfragen." }
    ]
  };
})();
