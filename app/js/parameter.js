/* Immo Finanz Pilot – Parameter, Standardannahmen, Schwellen, Referenzwerte
   Einzige Quelle aller Standardwerte (C1). Grundlage: 03_Formel-Spezifikation v0.3 (freigegeben 24.11.2026).
   Werte mit "einstellbar: true" kann der Nutzer unter "Bank-Annahmen" ändern (US-09). */
window.IFP = window.IFP || {};

IFP.VERSION = "0.5.1 (Datenschutz)";
IFP.SPEZ = "03 v0.4";

/* Bank-Annahmen (🔧). Prozentwerte als Dezimalzahl (0.02 = 2 %). */
IFP.ANNAHMEN_STANDARD = {
  NOT: { wert: 0.02, label: "Notar und Grundbuch", einheit: "%", erklaerung: "Kosten für Notar und Grundbucheintrag in Prozent vom Kaufpreis. Üblich 1,5–2,0 %." },
  MAW: { wert: 0.02, label: "Mietausfallwagnis", einheit: "%", erklaerung: "Pauschaler Abzug von der Kaltmiete für mögliche Leerstände oder Zahlungsausfälle." },
  SA:  { wert: 0.15, label: "Sicherheitsabschlag Beleihungswert", einheit: "%", erklaerung: "Die Bank setzt den Wert der Wohnung vorsichtiger an als den Kaufpreis. Üblich 10–20 %." },
  MA:  { wert: 0.70, label: "Anrechnung der Miete im Haushalt", einheit: "%", erklaerung: "Welcher Anteil der Kaltmiete in der Haushaltsrechnung als Einnahme zählt. Banken setzen meist 60–80 % an." },
  LHP1:{ wert: 1000, label: "Lebenshaltung 1. Erwachsener", einheit: "€", erklaerung: "Pauschale für Lebenshaltungskosten der ersten erwachsenen Person pro Monat (Modellannahme, bitte mit deiner Bank abgleichen)." },
  LHP2:{ wert: 400, label: "Lebenshaltung je weiterer Erwachsener", einheit: "€", erklaerung: "Pauschale je weiterer erwachsener Person pro Monat (Modellannahme)." },
  LHPK:{ wert: 300, label: "Lebenshaltung je Kind", einheit: "€", erklaerung: "Pauschale je Kind pro Monat (Modellannahme)." },
  WS:  { wert: 0.015, label: "Wertsteigerung pro Jahr (Prognose)", einheit: "%", erklaerung: "Angenommene jährliche Wertentwicklung der Wohnung. Eine Prognose, keine gesicherte Tatsache." },
  MS:  { wert: 0.015, label: "Mietsteigerung pro Jahr (Prognose)", einheit: "%", erklaerung: "Angenommene jährliche Mietsteigerung für die 10-Jahres-Entwicklung. Eine Prognose." },
  ZR:  { wert: 0.05, label: "Zielrendite (Bruttomietrendite)", einheit: "%", erklaerung: "Rendite, die du mindestens erreichen willst. Daraus rechnet die App die nötige Miete und den maximalen Kaufpreis zurück." },
  ZUSCHLAG_ANSCHLUSS: { wert: 0.02, label: "Zinsaufschlag Anschlussfinanzierung (Stresstest)", einheit: "%", erklaerung: "Um wie viele Prozentpunkte der Zins nach der Zinsbindung steigen könnte." },
  AF_EINFACH: { wert: 0.9, label: "Ausstattungsfaktor einfach", einheit: "x", erklaerung: "Modellannahme für die zweite Sicht auf den Beleihungswert. Keine Bankvorgabe." },
  AF_MITTEL:  { wert: 1.0, label: "Ausstattungsfaktor mittel", einheit: "x", erklaerung: "Modellannahme für die zweite Sicht auf den Beleihungswert. Keine Bankvorgabe." },
  AF_GUT:     { wert: 1.1, label: "Ausstattungsfaktor gut", einheit: "x", erklaerung: "Modellannahme für die zweite Sicht auf den Beleihungswert. Keine Bankvorgabe." }
};

/* Grunderwerbsteuer je Bundesland – Stand der Recherche 24.11.2026 (03 v0.3, Abschnitt 1a) */
IFP.GREST = {
  quelle: "Übersicht finanz-tools.de (Stand 2026), abgeglichen mit Dr. Klein (Stand Januar 2026)",
  stand: "24.11.2026",
  laender: [
    ["Baden-Württemberg", 0.050], ["Bayern", 0.035], ["Berlin", 0.060], ["Brandenburg", 0.065],
    ["Bremen", 0.055], ["Hamburg", 0.055], ["Hessen", 0.060], ["Mecklenburg-Vorpommern", 0.060],
    ["Niedersachsen", 0.050], ["Nordrhein-Westfalen", 0.065], ["Rheinland-Pfalz", 0.050], ["Saarland", 0.065],
    ["Sachsen", 0.055], ["Sachsen-Anhalt", 0.050], ["Schleswig-Holstein", 0.065], ["Thüringen", 0.050]
  ]
};

/* Ampel-Schwellen (03 Abschnitt 3). richtung "hoch" = höher ist besser, "tief" = niedriger ist besser.
   gruen/gelb sind die Grenzen; der Grenzwert gehört zur besseren Farbe. */
IFP.SCHWELLEN_STANDARD = {
  LTV_BANK: { label: "Beleihungsauslauf", richtung: "tief", gruen: 0.80, gelb: 1.00, einheit: "%", art: "pflicht" },
  DSCR:     { label: "DSCR (Schuldendienstdeckungsgrad)", richtung: "hoch", gruen: 1.20, gelb: 1.00, einheit: "x", art: "pflicht" },
  EK_KNK:   { label: "Eigenkapital ≥ Nebenkosten", richtung: "ja", art: "pflicht" },
  BMR:      { label: "Bruttomietrendite", richtung: "hoch", gruen: 0.05, gelb: 0.035, einheit: "%", art: "pflicht" },
  CF:       { label: "Cashflow vor Steuern", richtung: "hoch", gruen: 0, gelb: -150, einheit: "€", art: "pflicht" },
  KPF:      { label: "Kaufpreisfaktor", richtung: "tief", gruen: 20, gelb: 25, einheit: "x", art: "pflicht" },
  HUE:      { label: "Haushaltsüberschuss", richtung: "hoch", gruenAnteilNE: 0.10, gelb: 0, einheit: "€", art: "freiwillig" },
  RS_RENTE: { label: "Restschuld bei Rente", richtung: "tief", gruen: 0, gelbAnteilD: 0.30, einheit: "€", art: "freiwillig" },
  KP_REF:   { label: "Kaufpreis/m² vs. Referenz", richtung: "tief", gruen: 0, gelb: 0.10, einheit: "%", art: "freiwillig" },
  MIETE_REF:{ label: "Nötige Miete/m² vs. ortsübliche Miete", richtung: "tief", gruen: 0, gelb: 0.10, einheit: "%", art: "freiwillig" }
};

/* Referenzwerte Marktvergleich (03 Abschnitt 1b, Entscheidung F2) */
IFP.REFERENZEN = {
  Leipzig: {
    kaufpreisM2: { wert: 2850, text: "Eigentumswohnung, sanierter Altbau, Wiederverkauf, ohne Stellplatz",
      quelle: "Grundstücksmarktbericht Leipzig 2026 (Gutachterausschuss), Tab. 99, Kauffälle 2025",
      stand: "01.01.2026", hinweis: "Wert über zwei übereinstimmende Sekundärquellen ermittelt; Original-Tabelle wird noch geprüft." },
    mieteM2: { wert: 6.56, text: "Ortsübliche Vergleichsmiete, Durchschnitt aller Wohnungen",
      quelle: "Leipziger Mietspiegel 2025–2027", stand: "gültig ab 01.07.2025",
      hinweis: "Durchschnitt, nicht wohnungsgenau. Genauer Wert: Mietspiegel-Rechner der Stadt Leipzig." },
    angebotsmieteM2: { wert: 9.28, text: "Angebotsmiete bei Neuvermietung (Median)",
      quelle: "Monitoringbericht Wohnen 2025 der Stadt Leipzig", stand: "Stand 2024", hinweis: "Nur Zusatzinformation, keine Ampel." }
  }
};

IFP.PILOTREGIONEN = ["Karlsruhe", "Bruchsal", "Mannheim", "Leipzig"];
