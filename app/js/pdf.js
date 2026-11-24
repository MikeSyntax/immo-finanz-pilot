/* Immo Finanz Pilot – Objekt-Präsentation für die Bank als PDF (Phase 5).
   Wird vollständig auf dem Gerät erzeugt (jsPDF, lokal eingebunden). Nichts wird verschickt.
   Gliederung nach 06 US-06: Kurzfassung · Steckbrief · Finanzierung · Rentabilität · So rechnet die Bank ·
   10-Jahres-Entwicklung · Unterlagen · Investor-Kurzprofil (nur wenn ausgefüllt) · Annahmen und Hinweise.
   Helles Logo-Schema (Entscheidung P-9). Bei offenen Punkten: Wasserzeichen und Kopfzeile „Entwurf“ (E5). */
(function () {
  "use strict";
  var IFP = window.IFP;

  var FARBE = { text: [26, 26, 26], grau: [95, 95, 95], gold: [168, 132, 31], goldText: [138, 109, 31], linie: [229, 223, 208], flaeche: [250, 247, 240],
    gruen: [30, 107, 52], gruenH: [232, 243, 234], gelb: [138, 106, 0], gelbH: [255, 244, 204], rot: [180, 35, 24], rotH: [253, 232, 230], grauH: [238, 238, 238] };
  var AMPEL_TEXT = { gruen: "gut", gelb: "prüfen", rot: "kritisch", unvollstaendig: "unvollständig", nichtbewertet: "nicht bewertet" };

  /* ---------- jsPDF bei Bedarf laden (funktioniert auch per Doppelklick) ---------- */
  var laden = null;
  function ladeJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    laden = laden || new Promise(function (ok, fehler) {
      var s = document.createElement("script"); s.src = "lib/jspdf/jspdf.umd.min.js";
      s.onload = function () { ok(); }; s.onerror = function () { laden = null; fehler(new Error("Das PDF-Werkzeug konnte nicht geladen werden.")); };
      document.head.appendChild(s);
    });
    return laden;
  }

  /* ---------- Text für die Standardschrift (WinAnsi) aufbereiten ---------- */
  var ERLAUBT = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
  function t(s) {
    if (s === null || s === undefined) return "";
    s = String(s).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
      .replace(/m²/g, "qm").replace(/²/g, "2").replace(/−/g, "-").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/Σ/g, "Summe ").replace(/→/g, "->").replace(/ⓘ/g, "")
      .replace(/[✓✔]/g, "").replace(/[✕✘]/g, "").replace(/ | /g, " ");
    var r = "";
    for (var i = 0; i < s.length; i++) { var c = s.charAt(i), k = s.charCodeAt(i); r += (k <= 255 || ERLAUBT.indexOf(c) >= 0) ? c : ""; }
    return r;
  }

  function Seite(doc) {
    var B = 210, H = 297, R = 18, OBEN = 24, UNTEN = 280;
    var me = { doc: doc, y: OBEN, B: B, H: H, R: R, innen: B - 2 * R };
    me.neu = function () { doc.addPage(); me.y = OBEN; };
    me.platz = function (h) { if (me.y + h > UNTEN) me.neu(); };
    me.farbe = function (c) { doc.setTextColor(c[0], c[1], c[2]); };
    me.schrift = function (gr, fett, art) { doc.setFont(art || "helvetica", fett ? "bold" : "normal"); doc.setFontSize(gr); };
    me.kapitel = function (nr, titel) {
      me.neu();
      me.schrift(9, true); me.farbe(FARBE.goldText); doc.text(t("KAPITEL " + nr), R, me.y);
      me.y += 7; me.schrift(18, true); me.farbe(FARBE.text); doc.text(t(titel), R, me.y);
      me.y += 3; doc.setDrawColor(FARBE.gold[0], FARBE.gold[1], FARBE.gold[2]); doc.setLineWidth(0.8); doc.line(R, me.y, R + 30, me.y); me.y += 8;
    };
    me.h2 = function (s) { me.platz(14); me.y += 2; me.schrift(12, true); me.farbe(FARBE.text); doc.text(t(s), R, me.y); me.y += 6; };
    me.absatz = function (s, opt) {
      opt = opt || {}; me.schrift(opt.gr || 10, opt.fett, opt.art); me.farbe(opt.farbe || FARBE.text);
      var zeilen = doc.splitTextToSize(t(s), opt.breite || me.innen), zh = (opt.gr || 10) * 0.45;
      zeilen.forEach(function (z) { me.platz(zh + 1); doc.text(z, (opt.x || R), me.y); me.y += zh; });
      me.y += opt.abstand === undefined ? 2.5 : opt.abstand;
    };
    me.liste = function (punkte, opt) { punkte.forEach(function (p) { me.absatz("• " + p, Object.assign({ abstand: 1 }, opt || {})); }); me.y += 1.5; };
    me.ampel = function (status, x, y) {
      var txt = t(AMPEL_TEXT[status] || "unvollständig"), m = { gruen: ["gruen", "gruenH"], gelb: ["gelb", "gelbH"], rot: ["rot", "rotH"] }[status] || ["grau", "grauH"];
      me.schrift(8, true); var w = doc.getTextWidth(txt) + 7;
      doc.setFillColor.apply(doc, FARBE[m[1]]); doc.setDrawColor.apply(doc, FARBE[m[0]]); doc.setLineWidth(0.3);
      doc.roundedRect(x, y - 3.6, w, 5, 2.5, 2.5, "FD");
      doc.setFillColor.apply(doc, FARBE[m[0]]); doc.circle(x + 2.6, y - 1.1, 1, "F");
      me.farbe(FARBE[m[0]]); doc.text(txt, x + 4.6, y); me.farbe(FARBE.text);
      return w;
    };
    /* Tabelle: spalten = [{b: Breite, rechts: bool}], zeilen = [[...], ...]; Zeile {summe:true} via Objekt */
    me.tabelle = function (spalten, zeilen, opt) {
      opt = opt || {}; var gr = opt.gr || 9.5, zh = gr * 0.45;
      if (opt.kopf) zeilen = [{ kopf: true, z: opt.kopf }].concat(zeilen);
      zeilen.forEach(function (zeile, idx) {
        var z = zeile.z || zeile, fett = zeile.summe || zeile.kopf;
        var umbr = z.map(function (zelle, i) { me.schrift(gr, fett); return doc.splitTextToSize(t(zelle && zelle.ampel ? "" : (zelle && zelle.text !== undefined ? zelle.text : zelle)), spalten[i].b - 3); });
        var hoehe = Math.max.apply(null, umbr.map(function (u) { return u.length; })) * zh + 3;
        me.platz(hoehe + 1);
        if (zeile.kopf) { doc.setFillColor.apply(doc, FARBE.flaeche); doc.rect(R, me.y - zh - 0.6, me.innen, hoehe, "F"); }
        var x = R;
        z.forEach(function (zelle, i) {
          if (zelle && zelle.ampel) { me.ampel(zelle.ampel, x + 1, me.y); }
          else {
            me.schrift(gr, fett); me.farbe(zeile.kopf ? FARBE.grau : (zelle && zelle.grau ? FARBE.grau : FARBE.text));
            umbr[i].forEach(function (l, k) { var yy = me.y + k * zh; if (spalten[i].rechts) doc.text(l, x + spalten[i].b - 1.5, yy, { align: "right" }); else doc.text(l, x + 1.5, yy); });
          }
          x += spalten[i].b;
        });
        doc.setDrawColor.apply(doc, zeile.summe ? FARBE.text : FARBE.linie); doc.setLineWidth(zeile.summe ? 0.4 : 0.2);
        var linieY = zeile.summe ? me.y - zh - 0.4 : me.y + hoehe - zh - 0.8;
        doc.line(R, linieY, R + me.innen, linieY);
        me.y += hoehe;
      });
      me.y += 3;
    };
    me.kasten = function (titel, text, art) {
      var f = art === "warnung" ? [FARBE.gelbH, FARBE.gelb] : art === "ok" ? [FARBE.gruenH, FARBE.gruen] : [FARBE.flaeche, FARBE.gold];
      me.schrift(9.5); var zeilen = doc.splitTextToSize(t(text), me.innen - 8), h = 9 + zeilen.length * 4.3;
      me.platz(h + 2);
      doc.setFillColor.apply(doc, f[0]); doc.setDrawColor.apply(doc, f[1]); doc.setLineWidth(0.3); doc.roundedRect(R, me.y - 4, me.innen, h, 2, 2, "FD");
      me.schrift(10, true); me.farbe(FARBE.text); doc.text(t(titel), R + 4, me.y + 1);
      me.schrift(9.5); zeilen.forEach(function (z, i) { doc.text(z, R + 4, me.y + 6 + i * 4.3); });
      me.y += h + 3;
    };
    return me;
  }

  function hausLogo(doc, x, y, s) {
    doc.setDrawColor.apply(doc, FARBE.gold); doc.setLineWidth(0.6 * s);
    doc.line(x, y + 4 * s, x + 5 * s, y); doc.line(x + 5 * s, y, x + 10 * s, y + 4 * s);
    doc.setFillColor.apply(doc, FARBE.gold);
    doc.rect(x + 2 * s, y + 6.5 * s, 1.6 * s, 2.5 * s, "F"); doc.rect(x + 4.3 * s, y + 5 * s, 1.6 * s, 4 * s, "F"); doc.rect(x + 6.6 * s, y + 3.5 * s, 1.6 * s, 5.5 * s, "F");
  }

  /* ---------- Inhalte ---------- */
  function erstellen() {
    return ladeJsPdf().then(function () {
      var U = IFP.ui, Z = IFP.zustand, o = Z.objekt, erg = IFP.ergebnis(), w = erg.werte, x = IFP.eingaben().e;
      var a = IFP.annahmenFlach(Z.einstellungen.annahmen), euro = U.euro, zahl = U.zahl, proz = U.proz;
      var ks = U.kennzahlen(erg), op = U.offenePunkte(), entwurf = op.length > 0 || erg.gesamt.status === "unvollstaendig";
      var pflicht = function (k) { var d = IFP.SCHWELLEN_STANDARD[k.id]; return d && d.art === "pflicht"; };
      var titel = o.adresse || o.ort || "Objekt ohne Namen", heute = new Date().toLocaleDateString("de-DE");
      var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
      doc.setProperties({ title: "Objekt-Präsentation – " + titel, subject: "Objekt-Präsentation für die Bank", creator: "Immo Finanz Pilot " + IFP.VERSION });
      var S = Seite(doc), R = S.R, nr = 0;

      /* ----- Deckblatt + Kapitel 1 Kurzfassung (Seite 1) ----- */
      nr++;
      hausLogo(doc, R, 14, 1.2);
      S.schrift(13, true); S.farbe(FARBE.text); doc.text("Immo Finanz", R + 15, 22); var lw = doc.getTextWidth("Immo Finanz ");
      S.farbe(FARBE.gold); doc.text("Pilot", R + 15 + lw, 22);
      S.y = 38; S.schrift(9, true); S.farbe(FARBE.goldText); doc.text(t("OBJEKT-PRÄSENTATION FÜR DIE BANK · KAPITEL 1: KURZFASSUNG AUF EINEN BLICK"), R, S.y);
      S.y += 9; S.schrift(20, true); S.farbe(FARBE.text);
      doc.splitTextToSize(t(titel), S.innen).forEach(function (z) { doc.text(z, R, S.y); S.y += 8; });
      var eck = [IFP.istZahl(x.WFL) ? zahl(x.WFL, 1) + " m² Wohnfläche" : "", o.felder.BJ && o.felder.BJ.wert ? "Baujahr " + o.felder.BJ.wert : "", o.bundesland || "", o.felder.VERMIETET && o.felder.VERMIETET.wert ? o.felder.VERMIETET.wert : ""].filter(Boolean).join(" · ");
      S.absatz(eck, { farbe: FARBE.grau, abstand: 4 });
      var boxen = [["Kaufpreis", euro(x.KP, 0)], ["Darlehen", euro(w.D, 0)], ["Rate pro Monat", euro(w.R)], ["Cashflow pro Monat", euro(w.CF)]], bb = (S.innen - 9) / 4;
      boxen.forEach(function (b, i) {
        var bx = R + i * (bb + 3); doc.setFillColor.apply(doc, FARBE.flaeche); doc.roundedRect(bx, S.y, bb, 17, 2, 2, "F");
        S.schrift(8); S.farbe(FARBE.grau); doc.text(t(b[0]), bx + 3, S.y + 5.5); S.schrift(12.5, true); S.farbe(FARBE.text); doc.text(t(b[1]), bx + 3, S.y + 12.5);
      });
      S.y += 25;
      S.schrift(11, true); S.farbe(FARBE.text); doc.text("Gesamturteil:", R, S.y); var gw = S.ampel(erg.gesamt.status, R + 28, S.y);
      S.schrift(9.5); S.farbe(FARBE.grau); doc.text(t(erg.gesamt.gruen + " von " + erg.gesamt.bewertet + " bewerteten Prüfungen gut"), R + 31 + gw, S.y); S.y += 5;
      if (erg.gesamt.status === "unvollstaendig") S.absatz("Kein Gesamturteil, solange Pflichtprüfungen offen sind: " + erg.gesamt.offen.join(", ") + ".", { gr: 9, farbe: FARBE.grau });
      S.y += 2;
      S.tabelle([{ b: 62 }, { b: 30, rechts: true }, { b: 32 }, { b: S.innen - 124 }],
        ks.filter(pflicht).map(function (k) { var q = k.ampel; return [k.titel, k.wert, { ampel: q ? q.status : "unvollstaendig" }, { grau: true, text: q && q.status === "unvollstaendig" ? U.ampelZusatz(q) : k.unter }]; }),
        { kopf: ["Prüfung der Bank", "Wert", "Ampel", "Hinweis"] });
      if (op.length) S.kasten("Entwurf – " + op.length + (op.length === 1 ? " offener Punkt" : " offene Punkte"), op.map(function (p) { return p.text; }).join(" · ") + ". Die betroffenen Werte sind in dieser Präsentation als Annahme oder fehlend gekennzeichnet.", "warnung");
      else S.kasten("Alle Pflichtangaben belegt", "Alle Werte wurden vom Nutzer geprüft und bestätigt.", "ok");
      var hb1 = U.stellschrauben(erg);
      if (hb1.length) { S.h2("Was müsste sich ändern? (Auszug)"); S.tabelle([{ b: S.innen - 60 }, { b: 60, rechts: true }], hb1.slice(0, 3).map(function (h) { return [h[0], h[1]]; }), { gr: 9 }); S.absatz("Vollständig mit Rechenweg in Kapitel „So rechnet die Bank“.", { gr: 8, farbe: FARBE.grau }); }
      var ki = o.kiTexte && o.kiTexte.zusammenfassung;
      if (ki && ki.an && ki.geprueft && ki.text) { S.h2("Zusammenfassung"); S.absatz(ki.text); S.absatz("KI-generiert, vom Nutzer geprüft.", { gr: 8, farbe: FARBE.grau }); }

      /* ----- Kapitel 2 Objekt-Steckbrief ----- */
      S.kapitel(++nr, "Objekt-Steckbrief");
      var herkunft = function (f) {
        if (f.zustand === "annahme") return "Annahme";
        if (f.zustand === "leer") return "fehlt";
        if (f.zustand === "null") return "0 bestätigt";
        return { bestaetigt: "aus Exposé, bestätigt", korrigiert: "korrigiert", manuell: "selbst eingegeben", ki: "aus Exposé" }[f.herkunft] || "bestätigt";
      };
      S.tabelle([{ b: 62 }, { b: 62 }, { b: S.innen - 124 }],
        IFP.FELDER.map(function (d) { var f = o.felder[d.id]; return [d.label, U.feldWertText(d, f), d.id === "ORT" ? (o.ort ? "bestätigt" : "fehlt") : herkunft(f)]; }),
        { kopf: ["Angabe", "Wert", "Herkunft"] });
      var fund = IFP.FELDER.filter(function (d) { var f = o.felder[d.id]; return f.fundstelle && f.fundstelle.zitat; });
      if (fund.length) {
        S.h2("Fundstellen im Exposé (Originalwortlaut)");
        fund.forEach(function (d) { var f = o.felder[d.id]; S.absatz(d.label + " – Seite " + f.fundstelle.seite + ": „" + f.fundstelle.zitat + "“", { gr: 9, abstand: 1.2 }); });
        S.y += 2;
      }
      if (o.warnungen && o.warnungen.length) {
        S.h2("Hinweise, die die Bank anders bewerten könnte");
        o.warnungen.forEach(function (wa) { S.kasten(wa.titel, "„" + wa.zitat + "“ – " + wa.erklaerung, "warnung"); });
      }

      /* ----- Kapitel 3 Kapitalbedarf und Finanzierung ----- */
      S.kapitel(++nr, "Kapitalbedarf und Finanzierung");
      var sp = [{ b: 10 }, { b: S.innen - 55 }, { b: 45, rechts: true }];
      if (IFP.istZahl(w.KNK)) {
        S.h2("Kapitalbedarf");
        S.tabelle(sp, [
          ["", "Grunderwerbsteuer " + proz(x.GrESt, 1) + " (" + (o.bundesland || "–") + ")", euro(w.KNK_teile.grest)], ["+", "Notar und Grundbuch " + proz(a.NOT, 1) + " (Annahme)", euro(w.KNK_teile.notar)],
          ["+", "Makler " + proz(x.MAK), euro(w.KNK_teile.makler)], { summe: true, z: ["=", "Kaufnebenkosten", euro(w.KNK)] },
          ["", "Kaufpreis", euro(x.KP)], ["+", "Kaufnebenkosten", euro(w.KNK)], ["+", "Renovierung", IFP.istZahl(o.finanzierung.REN) ? euro(w.REN) : "keine angegeben"],
          { summe: true, z: ["=", "Gesamtinvestition", euro(w.GI)] }, ["−", "Eigenkapital", euro(x.EK)], { summe: true, z: ["=", "Darlehen", euro(w.D)] }
        ]);
      } else S.absatz("Kaufpreis, Bundesland oder Maklerprovision fehlen – Kapitalbedarf nicht berechenbar.", { farbe: FARBE.grau });
      S.h2("Darlehen");
      S.tabelle([{ b: S.innen - 55 }, { b: 55, rechts: true }], [
        ["Sollzins pro Jahr", proz(x.i)], ["Anfängliche Tilgung pro Jahr", proz(x.t)], ["Zinsbindung", IFP.istZahl(x.ZB) ? zahl(x.ZB, 0) + " Jahre" : "–"],
        { summe: true, z: ["Monatsrate (Zins + Tilgung)", euro(w.R)] }, ["Zinsen während der Zinsbindung", euro(w.Z_ZB)],
        ["Restschuld am Ende der Zinsbindung", euro(w.RS_ZB)], ["Laufzeit bis schuldenfrei (gleicher Zins, Annahme)", w.volltilgung ? zahl(w.laufzeitJahre, 1) + " Jahre" : "keine Volltilgung"],
        ["Eigenkapitalquote", proz(w.EKQ, 1)]
      ]);
      if (IFP.istZahl(w.R_neu) && w.RS_ZB > 0) {
        S.h2("Anschlussfinanzierung (Stresstest)");
        S.tabelle([{ b: S.innen - 55 }, { b: 55, rechts: true }], [["Restschuld", euro(w.RS_ZB)], ["Anschlusszins (Zins + " + zahl(a.ZUSCHLAG_ANSCHLUSS * 100, 1) + " Prozentpunkte, Annahme)", proz(w.i_neu)], { summe: true, z: ["Neue Monatsrate bei gleicher Tilgung", euro(w.R_neu)] }]);
      }

      /* ----- Kapitel 4 Rentabilität ----- */
      S.kapitel(++nr, "Rentabilität");
      var hgA = o.felder.HG_nu && o.felder.HG_nu.zustand === "annahme";
      S.h2("Monatsrechnung");
      S.tabelle(sp, [
        ["", "Kaltmiete", euro(x.KM)], ["−", "Nicht umlagefähiges Hausgeld" + (hgA ? " (Annahme)" : ""), euro(x.HG_nu)],
        ["−", "Mietausfall " + proz(a.MAW, 0) + " (Annahme)", euro(IFP.istZahl(x.KM) ? x.KM * a.MAW : null)], ["−", "Kreditrate", euro(w.R)],
        { summe: true, z: ["=", "Cashflow vor Steuern", euro(w.CF)] }, ["", "Belastung pro Monat (Rate + nicht umlagefähiges Hausgeld)", euro(w.GB)]
      ]);
      S.h2("Kennzahlen");
      S.tabelle([{ b: S.innen - 55 }, { b: 55, rechts: true }], [
        ["Bruttomietrendite (Jahreskaltmiete ÷ Kaufpreis)", proz(w.BMR)], ["Nettomietrendite", proz(w.NMR)], ["Kaufpreisfaktor", zahl(w.KPF)],
        ["Kaufpreis je m²", euro(w.KP_m2)], ["Kaltmiete je m²", euro(w.KM_m2)], ["Nötige Miete je m² für " + proz(a.ZR, 0) + " Zielrendite", euro(w.KM_noetig_m2)],
        ["Maximaler Kaufpreis bei " + proz(a.ZR, 0) + " Zielrendite", euro(w.KP_max, 0)], ["Eigenkapitalrendite Jahr 1 (vereinfacht)", proz(w.EKR)]
      ]);
      S.absatz("Alle Werte vor Steuern. Steuerliche Effekte (AfA, Werbungskosten) sind nicht berücksichtigt.", { gr: 8.5, farbe: FARBE.grau });

      /* ----- Kapitel 5 So rechnet die Bank ----- */
      S.kapitel(++nr, "So rechnet die Bank");
      S.absatz("Jede Kennzahl mit Formel, den eingesetzten Zahlen und der Schwelle. Banken rechnen unterschiedlich – die Werte sind Orientierung, keine Zusage.", { gr: 9, farbe: FARBE.grau });
      ks.forEach(function (k) {
        var q = k.ampel; S.platz(28);
        S.schrift(11, true); S.farbe(FARBE.text); doc.text(t(k.titel), R, S.y); var tw = doc.getTextWidth(t(k.titel));
        if (q) S.ampel(q.status, R + tw + 4, S.y);
        S.schrift(10, true); doc.text(t(k.wert), R + S.innen, S.y, { align: "right" }); S.y += 5;
        S.absatz(k.formel + "\n" + k.zahlen, { gr: 8.5, art: "courier", abstand: 1 });
        if (q && q.status === "unvollstaendig") S.absatz("Warum grau: " + U.ampelZusatz(q), { gr: 8.5, farbe: FARBE.grau, abstand: 1 });
        if (q && q.status === "nichtbewertet") S.absatz("Freiwillige Angabe – nicht ausgefüllt.", { gr: 8.5, farbe: FARBE.grau, abstand: 1 });
        if (q && q.schwelle) S.absatz("Schwellen: " + U.schwelleText(q), { gr: 8.5, farbe: FARBE.grau, abstand: 1 });
        doc.setDrawColor.apply(doc, FARBE.linie); doc.setLineWidth(0.2); doc.line(R, S.y, R + S.innen, S.y); S.y += 5;
      });
      var hb = U.stellschrauben(erg);
      if (hb.length) {
        S.h2("Was müsste sich ändern?");
        S.absatz("Jede Zeile für sich gerechnet, alle anderen Werte bleiben gleich (Formeln 36a–d).", { gr: 9, farbe: FARBE.grau });
        S.tabelle([{ b: S.innen - 60 }, { b: 60, rechts: true }], hb.map(function (h) { return [h[0], h[1]]; }));
        if (hgA) S.absatz("Gerechnet mit dem geschätzten nicht umlagefähigen Hausgeld (Annahme).", { gr: 8.5, farbe: FARBE.grau });
      }

      /* ----- Kapitel 6 10-Jahres-Entwicklung ----- */
      S.kapitel(++nr, "Zehn-Jahres-Entwicklung");
      if (w.verlauf) {
        S.absatz("Prognose mit Wertsteigerung " + proz(a.WS, 1) + " und Mietsteigerung " + proz(a.MS, 1) + " pro Jahr (Annahmen), Hausgeld gleichbleibend. Restschuld und Tilgung folgen aus dem Darlehen bei gleichem Zins.", { gr: 9, farbe: FARBE.grau });
        // Diagramm
        var v = w.verlauf, gx = R + 14, gy = S.y + 2, gb = S.innen - 16, gh = 52;
        var maxV = Math.max.apply(null, v.map(function (z) { return Math.max(z.wert, z.restschuld); })), minV = Math.min.apply(null, v.map(function (z) { return Math.min(z.wert, z.restschuld); }));
        var lo = Math.floor(minV * 0.9 / 10000) * 10000, hi = Math.ceil(maxV * 1.03 / 10000) * 10000;
        var px = function (j) { return gx + (j - 1) * gb / 9; }, py = function (val) { return gy + gh - (val - lo) / (hi - lo) * gh; };
        S.schrift(7); S.farbe(FARBE.grau);
        for (var st = 0; st <= 4; st++) { var vv = lo + (hi - lo) * st / 4; doc.setDrawColor.apply(doc, FARBE.linie); doc.setLineWidth(0.15); doc.line(gx, py(vv), gx + gb, py(vv)); doc.text(t(zahl(vv / 1000, 0) + " T€"), gx - 2, py(vv) + 1, { align: "right" }); }
        v.forEach(function (z) { doc.text(String(z.jahr), px(z.jahr), gy + gh + 4, { align: "center" }); });
        var linie = function (key, farbe, strich) { doc.setDrawColor.apply(doc, farbe); doc.setLineWidth(0.7); doc.setLineDashPattern(strich ? [1.5, 1] : [], 0); for (var i = 1; i < v.length; i++) doc.line(px(v[i - 1].jahr), py(v[i - 1][key]), px(v[i].jahr), py(v[i][key])); doc.setLineDashPattern([], 0); };
        linie("wert", FARBE.gold, false); linie("restschuld", FARBE.text, true);
        S.y = gy + gh + 9; S.schrift(8); S.farbe(FARBE.goldText); doc.text("—— Prognosewert", R, S.y); S.farbe(FARBE.text); doc.text("- - - Restschuld (Achse beginnt nicht bei 0)", R + 32, S.y); S.y += 7;
        S.tabelle([{ b: 12 }, { b: 30, rechts: true }, { b: 30, rechts: true }, { b: 26, rechts: true }, { b: 30, rechts: true }, { b: 23, rechts: true }, { b: S.innen - 151, rechts: true }],
          v.map(function (z) { return [String(z.jahr), euro(z.miete, 0), euro(z.restschuld, 0), euro(z.getilgt, 0), euro(z.wert, 0), euro(z.cf, 0), euro(z.cfKum, 0)]; }),
          { kopf: ["Jahr", "Jahresmiete", "Restschuld", "getilgt", "Wert", "Cashflow", "kumuliert"], gr: 8.5 });
        var b = w.bruecke;
        if (b) {
          S.h2("Vermögensbrücke nach 10 Jahren");
          S.tabelle(sp, [["", "Wertsteigerung (Prognose)", euro(b.wert)], ["+", "Getilgter Kredit", euro(b.tilgung)], [b.cf < 0 ? "−" : "+", "Summe Cashflow 10 Jahre" + (b.cf < 0 ? " (Zuzahlung)" : ""), euro(Math.abs(b.cf))],
            ["−", "Kaufnebenkosten", euro(-b.nebenkosten)], ["−", "Renovierung", euro(-b.renovierung)], { summe: true, z: ["=", "Vermögenszuwachs", euro(w.VZ_10)] }]);
          S.absatz("Ohne Steuern. Steuerfreiheit des Verkaufsgewinns nach 10 Jahren (§ 23 EStG) nach heutigem Stand – keine Steuerberatung.", { gr: 8.5, farbe: FARBE.grau });
        }
      } else S.absatz("Für die 10-Jahres-Entwicklung fehlen Angaben (Kaufpreis, Finanzierung).", { farbe: FARBE.grau });

      /* ----- Kapitel 7 Unterlagen ----- */
      S.kapitel(++nr, "Unterlagen und offene Punkte");
      if (op.length) { S.h2("Offene Punkte"); S.liste(op.map(function (p) { return p.text; })); }
      var stTxt = { enthalten: "im Exposé enthalten", erwaehnt: "erwähnt, nicht beigefügt", fehlt: "fehlt", liegtvor: "liegt vor" };
      IFP.UNTERLAGEN.forEach(function (g) {
        S.h2(g.gruppe + " · " + g.titel);
        S.tabelle([{ b: S.innen - 88 }, { b: 48 }, { b: 40 }], g.posten.map(function (p) {
          var st = (o.unterlagen || {})[p.id] || "fehlt"; return [p.name, p.optional && st === "fehlt" ? "falls zutreffend" : (g.ki || st === "liegtvor" ? stTxt[st] : "–"), p.wer];
        }), { kopf: ["Unterlage", "Stand", "Wer liefert"], gr: 8.5 });
      });

      /* ----- Kapitel 8 Investor-Kurzprofil (nur wenn ausgefüllt, bleibt lokal) ----- */
      var pr = Z.lokal.profil;
      if (pr && pr.aktiv) {
        S.kapitel(++nr, "Investor-Kurzprofil");
        S.tabelle([{ b: 55 }, { b: S.innen - 55 }], [["Name", pr.name || "–"], ["Bestehende Objekte", pr.objekte || "–"], ["Mieteinnahmen gesamt", pr.mieteinnahmen || "–"], ["Hausbank", pr.bank || "–"], ["Notiz", pr.notiz || "–"]]);
        S.absatz("Diese Angaben wurden nur auf dem Gerät des Nutzers gespeichert und nie an eine KI oder Datenbank übertragen.", { gr: 8.5, farbe: FARBE.grau });
      }

      /* ----- Kapitel Annahmen und Hinweise ----- */
      S.kapitel(++nr, "Annahmen und Hinweise");
      S.h2("Bank-Annahmen");
      S.tabelle([{ b: S.innen - 70 }, { b: 35, rechts: true }, { b: 35, rechts: true }], Object.keys(IFP.ANNAHMEN_STANDARD).map(function (k) {
        var d = IFP.ANNAHMEN_STANDARD[k], f = function (val) { return d.einheit === "%" ? proz(val, 1) : d.einheit === "€" ? euro(val, 0) : zahl(val, 1); };
        var eigen = IFP.istZahl(Z.einstellungen.annahmen[k]) && Z.einstellungen.annahmen[k] !== d.wert;
        return [d.label + (eigen ? " (eigene Einstellung)" : ""), f(a[k]), f(d.wert)];
      }), { kopf: ["Annahme", "verwendet", "Standard"], gr: 8.5 });
      S.h2("Datenquellen");
      var q = ["Grunderwerbsteuer: " + IFP.GREST.quelle + ", Stand " + IFP.GREST.stand + "."];
      var ref = IFP.REFERENZEN[o.ort];
      if (ref) { q.push("Kaufpreis-Referenz " + o.ort + ": " + euro(ref.kaufpreisM2.wert, 0) + "/m², " + ref.kaufpreisM2.quelle + " (" + ref.kaufpreisM2.stand + "). " + ref.kaufpreisM2.hinweis); q.push("Mietreferenz " + o.ort + ": " + euro(ref.mieteM2.wert) + "/m², " + ref.mieteM2.quelle + " (" + ref.mieteM2.stand + ")."); }
      q.push("Rechenregeln: Formel-Spezifikation " + IFP.SPEZ + ". Alle Werte rechnet die App selbst, die KI rechnet nie.");
      S.liste(q, { gr: 9 });
      S.h2("Hinweise");
      S.liste([
        "Diese Präsentation ist keine Finanz-, Steuer- oder Rechtsberatung und keine Darlehensvermittlung. Sie ersetzt keine Prüfung durch die Bank.",
        "Alle Berechnungen beruhen auf den Angaben des Nutzers und vereinfachten Modellannahmen. Keine Gewähr für Richtigkeit oder Bankzusagen.",
        "Mit KI ausgelesene Angaben wurden vom Nutzer geprüft und bestätigt; Werte mit dem Vermerk „Annahme“ sind geschätzt.",
        "Erstellt am " + heute + " mit Immo Finanz Pilot " + IFP.VERSION + " (Prototyp)." + (entwurf ? " Status: ENTWURF." : "")
      ], { gr: 9 });
      S.h2("Impressum");
      S.absatz("Immo Finanz GmbH (in Gründung) · Werrabronner Straße 8 · 76229 Karlsruhe", { gr: 9 });

      /* ----- Kopf, Fuß, Wasserzeichen auf allen Seiten ----- */
      var n = doc.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        doc.setPage(i);
        if (i > 1) {
          hausLogo(doc, R, 9, 0.7); S.schrift(8, true); S.farbe(FARBE.text); doc.text("Immo Finanz Pilot", R + 9, 13.5);
          S.schrift(8); S.farbe(FARBE.grau); doc.text(t(titel).slice(0, 70), R + S.innen, 13.5, { align: "right" });
          doc.setDrawColor.apply(doc, FARBE.gold); doc.setLineWidth(0.4); doc.line(R, 16, R + S.innen, 16);
        }
        doc.setDrawColor.apply(doc, FARBE.linie); doc.setLineWidth(0.2); doc.line(R, 285, R + S.innen, 285);
        S.schrift(7.5); S.farbe(FARBE.grau);
        doc.text(t("Objekt-Präsentation für die Bank · erstellt am " + heute + " · keine Finanzberatung" + (entwurf ? " · ENTWURF" : "")), R, 290);
        doc.text("Seite " + i + " von " + n, R + S.innen, 290, { align: "right" });
        if (entwurf) {
          doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.1 }));
          S.schrift(80, true); S.farbe(FARBE.gold); doc.text("ENTWURF", 105, 175, { align: "center", angle: 35 });
          doc.restoreGraphicsState();
        }
      }
      S.farbe(FARBE.text);
      var datei = "Objekt-Praesentation_" + t(o.ort || "Objekt").replace(/[^A-Za-z0-9ÄÖÜäöüß-]+/g, "-") + "_" + new Date().toISOString().slice(0, 10) + (entwurf ? "_Entwurf" : "") + ".pdf";
      doc.save(datei);
      return { datei: datei, seiten: n, entwurf: entwurf };
    });
  }

  IFP.pdf = { erstellen: erstellen, _text: t };
})();
