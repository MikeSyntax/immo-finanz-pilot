/* Immo Finanz Pilot – Datenmodell und Speicherung
   Trennung: (1) Objektdaten → dürfen in "Meine Objekte" (später Supabase) · (2) lokale Daten (Haushalt, Profil, Alter) → nur auf diesem Gerät.
   Entwurf wird automatisch lokal gesichert, damit beim Navigieren nichts verloren geht. */
(function () {
  "use strict";
  var IFP = window.IFP;
  var K_ENTWURF = "ifp.entwurf.v1", K_EINST = "ifp.einstellungen.v1", K_LOKAL = "ifp.lokal.v1", K_OBJEKTE = "ifp.objekte.v1";

  function lesen(k, standard) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : standard; } catch (e) { return standard; } }
  function schreiben(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { IFP.speicherFehler = true; return false; } }

  /* Felddefinitionen der Prüfmaske (8 Kernfelder oben, US-02 AK 5) */
  IFP.FELDER = [
    { id: "KP", label: "Kaufpreis", einheit: "€", kern: true, rechnet: true },
    { id: "WFL", label: "Wohnfläche", einheit: "m²", kern: true, rechnet: true, dez: 1 },
    { id: "KM", label: "Kaltmiete", einheit: "€/Monat", kern: true, rechnet: true },
    { id: "HG", label: "Hausgeld gesamt", einheit: "€/Monat", kern: true },
    { id: "HG_nu", label: "davon nicht umlagefähig", einheit: "€/Monat", kern: true, rechnet: true },
    { id: "BJ", label: "Baujahr", einheit: "", kern: true, ganz: true },
    { id: "ORT", label: "Ort / Bundesland", einheit: "", kern: true, text: true },
    { id: "MAK", label: "Maklerprovision (Käufer)", einheit: "%", kern: true, rechnet: true, prozent: true, nullErlaubt: true },
    { id: "WM", label: "Warmmiete", einheit: "€/Monat", kern: false },
    { id: "HG_um", label: "davon umlagefähig", einheit: "€/Monat", kern: false },
    { id: "ZI", label: "Zimmer", einheit: "", kern: false, dez: 1 },
    { id: "ENERGIE", label: "Energieausweis", einheit: "", kern: false, text: true },
    { id: "VERMIETET", label: "Vermietungsstand", einheit: "", kern: false, text: true }
  ];

  function neuesFeld() { return { wert: null, zustand: "leer", herkunft: null, unsicher: false, geklaert: false, kandidaten: null, fundstelle: null, hinweis: null }; }
  function neuesObjekt() {
    var f = {}; IFP.FELDER.forEach(function (d) { f[d.id] = neuesFeld(); });
    return {
      id: "obj-" + Date.now(), quelle: null, adresse: "", ort: "", bundesland: "", felder: f, bestaetigt: false,
      finanzierung: { EK: null, i: null, t: 0.02, ZB: 10, REN: null, BEG: "" },
      ausstattung: "mittel", unterlagen: {}, fundstellenUnterlagen: {}, warnungen: [], kiTexte: {}, angelegt: new Date().toISOString(), geaendert: null
    };
  }

  IFP.zustand = {
    einstellungen: lesen(K_EINST, { theme: "hell", onboardingGesehen: false, kiEinwilligung: null, annahmen: {}, schwellen: {}, demoModus: true }),
    objekt: lesen(K_ENTWURF, null) || neuesObjekt(),
    lokal: lesen(K_LOKAL, { haushalt: { NE: null, BR: null, WK: null, ERW: null, KINDER: null }, alter: { ALT: null, RENT: null }, profil: { aktiv: false, name: "", objekte: "", mieteinnahmen: "", bank: "", notiz: "" } })
  };

  IFP.sichern = function () {
    var z = IFP.zustand; z.objekt.geaendert = new Date().toISOString();
    var ok = schreiben(K_ENTWURF, z.objekt) && schreiben(K_EINST, z.einstellungen) && schreiben(K_LOKAL, z.lokal);
    return ok;
  };
  IFP.neuesObjekt = function () { IFP.zustand.objekt = neuesObjekt(); IFP.sichern(); };

  /* Eingaben für den Rechenkern aus dem Zustand ableiten */
  IFP.eingaben = function () {
    var z = IFP.zustand, o = z.objekt, f = o.felder, fin = o.finanzierung, h = z.lokal.haushalt, al = z.lokal.alter;
    var wert = function (id) { var x = f[id]; return (x && (x.zustand === "wert" || x.zustand === "annahme" || x.zustand === "null") && !(x.unsicher && !x.geklaert)) ? x.wert : null; };
    var grest = null;
    IFP.GREST.laender.forEach(function (l) { if (l[0] === o.bundesland) grest = l[1]; });
    var ref = IFP.REFERENZEN[o.ort] || null;
    var e = {
      KP: wert("KP"), WFL: wert("WFL"), KM: wert("KM"), HG_nu: wert("HG_nu"), MAK: wert("MAK"), GrESt: grest,
      REN: fin.REN, EK: fin.EK, i: fin.i, t: fin.t, ZB: fin.ZB, AUS: o.ausstattung,
      NE: h.NE, BR: h.BR, WK: h.WK, ERW: h.ERW, KINDER: h.KINDER, ALT: al.ALT, RENT: al.RENT,
      RP_m2: o.refEigen && IFP.istZahl(o.refEigen.kp) ? o.refEigen.kp : (ref ? ref.kaufpreisM2.wert : null),
      RM_m2: o.refEigen && IFP.istZahl(o.refEigen.miete) ? o.refEigen.miete : (ref ? ref.mieteM2.wert : null)
    };
    var annahmen = Object.keys(f).filter(function (k) { return f[k].zustand === "annahme"; });
    return { e: e, annahmen: annahmen };
  };
  IFP.schwellen = function () {
    var eig = IFP.zustand.einstellungen.schwellen || {}, s = {};
    Object.keys(IFP.SCHWELLEN_STANDARD).forEach(function (k) { s[k] = Object.assign({}, IFP.SCHWELLEN_STANDARD[k], eig[k] || {}); });
    return s;
  };
  /* Eigene Annahmen und Schwellen (Nutzertest W9T4, Punkt 1): für Hinweis in Auswertung, Präsentation und PDF */
  IFP.eigeneEinstellungen = function () {
    var E = IFP.zustand.einstellungen, liste = [], gleich = function (a, b) { return Math.abs(a - b) < 1e-9; };
    var fmt = function (v, ein) {
      if (ein === "%") return (Math.round(v * 1000) / 10).toLocaleString("de-DE") + " %";
      if (ein === "€") return Math.round(v).toLocaleString("de-DE") + " €";
      return (Math.round(v * 100) / 100).toLocaleString("de-DE");
    };
    Object.keys(IFP.ANNAHMEN_STANDARD).forEach(function (k) {
      var d = IFP.ANNAHMEN_STANDARD[k], v = (E.annahmen || {})[k];
      if (!IFP.istZahl(v) || gleich(v, d.wert)) return;
      var sp = (IFP.ANNAHMEN_SPANNE || {})[k], aus = !!sp && (v < sp[0] - 1e-9 || v > sp[1] + 1e-9);
      liste.push({ art: "annahme", id: k, label: d.label, wert: v, standard: d.wert, ausserhalb: aus,
        spanneText: sp ? fmt(sp[0], d.einheit) + " bis " + fmt(sp[1], d.einheit) : "",
        text: d.label + " " + fmt(v, d.einheit) + " (Standard " + fmt(d.wert, d.einheit) + ")" });
    });
    Object.keys(E.schwellen || {}).forEach(function (k) {
      var d = IFP.SCHWELLEN_STANDARD[k], e = E.schwellen[k] || {}; if (!d) return;
      ["gruen", "gelb"].forEach(function (g) {
        var v = e[g]; if (!IFP.istZahl(v) || !IFP.istZahl(d[g]) || gleich(v, d[g])) return;
        var milder = d.richtung === "hoch" ? v < d[g] : v > d[g];
        liste.push({ art: "schwelle", id: k + "-" + g, label: "Ampel " + d.label + ", Grenze " + (g === "gruen" ? "gut" : "kritisch"), wert: v, standard: d[g], ausserhalb: milder, milder: milder,
          text: "Ampel " + d.label + ", Grenze " + (g === "gruen" ? "gut" : "kritisch") + " " + fmt(v, d.einheit) + " (Standard " + fmt(d[g], d.einheit) + (milder ? ", milder" : "") + ")" });
      });
    });
    return liste;
  };
  IFP.ergebnis = function () {
    var x = IFP.eingaben();
    return IFP.rechne(x.e, x.annahmen, IFP.annahmenFlach(IFP.zustand.einstellungen.annahmen), IFP.schwellen());
  };

  IFP.exportJSON = function (objekteListe) {
    return JSON.stringify({ erstellt: new Date().toISOString(), app: "Immo Finanz Pilot " + IFP.VERSION, hinweis: "Enthält auch lokale Daten (Haushalt, Profil) – nur für dich.",
      einstellungen: IFP.zustand.einstellungen, aktuellesObjekt: IFP.zustand.objekt, meineObjekte: objekteListe || [], lokaleDaten: IFP.zustand.lokal }, null, 2);
  };
  IFP.allesLoeschen = function () {
    [K_ENTWURF, K_EINST, K_LOKAL, K_OBJEKTE, "ifp.sb.sitzung.v2"].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  };
})();
