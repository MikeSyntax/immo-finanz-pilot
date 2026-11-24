/* Immo Finanz Pilot – Exposé-Text: lokale PDF-Umwandlung (pdf.js, lokal eingebunden) und lokaler Fundstellen-Abgleich.
   Der Exposé-Text bleibt nur im Arbeitsspeicher dieser Sitzung und wird nicht gespeichert. */
(function () {
  "use strict";
  var IFP = window.IFP;
  IFP.sitzung = IFP.sitzung || { exposeSeiten: null, exposeName: null };
  IFP.MARKER_BEISPIEL = "FIKTIVES EXPOSÉ FÜR NUTZERTESTS (Immo Finanz Pilot)";
  IFP.DEMO_E3_SEITEN = ["BEISPIEL – FIKTIVES EXPOSÉ FÜR NUTZERTESTS (Immo Finanz Pilot). Kein echtes Angebot, alles erfunden.   Seite 1 / 3 \nBEISPIEL · FIKTIV \nMUSTERMANN IMMOBILIEN (FIKTIV) · LEIPZIG-CONNEWITZ \nVermietete Altbauwohnung mit Balkon \nIdeal für Kapitalanleger – 2 Zimmer, 58,4 m², 3. OG \nBeispielweg 12 · 04277 Leipzig (Adresse frei erfunden) \n139.000 € \nKAUFPREIS \n58,4 m² \nWOHNFLÄCHE \n465 € \nKALTMIETE / MONAT \n1912 \nBAUJAHR \nDie Wohnung \nDie gepflegte Zwei-Zimmer-Wohnung liegt im 3. Obergeschoss eines Gründerzeithauses mit\nsieben Wohneinheiten. Das Haus wurde 1997 umfassend saniert (Dach, Fenster, Leitungen, Bäder).\nDie Wohnung ist seit März 2021 an eine Einzelperson vermietet. Die aktuelle Nettokaltmiete beträgt\n465 € im Monat, das entspricht einer Jahresnettokaltmiete von 5.580 €.\nZur Wohnung gehören ein Südbalkon zum Hof, ein Kellerabteil und eine Einbauküche (Eigentum\ndes Mieters). Straßenbahn, Supermarkt und der Auwald sind fußläufig erreichbar. \nPreisübersicht \nKaufpreis   139.000 € \nKaufpreis pro m²   2.380 €/m² \nKäuferprovision   3,57 % inkl. MwSt. \nStellplatz   nicht vorhanden ", "BEISPIEL – FIKTIVES EXPOSÉ FÜR NUTZERTESTS (Immo Finanz Pilot). Kein echtes Angebot, alles erfunden.   Seite 2 / 3 \nBEISPIEL · FIKTIV \nObjektdaten im Überblick \nObjektart   Etagenwohnung \nLage   3. OG, Vorderhaus \nZimmer   2 \nWohnfläche   ca. 58,4 m² \nBaujahr   1912 \nSanierung   1997 (Kernsanierung) \nZustand   gepflegt \nHeizung   Zentralheizung, Gas \nEnergieausweis   Verbrauchsausweis \nEndenergieverbrauch   142 kWh/(m²·a) \nKaufpreis   193.000 € \nVermietet seit   03/2021 \nLaufende Kosten & Mieteinnahmen \nNettokaltmiete   465 € / Monat \nJahresnettokaltmiete   5.580 € \nHausgeld gesamt   215 € / Monat \ndavon umlagefähig   142 € / Monat \ndavon Instandhaltungsrücklage   38 € / Monat \nRücklage der WEG (gesamt)   ca. 61.000 € \nGrundsteuer   auf Mieter umgelegt \nAlle Angaben beruhen auf Informationen der Eigentümer und sind ohne Gewähr (fiktives Beispiel). ", "BEISPIEL – FIKTIVES EXPOSÉ FÜR NUTZERTESTS (Immo Finanz Pilot). Kein echtes Angebot, alles erfunden.   Seite 3 / 3 \nBEISPIEL · FIKTIV \nLage & Umfeld \nConnewitz liegt im Süden von Leipzig und ist bei Studierenden, jungen Familien und Berufstätigen\ngleichermaßen beliebt. Die Innenstadt erreicht man mit der Straßenbahn in etwa 12 Minuten.\nEntfernungen (ca.):\n• Straßenbahnhaltestelle: 200 m\n• Supermarkt: 350 m\n• Grundschule: 600 m\n• Leipziger Innenstadt: 4 km \nKontakt \nMustermann Immobilien (fiktiv) · Ansprechpartnerin: Erika Beispiel (fiktiv)\nTelefon und E-Mail bewusst weggelassen – dies ist ein Testdokument. "];

  /* Text vergleichbar machen: Unicode vereinheitlichen, Leerraum zusammenfassen, Anführungszeichen/Striche angleichen */
  function norm(s) {
    return String(s || "").normalize("NFC").replace(/[\u00A0\u2009\u202F]/g, " ").replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/[„“”"]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
  }
  /* Sucht ein Zitat in den Seiten. Ergebnis: { gefunden, seite } */
  IFP.fundstelleSuchen = function (zitat, seiten) {
    if (!zitat || !seiten) return { gefunden: false, seite: null };
    var z = norm(zitat);
    for (var i = 0; i < seiten.length; i++) if (norm(seiten[i]).indexOf(z) >= 0) return { gefunden: true, seite: i + 1 };
    return { gefunden: false, seite: null };
  };

  /* PDF lokal in Text umwandeln. fortschritt(seite, gesamt) */
  IFP.pdfZuText = function (datei, fortschritt) {
    if (!window.pdfjsLib) return Promise.reject(new Error("PDF-Bibliothek nicht geladen."));
    if (datei.size > 10 * 1024 * 1024) return Promise.reject(Object.assign(new Error("Die Datei ist größer als 10 MB."), { art: "gross" }));
    if (datei.type && datei.type !== "application/pdf") return Promise.reject(Object.assign(new Error("Das ist keine PDF-Datei."), { art: "typ" }));
    pdfjsLib.GlobalWorkerOptions.workerSrc = "lib/pdfjs/pdf.worker.min.js";
    return datei.arrayBuffer().then(function (buf) {
      // isEvalSupported: false = Sicherheitseinstellung (keine Ausführung von Code aus PDF-Schriften)
      return pdfjsLib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
    }).then(function (doc) {
      var seiten = [], n = doc.numPages;
      var kette = Promise.resolve();
      for (var i = 1; i <= n; i++) (function (nr) {
        kette = kette.then(function () { return doc.getPage(nr); }).then(function (p) { return p.getTextContent(); }).then(function (tc) {
          seiten.push(tc.items.map(function (x) { return x.str + (x.hasEOL ? "\n" : " "); }).join(""));
          if (fortschritt) fortschritt(nr, n);
        });
      })(i);
      return kette.then(function () {
        var zeichen = seiten.join("").replace(/\s/g, "").length;
        if (zeichen < 150) throw Object.assign(new Error("Im PDF wurde kaum Text gefunden – vermutlich ein eingescanntes Dokument."), { art: "scan" });
        return seiten;
      });
    }).catch(function (e) {
      if (e && e.name === "PasswordException") throw Object.assign(new Error("Das PDF ist passwortgeschützt."), { art: "passwort" });
      if (e && e.name === "InvalidPDFException") throw Object.assign(new Error("Die Datei ist beschädigt oder kein gültiges PDF."), { art: "kaputt" });
      throw e;
    });
  };
  IFP.istBeispielExpose = function (seiten) { return !!seiten && norm(seiten.join(" ")).indexOf(norm(IFP.MARKER_BEISPIEL)) >= 0; };
})();
/* pdf.js erst bei Bedarf laden (spart Datenvolumen beim App-Start) */
(function () {
  var IFP = window.IFP, laden = null;
  function skript(src) { return new Promise(function (ok, nein) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function () { nein(new Error("PDF-Bibliothek konnte nicht geladen werden.")); }; document.head.appendChild(s); }); }
  IFP.ladePdfJs = function () {
    if (window.pdfjsLib && window.pdfjsWorker) return Promise.resolve();
    // Der "Worker" wird als normales Skript geladen; pdf.js arbeitet dann ohne Hintergrundprozess – funktioniert auch beim Öffnen per Doppelklick (file://).
    laden = laden || skript("lib/pdfjs/pdf.min.js").then(function () { return skript("lib/pdfjs/pdf.worker.min.js"); });
    return laden;
  };
})();
