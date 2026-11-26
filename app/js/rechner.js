/* Immo Finanz Pilot – Rechenkern
   Setzt 03_Formel-Spezifikation v0.3 um. Die KI rechnet nie – alle Zahlen entstehen hier.
   Reine Funktionen ohne Bildschirmbezug (Trennung Rechenkern / Darstellung).

   Eingaben e: Zahlen oder null (null = Angabe fehlt). Prozentwerte als Dezimalzahl.
     Objekt:      KP, WFL, KM, HG_nu, MAK, GrESt, REN (null = keine angegeben → 0, laut 03), AUS ("einfach"|"mittel"|"gut"|null)
     Finanzierung: EK, i, t, ZB
     Lokal:       NE, BR, WK, ERW, KINDER, ALT, RENT
     Referenzen:  RP_m2 (Kaufpreis €/m²), RM_m2 (ortsübliche Miete €/m²)
   annahmeFelder: Liste der Feldnamen, die nur als "Annahme" eingetragen sind.
   a: Bank-Annahmen (flache Werte), s: Schwellen. */
(function () {
  "use strict";
  var IFP = window.IFP;

  function istZahl(x) { return typeof x === "number" && isFinite(x); }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* Annuitätenrechnung inkl. Tilgungsplan (Formeln 5–13, 12a, 12b) */
  function darlehen(D, i, t, ZB) {
    var q = i / 12;
    var R = D * (i + t) / 12;
    var RS = function (n) {
      if (q === 0) return Math.max(0, D - R * n);
      var v = D * Math.pow(1 + q, n) - R * (Math.pow(1 + q, n) - 1) / q;
      return v < 0 ? 0 : v;
    };
    var plan = [], rest = D, m = 0, zinsGes = 0, zinsZB = 0, tilgJ1 = 0, maxM = 1200;
    var jahre = [];
    var jz = 0, jt = 0;
    while (rest > 1e-9 && m < maxM) {
      m++;
      var z = rest * q;
      var zahl = Math.min(R, rest + z);
      var tilg = zahl - z;
      if (tilg <= 0 && q > 0) { break; } // keine Tilgung → nie getilgt
      rest -= tilg;
      zinsGes += z; jz += z; jt += tilg;
      if (m <= ZB * 12) zinsZB += z;
      if (m <= 12) tilgJ1 += tilg;
      if (m % 12 === 0) { jahre.push({ jahr: m / 12, zinsen: jz, tilgung: jt, restschuld: Math.max(rest, 0) }); jz = 0; jt = 0; }
    }
    var volltilgung = rest <= 1e-9;
    if (!volltilgung && t > 0 && m < maxM) volltilgung = false;
    var laufzeitMonate = null;
    if (volltilgung) {
      laufzeitMonate = q === 0 ? D / R : -Math.log(1 - D * q / R) / Math.log(1 + q);
    }
    // Zinsen in der Zinsbindung auch dann korrekt, wenn die Schleife abgebrochen wurde (t = 0)
    if (!volltilgung) {
      zinsZB = R * ZB * 12 - (D - RS(ZB * 12));
      tilgJ1 = D - RS(12);
    }
    return {
      R: R, q: q, RS: RS, RS_ZB: RS(ZB * 12), RS_10: RS(120),
      laufzeitMonate: laufzeitMonate, volltilgung: volltilgung,
      Z_ZB: zinsZB, Z_ges: volltilgung ? zinsGes : null, tilgJ1: tilgJ1, jahre: jahre
    };
  }

  /* Ampel-Bewertung eines (gerundeten) Werts */
  function farbe(wert, sch) {
    if (sch.richtung === "hoch") return wert >= sch.gruen ? "gruen" : (wert >= sch.gelb ? "gelb" : "rot");
    if (sch.richtung === "tief") return wert <= sch.gruen ? "gruen" : (wert <= sch.gelb ? "gelb" : "rot");
    return null;
  }

  function rechne(e, annahmeFelder, a, s) {
    annahmeFelder = annahmeFelder || [];
    a = a || IFP.annahmenFlach();
    s = s || IFP.SCHWELLEN_STANDARD;
    var W = {}, hinweise = [];
    var fehltListe = function (felder) { return felder.filter(function (f) { return !istZahl(e[f]); }); };
    var annahmeListe = function (felder) { return felder.filter(function (f) { return annahmeFelder.indexOf(f) >= 0; }); };

    var REN = istZahl(e.REN) ? e.REN : 0;
    if (!istZahl(e.REN)) hinweise.push("Keine Renovierungskosten angegeben – mit 0 € gerechnet.");

    // A. Kapitalbedarf
    if (istZahl(e.KP) && istZahl(e.GrESt) && istZahl(e.MAK)) {
      W.KNK = e.KP * (e.GrESt + a.NOT + e.MAK);
      W.KNK_teile = { grest: e.KP * e.GrESt, notar: e.KP * a.NOT, makler: e.KP * e.MAK };
      W.GI = e.KP + W.KNK + REN;
      if (istZahl(e.EK)) { W.D = W.GI - e.EK; W.EKQ = e.EK / W.GI; }
    }
    W.REN = REN;

    // B. Darlehen
    var dl = null;
    if (istZahl(W.D) && istZahl(e.i) && istZahl(e.t) && istZahl(e.ZB)) {
      if (W.D <= 0) {
        hinweise.push("Eigenkapital übersteigt die Gesamtinvestition – es wird kein Darlehen benötigt.");
        W.kein_darlehen = true; W.R = 0; W.RS_ZB = 0; W.RS_10 = 0; W.Z_ZB = 0; W.Z_ges = 0; W.tilgJ1 = 0;
      } else {
        dl = darlehen(W.D, e.i, e.t, e.ZB);
        W.R = dl.R; W.RS_ZB = dl.RS_ZB; W.RS_10 = dl.RS_10; W.Z_ZB = dl.Z_ZB; W.Z_ges = dl.Z_ges;
        W.laufzeitJahre = dl.laufzeitMonate !== null ? dl.laufzeitMonate / 12 : null;
        W.volltilgung = dl.volltilgung; W.tilgJ1 = dl.tilgJ1; W.tilgungsjahre = dl.jahre;
        W.i_neu = e.i + a.ZUSCHLAG_ANSCHLUSS;
        W.R_neu = W.RS_ZB * (W.i_neu + e.t) / 12;
        if (istZahl(e.ALT) && istZahl(e.RENT)) {
          if (e.RENT <= e.ALT) W.RS_Rente_na = true; else W.RS_Rente = dl.RS((e.RENT - e.ALT) * 12);
        }
      }
    }

    // C. Rendite & Cashflow
    if (istZahl(e.KM)) {
      W.JKM = e.KM * 12;
      if (istZahl(e.KP) && e.KP > 0) W.BMR = W.JKM / e.KP;
      if (istZahl(e.KP) && W.JKM > 0) { W.KPF = e.KP / W.JKM; W.KP_max = W.JKM / a.ZR; }
      if (istZahl(e.HG_nu) && istZahl(W.GI)) W.NMR = (W.JKM - e.HG_nu * 12) / W.GI;
      if (istZahl(e.HG_nu) && istZahl(W.R)) W.CF = e.KM - e.HG_nu - e.KM * a.MAW - W.R;
    }
    if (istZahl(e.WFL) && e.WFL > 0) {
      if (istZahl(e.KP)) { W.KP_m2 = e.KP / e.WFL; W.KM_noetig_m2 = e.KP * a.ZR / 12 / e.WFL; }
      if (istZahl(e.KM)) W.KM_m2 = e.KM / e.WFL;
    }
    if (istZahl(W.R) && istZahl(e.HG_nu)) W.GB = W.R + e.HG_nu;

    // E. Bank-Kennzahlen
    if (istZahl(e.KP)) W.BLW = e.KP * (1 - a.SA);
    if (istZahl(W.D) && istZahl(W.BLW) && W.BLW > 0) W.LTV_Bank = Math.max(W.D, 0) / W.BLW;
    if (istZahl(W.D) && istZahl(e.KP) && e.KP > 0) W.LTV_Markt = Math.max(W.D, 0) / e.KP;
    if (istZahl(W.JKM) && istZahl(e.HG_nu) && istZahl(W.R)) {
      W.DSCR = W.R > 0 ? (W.JKM - e.HG_nu * 12) / (W.R * 12) : null;
      if (W.R === 0) W.DSCR_na = true;
    }
    // 36 Stellschrauben (Rückwärtsrechnung, 03 v0.4, freigegeben 24.11.2026): was müsste sich ändern?
    if (istZahl(W.CF) && W.CF < 0 && istZahl(e.i) && istZahl(e.t) && (e.i + e.t) > 0) W.H_EK_CF0 = -W.CF * 12 / (e.i + e.t);
    if (istZahl(W.R) && istZahl(e.HG_nu) && a.MAW < 1) W.H_KM_CF0 = (e.HG_nu + W.R) / (1 - a.MAW);
    if (istZahl(W.R) && W.R > 0 && istZahl(e.HG_nu) && s.DSCR) W.H_KM_DSCR = s.DSCR.gruen * W.R + e.HG_nu;
    if (istZahl(W.D) && istZahl(W.BLW) && s.LTV_BANK) W.H_EK_LTV = Math.max(W.D - s.LTV_BANK.gelb * W.BLW, 0);
    // 25b Beleihungswert – zweite Sicht (nur mit Referenzpreis)
    if (istZahl(e.RP_m2) && istZahl(e.WFL) && e.AUS) {
      var af = { einfach: a.AF_EINFACH, mittel: a.AF_MITTEL, gut: a.AF_GUT }[e.AUS];
      W.BLW_ref = e.WFL * e.RP_m2 * af * (1 - a.SA);
      if (istZahl(W.D)) W.LTV_ref = Math.max(W.D, 0) / W.BLW_ref;
    }
    // Haushalt (nur lokal)
    var lhp = null;
    if (istZahl(e.ERW) && e.ERW >= 1) lhp = a.LHP1 + (e.ERW - 1) * a.LHP2 + (istZahl(e.KINDER) ? e.KINDER : 0) * a.LHPK;
    W.LHP = lhp;
    if (istZahl(e.NE) && istZahl(e.BR) && istZahl(e.WK) && lhp !== null && istZahl(e.KM) && istZahl(e.HG_nu) && istZahl(W.R)) {
      W.HUE = e.NE + e.KM * a.MA - lhp - e.BR - e.WK - e.HG_nu - W.R;
      if (istZahl(W.R_neu)) W.HUE_Stress = W.HUE + W.R - W.R_neu;
    }

    // F. 10-Jahres-Perspektive (Formeln 31–34)
    if (istZahl(e.KP) && istZahl(W.D) && istZahl(W.R) && istZahl(e.EK)) {
      var verlauf = [], cfSumme = 0, cfOk = istZahl(e.KM) && istZahl(e.HG_nu);
      for (var j = 1; j <= 10; j++) {
        var rs = dl ? dl.RS(12 * j) : 0;
        var zeile = { jahr: j, restschuld: rs, getilgt: Math.max(W.D, 0) - rs, wert: e.KP * Math.pow(1 + a.WS, j) };
        if (cfOk) {
          zeile.miete = e.KM * 12 * Math.pow(1 + a.MS, j - 1);
          zeile.cf = (zeile.miete / 12 - e.HG_nu - (zeile.miete / 12) * a.MAW - W.R) * 12;
          cfSumme += zeile.cf; zeile.cfKum = cfSumme;
        }
        verlauf.push(zeile);
      }
      W.verlauf = verlauf;
      W.W_10 = e.KP * Math.pow(1 + a.WS, 10);
      if (cfOk) {
        W.CF_summe10 = cfSumme;
        W.VZ_10 = W.W_10 - W.RS_10 - e.EK + cfSumme;
        W.bruecke = { wert: W.W_10 - e.KP, tilgung: Math.max(W.D, 0) - W.RS_10, cf: cfSumme, nebenkosten: -W.KNK, renovierung: -REN };
      }
      if (istZahl(W.CF) && e.EK > 0) W.EKR = (W.CF * 12 + W.tilgJ1) / e.EK;
    }

    // Ampeln
    var basisD = ["KP", "GrESt", "MAK", "EK", "i", "t", "ZB"];
    var defs = [
      { id: "LTV_BANK", wert: W.LTV_Bank, felder: basisD, typ: "%" },
      { id: "DSCR", wert: W.DSCR, felder: basisD.concat(["KM", "HG_nu"]), typ: "x" },
      { id: "EK_KNK", wert: (istZahl(e.EK) && istZahl(W.KNK)) ? (e.EK >= W.KNK) : null, felder: ["EK", "KP", "GrESt", "MAK"], typ: "ja" },
      { id: "BMR", wert: W.BMR, felder: ["KP", "KM"], typ: "%" },
      { id: "CF", wert: W.CF, felder: basisD.concat(["KM", "HG_nu"]), typ: "€" },
      { id: "KPF", wert: W.KPF, felder: ["KP", "KM"], typ: "x" },
      { id: "HUE", wert: W.HUE, felder: basisD.concat(["KM", "HG_nu", "NE", "BR", "WK", "ERW"]), typ: "€", freiwilligStart: "NE" },
      { id: "RS_RENTE", wert: W.RS_Rente, felder: ["ALT", "RENT"], typ: "€", freiwilligStart: "ALT" },
      { id: "KP_REF", wert: (istZahl(W.KP_m2) && istZahl(e.RP_m2)) ? W.KP_m2 / e.RP_m2 - 1 : null, felder: ["KP", "WFL"], typ: "%", freiwilligStart: "RP_m2" },
      { id: "MIETE_REF", wert: (istZahl(W.KM_noetig_m2) && istZahl(e.RM_m2)) ? W.KM_noetig_m2 / e.RM_m2 - 1 : null, felder: ["KP", "WFL"], typ: "%", freiwilligStart: "RM_m2" }
    ];
    var ampeln = defs.map(function (d) {
      var sch = s[d.id];
      var amp = { id: d.id, label: sch.label, art: sch.art, wert: d.wert, typ: d.typ, schwelle: sch, fehlt: [], annahmen: [] };
      if (sch.art === "freiwillig" && !istZahl(e[d.freiwilligStart])) { amp.status = "nichtbewertet"; return amp; }
      amp.fehlt = fehltListe(d.felder);
      amp.annahmen = annahmeListe(d.felder);
      if (d.id === "RS_RENTE" && W.RS_Rente_na) { amp.status = "nichtbewertet"; amp.text = "nicht anwendbar"; return amp; }
      if (d.id === "DSCR" && W.DSCR_na) { amp.status = "nichtbewertet"; amp.text = "kein Darlehen"; return amp; }
      if (amp.fehlt.length || d.wert === null || d.wert === undefined) { amp.status = "unvollstaendig"; return amp; }
      if (amp.annahmen.length) { amp.status = "unvollstaendig"; amp.wegenAnnahme = true; return amp; }
      var v = d.wert;
      if (d.typ === "ja") { amp.status = v ? "gruen" : "rot"; return amp; }
      var gerundet = d.typ === "%" ? Math.round(v * 10000) / 10000 : r2(v);
      var sch2 = sch;
      if (d.id === "HUE") sch2 = { richtung: "hoch", gruen: r2(e.NE * sch.gruenAnteilNE), gelb: sch.gelb };
      if (d.id === "RS_RENTE") sch2 = { richtung: "tief", gruen: 0, gelb: r2(W.D * sch.gelbAnteilD) };
      amp.status = farbe(gerundet, sch2);
      return amp;
    });

    // Gesamt-Ampel (03 Abschnitt 3b)
    var pflichtOffen = ampeln.filter(function (x) { return x.art === "pflicht" && x.status === "unvollstaendig"; });
    var bewertet = ampeln.filter(function (x) { return ["gruen", "gelb", "rot"].indexOf(x.status) >= 0; });
    var gruen = bewertet.filter(function (x) { return x.status === "gruen"; }).length;
    var gesamt = { gruen: gruen, bewertet: bewertet.length, offen: pflichtOffen.map(function (x) { return x.label; }) };
    if (pflichtOffen.length) gesamt.status = "unvollstaendig";
    else if (bewertet.some(function (x) { return x.status === "rot"; })) gesamt.status = "rot";
    else if (bewertet.some(function (x) { return x.status === "gelb"; })) gesamt.status = "gelb";
    else if (bewertet.length) gesamt.status = "gruen";
    else gesamt.status = "unvollstaendig";

    return { werte: W, ampeln: ampeln, gesamt: gesamt, hinweise: hinweise };
  }

  /* Plausibilitätsprüfung am Feld (US-03 AK 3, 03 Abschnitt 3c) */
  function plausibel(e) {
    var p = {};
    if (istZahl(e.i) && e.i > 0.15) p.i = "Zins über 15 % – bitte prüfen.";
    if (istZahl(e.i) && e.i < 0) p.i = "Zins darf nicht negativ sein.";
    if (istZahl(e.t) && e.t > 0.10) p.t = "Tilgung über 10 % – bitte prüfen.";
    if (istZahl(e.t) && e.t < 0) p.t = "Tilgung darf nicht negativ sein.";
    if (istZahl(e.ZB) && (e.ZB < 1 || e.ZB > 30)) p.ZB = "Zinsbindung muss zwischen 1 und 30 Jahren liegen.";
    if (istZahl(e.KP) && e.KP <= 0) p.KP = "Kaufpreis muss größer als 0 sein.";
    if (istZahl(e.WFL) && (e.WFL <= 0 || e.WFL > 1000)) p.WFL = "Wohnfläche zwischen 1 und 1.000 m² eingeben.";
    if (istZahl(e.EK) && e.EK < 0) p.EK = "Eigenkapital darf nicht negativ sein.";
    return p;
  }

  IFP.annahmenFlach = function (eigene) {
    var f = {};
    Object.keys(IFP.ANNAHMEN_STANDARD).forEach(function (k) {
      f[k] = eigene && istZahl(eigene[k]) ? eigene[k] : IFP.ANNAHMEN_STANDARD[k].wert;
    });
    return f;
  };
  IFP.rechne = rechne;
  IFP.darlehen = darlehen;
  IFP.plausibel = plausibel;
  IFP.istZahl = istZahl;
})();
