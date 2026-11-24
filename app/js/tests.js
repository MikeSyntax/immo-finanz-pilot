/* Automatischer Rechentest (C2) – Sollwerte aus 03_Formel-Spezifikation v0.3, Abschnitt 4.
   Toleranz laut US-03 AK 1: ±1 € bzw. ±0,01 Prozentpunkte. */
(function () {
  "use strict";
  var IFP = window.IFP;
  var faelle = [];

  function fall(name, e, annahmen, soll, pruefAmpeln) { faelle.push({ name: name, e: e, annahmen: annahmen || [], soll: soll, ampeln: pruefAmpeln || {} }); }

  var T1 = { KP: 250000, WFL: 65, KM: 850, HG_nu: 80, MAK: 0.0357, GrESt: 0.05, REN: 0, EK: 40000, i: 0.038, t: 0.02, ZB: 10 };
  fall("T1 (fiktiv, 03 Abschnitt 4)", T1, [], {
    KNK: [26425.00, "€"], GI: [276425.00, "€"], D: [236425.00, "€"], R: [1142.72, "€"], RS_10: [179010.20, "€"],
    laufzeitJahre: [28.06, "x"], BMR: [0.0408, "%"], NMR: [0.0334, "%"], KPF: [24.51, "x"], KP_m2: [3846.15, "€"],
    KM_m2: [13.08, "€"], CF: [-389.72, "€"], BLW: [212500.00, "€"], LTV_Bank: [1.1126, "%"], LTV_Markt: [0.9457, "%"],
    DSCR: [0.67, "x"], R_neu: [1163.57, "€"], EKQ: [0.1447, "%"], KM_noetig_m2: [16.03, "€"], KP_max: [204000.00, "€"],
    Z_ZB: [79711.70, "€"], Z_ges: [148394.02, "€"], GB: [1222.72, "€"], tilgJ1: [4811.73, "€"], EKR: [0.0034, "%"],
    W_10: [290135.21, "€"], CF_summe10: [-39742.09, "€"], VZ_10: [31382.92, "€"]
  }, { LTV_BANK: "rot", DSCR: "rot", CF: "rot", EK_KNK: "gruen", BMR: "gelb", KPF: "gelb", GESAMT: "rot" });

  var T3 = { KP: 139000, WFL: 58.4, KM: 465, HG_nu: 73, MAK: 0.0357, GrESt: 0.055, REN: 0, EK: 30000, i: 0.038, t: 0.02, ZB: 10, RP_m2: 2850, RM_m2: 6.56 };
  fall("T3 Leipzig E3 – Hausgeld-Split als Annahme", T3, ["HG_nu"], {
    KNK: [15387.30, "€"], GI: [154387.30, "€"], D: [124387.30, "€"], R: [601.21, "€"], RS_10: [94180.37, "€"],
    BMR: [0.0401, "%"], KPF: [24.91, "x"], KP_m2: [2380.14, "€"], KM_m2: [7.96, "€"], KM_noetig_m2: [9.92, "€"],
    KP_max: [111600.00, "€"], CF: [-218.51, "€"], GB: [674.21, "€"], BLW: [118150.00, "€"], LTV_Bank: [1.0528, "%"],
    LTV_Markt: [0.8949, "%"], DSCR: [0.65, "x"], Z_ZB: [41937.71, "€"], Z_ges: [78072.67, "€"], VZ_10: [14756.93, "€"]
  }, { CF: "unvollstaendig", DSCR: "unvollstaendig", LTV_BANK: "rot", KP_REF: "gruen", MIETE_REF: "rot", GESAMT: "unvollstaendig" });

  fall("T3 Leipzig E3 – Hausgeld bestätigt", T3, [], {}, { CF: "rot", DSCR: "rot", GESAMT: "rot" });

  fall("Sonderfall Nullzins", { KP: 100000, WFL: 50, KM: 400, HG_nu: 50, MAK: 0, GrESt: 0.05, REN: 0, EK: 7000, i: 0, t: 0.02, ZB: 10 }, [],
    { D: [100000, "€"], R: [166.67, "€"], RS_10: [80000, "€"], Z_ZB: [0, "€"], laufzeitJahre: [50, "x"] });

  fall("Sonderfall Eigenkapital deckt alles", { KP: 100000, WFL: 50, KM: 400, HG_nu: 50, MAK: 0, GrESt: 0.05, REN: 0, EK: 200000, i: 0.03, t: 0.02, ZB: 10 }, [],
    { R: [0, "€"] }, { DSCR: "nichtbewertet", EK_KNK: "gruen" });

  fall("Sonderfall Miete fehlt", { KP: 100000, WFL: 50, KM: null, HG_nu: 50, MAK: 0, GrESt: 0.05, REN: 0, EK: 10000, i: 0.03, t: 0.02, ZB: 10 }, [],
    {}, { BMR: "unvollstaendig", KPF: "unvollstaendig", CF: "unvollstaendig", GESAMT: "unvollstaendig" });

  fall("Sonderfall Tilgung 0 %", { KP: 100000, WFL: 50, KM: 600, HG_nu: 50, MAK: 0, GrESt: 0.05, REN: 0, EK: 10000, i: 0.03, t: 0, ZB: 10 }, [],
    { D: [97000, "€"], R: [242.50, "€"], RS_10: [97000, "€"] });

  function ausfuehren() {
    var erg = [];
    faelle.forEach(function (f) {
      var r = IFP.rechne(f.e, f.annahmen);
      Object.keys(f.soll).forEach(function (k) {
        var soll = f.soll[k][0], art = f.soll[k][1], ist = r.werte[k];
        var tol = art === "%" ? 0.0001 : (art === "x" ? 0.01 : 1);
        var cmp = art === "%" ? Math.round(ist * 10000) / 10000 : Math.round(ist * 100) / 100;
        var ok = IFP.istZahl(ist) && Math.abs(cmp - soll) <= tol + 1e-9;
        erg.push({ fall: f.name, pruefung: k, soll: soll, ist: ist, ok: ok });
      });
      Object.keys(f.ampeln).forEach(function (k) {
        var ist = k === "GESAMT" ? r.gesamt.status : (r.ampeln.filter(function (a) { return a.id === k; })[0] || {}).status;
        erg.push({ fall: f.name, pruefung: "Ampel " + k, soll: f.ampeln[k], ist: ist, ok: ist === f.ampeln[k] });
      });
    });
    // Fundstellen-Abgleich (US-02 AK 6, US-11 AK 4): Demo-Zitate müssen im echten Text des Beispiel-Exposés stehen
    if (IFP.fundstelleSuchen && IFP.DEMO_E3 && IFP.DEMO_E3_SEITEN) {
      var zit = [];
      Object.keys(IFP.DEMO_E3.felder).forEach(function (k) { var q = IFP.DEMO_E3.felder[k]; if (q.zitat) zit.push([k, q.zitat]); (q.kandidaten || []).forEach(function (c) { zit.push([k, c.zitat]); }); });
      Object.keys(IFP.DEMO_E3.fundstellenUnterlagen).forEach(function (k) { zit.push([k, IFP.DEMO_E3.fundstellenUnterlagen[k]]); });
      zit.forEach(function (z) { var t = IFP.fundstelleSuchen(z[1], IFP.DEMO_E3_SEITEN); erg.push({ fall: "Fundstellen Beispiel-Exposé", pruefung: z[0] + ": „" + z[1] + "“", soll: "gefunden", ist: t.gefunden ? "gefunden (S. " + t.seite + ")" : "nicht gefunden", ok: t.gefunden }); });
      var neg = IFP.fundstelleSuchen("Kaufpreis 150.000 €", IFP.DEMO_E3_SEITEN);
      erg.push({ fall: "Fundstellen Beispiel-Exposé", pruefung: "erfundene Fundstelle wird erkannt", soll: "nicht gefunden", ist: neg.gefunden ? "gefunden" : "nicht gefunden", ok: !neg.gefunden });
    }
    return erg;
  }
  IFP.tests = { ausfuehren: ausfuehren, faelle: faelle };
})();
