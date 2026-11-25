/* Immo Finanz Pilot – Oberfläche, Navigation und Bildschirme (Gerüst, Phase 2)
   Jede Seite ist eine Funktion, die HTML liefert. Aktionen laufen über data-aktion-Attribute. */
(function () {
  "use strict";
  var IFP = window.IFP, Z = IFP.zustand;

  /* ---------- Formatierung (App und später PDF nutzen dieselben Funktionen) ---------- */
  var nf = function (d) { return new Intl.NumberFormat("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  function minus(t) { return t.replace(/^-/, "−"); }
  function euro(x, d) { if (!IFP.istZahl(x)) return "–"; return minus(nf(d === undefined ? 2 : d).format(x)) + " €"; }
  function proz(x, d) { if (!IFP.istZahl(x)) return "–"; return minus(nf(d === undefined ? 2 : d).format(x * 100)) + " %"; }
  function zahl(x, d) { if (!IFP.istZahl(x)) return "–"; return minus(nf(d === undefined ? 2 : d).format(x)); }
  function esc(s) { return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  IFP.format = { euro: euro, proz: proz, zahl: zahl };

  var AMPEL = {
    gruen: ["✓", "gut"], gelb: ["!", "prüfen"], rot: ["✕", "kritisch"],
    unvollstaendig: ["?", "unvollständig"], nichtbewertet: ["–", "nicht bewertet"]
  };
  function ampel(status, zusatz) { var a = AMPEL[status] || AMPEL.unvollstaendig; return '<span class="ampel ' + status + '"><span class="sym" aria-hidden="true">' + a[0] + "</span>" + a[1] + (zusatz ? " " + esc(zusatz) : "") + "</span>"; }
  function info(begriff) { return '<button class="icon-btn" style="min-width:44px;min-height:44px;font-size:1rem" data-aktion="glossar" data-begriff="' + esc(begriff) + '" aria-label="Erklärung: ' + esc(begriff) + '">ⓘ</button>'; }

  /* ---------- Routen ---------- */
  var FLOW = ["import", "pruefen", "luecken", "finanzierung", "auswertung", "praesentation"];
  var FLOW_NAMEN = ["Import", "Prüfen", "Lücken", "Finanzierung", "Auswertung", "Bank"];
  var SEITEN = {
    start: { titel: "Immo Finanz Pilot", nav: "pruefen" },
    onboarding: { titel: "Willkommen", nav: "pruefen" },
    einwilligung: { titel: "KI-Auslesen: deine Zustimmung", nav: "pruefen" },
    import: { titel: "Exposé erfassen", nav: "pruefen", zurueck: "start" },
    pruefen: { titel: "Werte prüfen", nav: "pruefen", zurueck: "import" },
    luecken: { titel: "Lücken- & Unterlagen-Check", nav: "pruefen", zurueck: "pruefen" },
    finanzierung: { titel: "Finanzierung", nav: "pruefen", zurueck: "luecken" },
    auswertung: { titel: "Auswertung", nav: "pruefen", zurueck: "finanzierung" },
    bank: { titel: "So rechnet die Bank", nav: "pruefen", zurueck: "auswertung" },
    entwicklung: { titel: "10-Jahres-Entwicklung", nav: "pruefen", zurueck: "auswertung" },
    praesentation: { titel: "Objekt-Präsentation für die Bank", nav: "pruefen", zurueck: "auswertung" },
    markt: { titel: "Marktvergleich", nav: "pruefen", zurueck: "auswertung" },
    unterlagen: { titel: "Unterlagen-Übersicht", nav: "unterlagen" },
    objekte: { titel: "Meine Objekte", nav: "objekte" },
    einstellungen: { titel: "Bank-Annahmen & Einstellungen", nav: "mehr" },
    haushalt: { titel: "Haushalt & Kurzprofil (nur lokal)", nav: "mehr" },
    transparenz: { titel: "Über diesen Prototyp & Transparenz", nav: "mehr" },
    daten: { titel: "Meine Daten", nav: "mehr" },
    mehr: { titel: "Mehr", nav: "mehr" },
    hilfe: { titel: "Hilfe & Begriffe", nav: "mehr" }
  };
  var aktiveKennzahl = "DSCR", gewaehltesFeld = null, onboardingSchritt = 0, importAnsicht = "pdf";

  function route() { var h = (location.hash || "").replace("#", ""); return SEITEN[h] ? h : (Z.einstellungen.onboardingGesehen ? "start" : "onboarding"); }
  function gehe(r) { if (location.hash === "#" + r) render(); else location.hash = r; }
  IFP.gehe = gehe;

  /* ---------- Rahmen ---------- */
  function rahmen(r, inhalt) {
    var s = SEITEN[r];
    document.title = s.titel + " · Immo Finanz Pilot";
    var navs = [["pruefen", "start", "⌂", "Objekt prüfen"], ["objekte", "objekte", "▤", "Meine Objekte"], ["unterlagen", "unterlagen", "☑", "Unterlagen"], ["mehr", "mehr", "≡", "Mehr"]];
    var seitenNav = [["start", "⌂ Objekt prüfen", "pruefen"], ["objekte", "▤ Meine Objekte", "objekte"], ["unterlagen", "☑ Unterlagen", "unterlagen"], ["einstellungen", "⚙ Bank-Annahmen", "x-einst"], ["haushalt", "⌂ Haushalt & Profil", "x-haus"], ["transparenz", "ℹ Über die App", "x-tr"], ["daten", "⇩ Meine Daten", "x-daten"]];
    document.getElementById("seitenleiste-nav").innerHTML = seitenNav.map(function (n) {
      var aktiv = (n[2] === s.nav && n[2] !== "mehr") || n[0] === r;
      return '<a href="#' + n[0] + '"' + (aktiv ? ' aria-current="page"' : "") + ">" + n[1] + "</a>";
    }).join("");
    document.getElementById("tabbar").innerHTML = navs.map(function (n) {
      return '<a href="#' + n[1] + '"' + (s.nav === n[0] ? ' aria-current="page"' : "") + '><span class="ico" aria-hidden="true">' + n[2] + "</span>" + n[3] + "</a>";
    }).join("");
    document.getElementById("kopf-titel").textContent = s.titel;
    var zb = document.getElementById("zurueck");
    zb.hidden = !s.zurueck; zb.onclick = function () { gehe(s.zurueck); };
    var idx = FLOW.indexOf(r === "bank" || r === "entwicklung" || r === "markt" ? "auswertung" : r);
    var st = document.getElementById("stepper");
    if (idx >= 0) {
      st.hidden = false;
      st.innerHTML = '<div class="zeile"><span>Schritt ' + (idx + 1) + " von 6 · <b>" + FLOW_NAMEN[idx] + "</b></span><span>" + esc(Z.objekt.adresse || Z.objekt.ort || "") + "</span></div>" +
        '<ol aria-label="Fortschritt">' + FLOW.map(function (f, i) { return '<li class="' + (i < idx ? "fertig" : i === idx ? "aktuell" : "") + '"' + (i === idx ? ' aria-current="step"' : "") + '><span class="sr-only">' + FLOW_NAMEN[i] + "</span></li>"; }).join("") + "</ol>" +
        '<div class="namen" aria-hidden="true">' + FLOW_NAMEN.map(function (n, i) { return '<span class="' + (i === idx ? "aktuell" : "") + '">' + (i + 1) + " " + n + "</span>"; }).join("") + "</div>";
    } else st.hidden = true;
    document.getElementById("demo-banner").hidden = !Z.einstellungen.demoModus;
    var main = document.getElementById("inhalt");
    main.innerHTML = inhalt;
    main.focus({ preventScroll: true });
  }

  /* ---------- Seiten ---------- */
  var V = {};

  V.onboarding = function () {
    var karten = [
      ["🏠", "Was die App macht", "Du gibst ein Exposé ein. Die KI liest die Angaben aus, du prüfst sie. Danach rechnet die App mit offenen Formeln, wie eine Bank rechnet, und erstellt eine Objekt-Präsentation für deine Bank."],
      ["⚖", "Was sie nicht ist", "Keine Finanzberatung. Keine Darlehensvermittlung. Die App verkauft nichts und verdient nicht an deiner Finanzierung. Die KI rechnet nie – alle Zahlen kommen aus sichtbaren Formeln."],
      ["🔒", "Welche Daten wohin gehen", "Nur der Exposé-Text geht – nach deiner Zustimmung – an Make und den KI-Dienst. Einkommen, Haushalt und dein Profil bleiben auf deinem Gerät. Du kannst alles auch ohne KI und mit dem Beispiel-Exposé testen."]
    ];
    var k = karten[onboardingSchritt];
    return '<div class="karte onboarding-karte"><div class="gross" aria-hidden="true">' + k[0] + "</div><h2>" + k[1] + "</h2><p>" + k[2] + '</p>' +
      '<div class="punkte" aria-label="Schritt ' + (onboardingSchritt + 1) + ' von 3">' + [0, 1, 2].map(function (i) { return '<span class="' + (i === onboardingSchritt ? "an" : "") + '"></span>'; }).join("") + "</div>" +
      '<div class="btn-reihe" style="justify-content:center">' + (onboardingSchritt < 2 ? '<button class="btn primaer" data-aktion="ob-weiter">Weiter</button>' : '<button class="btn primaer" data-aktion="ob-fertig">Los geht\'s</button>') +
      '<button class="btn" data-aktion="ob-fertig">Überspringen</button></div><p class="klein zweit" style="margin-top:1rem">Später jederzeit unter „Hilfe“ wieder aufrufbar.</p></div>';
  };

  V.start = function () {
    var hatEntwurf = Z.objekt.quelle;
    return (hatEntwurf ? '<div class="hinweis"><b>Angefangenes Objekt:</b> ' + esc(Z.objekt.adresse || Z.objekt.ort || "ohne Namen") + ' <button class="btn link" data-aktion="weiter-entwurf">Weitermachen</button> <button class="btn link" data-aktion="neu">Neu beginnen</button></div>' : "") +
      "<h2>Objekt prüfen</h2><p>Wie möchtest du starten?</p>" +
      '<div class="start-optionen">' +
      '<button class="start-option empfohlen" data-aktion="start-beispiel"><b>Mit Beispiel-Exposé testen</b><span class="klein">Fiktive Wohnung in Leipzig – ohne eigenen Upload. Empfohlen zum Kennenlernen.</span></button>' +
      '<button class="start-option" data-aktion="start-eigenes"><b>Eigenes Exposé (PDF oder Text)</b><span class="klein">Die KI liest die Angaben aus, du prüfst sie.</span></button>' +
      '<button class="start-option" data-aktion="start-manuell"><b>Ohne KI – Werte selbst eingeben</b><span class="klein">Alle Funktionen außer dem Auslesen.</span></button></div>' +
      '<div class="karte flach" style="margin-top:1.5rem"><h3>Unabhängig vom Exposé</h3><p class="klein">Die vollständige Liste aller Unterlagen für Kauf und Finanzierung findest du jederzeit unter <a href="#unterlagen">Unterlagen</a>.</p>' +
      '<p class="klein zweit">Vermittelt nichts · verkauft nichts · KI rechnet nie · keine Finanzberatung. <a href="#transparenz">Wie die App funktioniert</a></p></div>';
  };

  V.einwilligung = function () {
    return '<div class="karte"><h2>Bevor die KI dein Exposé liest</h2>' +
      "<p>Zum Auslesen schickt die App <b>nur den Text des Exposés</b> an den Automatisierungsdienst <b>Make</b> und von dort an den KI-Dienst <b>Google Gemini</b>. Einkommen, Haushalt und Profil werden nie gesendet.</p>" +
      '<div class="hinweis warnung"><b>Bitte vorher schwärzen:</b> Namen von Mietern oder Verkäufern, Telefonnummern, E-Mail-Adressen und Vertragsdaten. Das Beispiel-Exposé enthält nur erfundene Angaben.</div>' +
      '<div class="hinweis"><b>Was mit den Daten passiert:</b> Die genauen Speicher- und Nutzungsregeln des KI-Dienstes werden vor der Live-Anbindung geprüft und hier eingetragen. Geplant ist der <b>bezahlte Gemini-Tarif</b>, bei dem Eingaben nicht zum Training genutzt werden. Speicherdauer bei Make und Google: <b>wird vor der Live-Anbindung geprüft und hier eingetragen.</b> Die App speichert den Exposé-Text nicht; nur kurze Belegstellen (max. ca. 120 Zeichen) werden mit dem Objekt gespeichert, wenn du es unter „Meine Objekte“ ablegst.</div>' +
      '<p class="klein zweit">Du kannst die App ohne Zustimmung vollständig mit manueller Eingabe nutzen. Die Zustimmung kannst du unter „Meine Daten“ widerrufen.</p>' +
      '<div class="btn-reihe"><button class="btn primaer" data-aktion="ki-ja">Zustimmen und auslesen</button><button class="btn" data-aktion="ki-nein">Ablehnen – selbst eingeben</button></div>' +
      '<p class="klein"><a href="#transparenz">Datenfluss im Detail</a></p></div>';
  };

  var importZustand = { phase: "auswahl", fehler: null, fortschritt: 0, seitenAnzahl: 0 };
  V.import = function () {
    var sz = IFP.sitzung, iz = importZustand;
    var tabs = '<div role="tablist" class="btn-reihe" style="margin-top:0">' +
      '<button class="btn' + (importAnsicht === "pdf" ? " primaer" : "") + '" role="tab" aria-selected="' + (importAnsicht === "pdf") + '" data-aktion="import-ansicht" data-wert="pdf">PDF hochladen</button>' +
      '<button class="btn' + (importAnsicht === "text" ? " primaer" : "") + '" role="tab" aria-selected="' + (importAnsicht === "text") + '" data-aktion="import-ansicht" data-wert="text">Text einfügen</button></div>';
    var schwaerzen = '<div class="hinweis warnung klein"><b>Datenschutz:</b> Entferne vor dem Auslesen Namen von Mietern oder Verkäufern, Telefonnummern, E-Mail-Adressen und Vertragsdaten. Den Text, der gesendet würde, kannst du unten bearbeiten.</div>';
    if (iz.phase === "lesen") return '<div class="karte"><h2>PDF wird auf deinem Gerät gelesen …</h2><p aria-live="polite">Seite ' + iz.fortschritt + " von " + (iz.seitenAnzahl || "?") + '</p><div class="fortschritt"><div style="width:' + (iz.seitenAnzahl ? iz.fortschritt / iz.seitenAnzahl * 100 : 10) + '%"></div></div><p class="klein zweit">Dabei wird nichts gesendet.</p></div>';
    if (iz.phase === "bereit" && sz.exposeSeiten) {
      var beispiel = IFP.istBeispielExpose(sz.exposeSeiten);
      return '<div class="karte"><div class="objekt-zeile"><h2 style="flex:1;margin:0">Text bereit</h2>' + (beispiel ? '<span class="badge demo">Beispiel-Exposé erkannt</span>' : "") + "</div>" +
        '<p class="klein">' + esc(sz.exposeName || "Eingefügter Text") + " · " + sz.exposeSeiten.length + " Seite(n) · " + zahl(sz.exposeSeiten.join("").length, 0) + " Zeichen. Der Text bleibt nur in dieser Sitzung und wird nicht gespeichert.</p>" + schwaerzen +
        '<div class="feld"><label for="exp-bearbeiten">Dieser Text würde an Make und den KI-Dienst gesendet</label><textarea id="exp-bearbeiten" data-bereich="exptext" style="min-height:220px">' + esc(sz.exposeSeiten.map(function (t, i) { return "[Seite " + (i + 1) + "]\n" + t.trim(); }).join("\n\n")) + "</textarea></div>" +
        '<div class="btn-reihe"><button class="btn primaer" data-aktion="auslesen">Auslesen</button><button class="btn" data-aktion="import-neu">Anderes Exposé</button><button class="btn link" data-aktion="start-manuell-text">Ohne KI selbst eingeben</button></div>' +
        (beispiel ? '<p class="klein zweit">Für das Beispiel-Exposé nutzt die App eine vorbereitete Demo-Antwort. Jede Fundstelle wird trotzdem auf deinem Gerät gegen diesen Text geprüft.</p>' : "") + "</div>";
    }
    var fehler = iz.fehler ? '<div class="hinweis fehler" role="alert"><b>Das hat nicht geklappt:</b> ' + esc(iz.fehler) + '<div class="btn-reihe"><button class="btn" data-aktion="import-neu">Nochmal versuchen</button>' + (/eingescannt/.test(iz.fehler) ? '<button class="btn" data-aktion="import-ansicht" data-wert="text">Text stattdessen einfügen</button>' : "") + '<button class="btn link" data-aktion="start-manuell">Selbst eingeben</button></div></div>' : "";
    return fehler + '<div class="karte">' + tabs +
      (importAnsicht === "pdf"
        ? '<div class="feld" style="margin-top:1rem"><label for="pdf-datei">Exposé als PDF (bis 10 MB)</label><input id="pdf-datei" type="file" accept="application/pdf,.pdf" data-aktion="pdf-gewaehlt"><div class="hilfe">Das PDF wird auf deinem Gerät in Text umgewandelt. Erst wenn du „Auslesen“ tippst, wird der Text gesendet.</div></div>'
        : '<div class="feld" style="margin-top:1rem"><label for="exp-text">Exposé-Text</label><textarea id="exp-text" placeholder="Text aus dem Exposé hier einfügen …"></textarea></div><button class="btn primaer" data-aktion="text-uebernehmen">Text übernehmen</button>') +
      "</div>" + '<div class="karte flach"><h3>Kein eigenes Exposé zur Hand?</h3><div class="btn-reihe" style="margin-top:.5rem"><button class="btn" data-aktion="start-beispiel">Beispiel-Exposé nutzen</button><a class="btn link" href="daten/Beispiel-Expose_Leipzig_FIKTIV.pdf" download>Beispiel-PDF herunterladen</a><button class="btn link" data-aktion="start-manuell">Selbst eingeben</button></div></div>';
  };

  function feldWertText(d, f) {
    if (f.unsicher && !f.geklaert && f.kandidaten) return f.kandidaten.map(function (k) { return euro(k.wert, 0); }).join(" oder ") + "?";
    if (d.id === "ORT") return esc((Z.objekt.ort || "–") + (Z.objekt.bundesland ? " · " + Z.objekt.bundesland : ""));
    if (f.zustand === "leer") return f.herkunft === "ki" ? "nicht im Exposé gefunden – kein Schätzwert" : "noch leer";
    if (f.zustand === "null") return "0 (bestätigt)";
    if (d.text) return esc(f.wert);
    if (d.prozent) return proz(f.wert);
    if (d.ganz) return String(f.wert) + (f.zusatz ? " · " + esc(f.zusatz) : "");
    if (d.einheit === "m²") return zahl(f.wert, 1) + " m²";
    if (d.id === "ZI") return zahl(f.wert, 1);
    return euro(f.wert, d.einheit.indexOf("€") === 0 ? 2 : 2) + (d.einheit.indexOf("Monat") > 0 ? " / Monat" : "");
  }
  function feldBadges(d, f) {
    var b = [];
    if (f.herkunft === "ki" && !(f.unsicher && !f.geklaert) && f.zustand !== "leer") b.push('<span class="badge ki">KI</span>');
    if (f.unsicher && !f.geklaert) b.push('<span class="badge unsicher">unsicher</span>');
    if (f.zustand === "leer") b.push('<span class="badge fehlt">fehlt</span>');
    if (f.zustand === "annahme") b.push('<span class="badge annahme">Annahme</span>');
    if (f.herkunft === "korrigiert") b.push('<span class="badge korrigiert">manuell korrigiert</span>');
    if (f.herkunft === "manuell" && f.zustand !== "leer") b.push('<span class="badge korrigiert">selbst eingegeben</span>');
    if (f.abgeleitet) b.push('<span class="badge unsicher">abgeleitet</span>');
    if (f.fundstelleGeprueft === false) b.push('<span class="badge unsicher">Fundstelle nicht nachweisbar</span>');
    return b.join(" ");
  }
  function offeneUnsichere() {
    var o = Z.objekt, n = 0;
    IFP.FELDER.forEach(function (d) { var f = o.felder[d.id]; if (f.unsicher && !f.geklaert) n++; });
    if (o.bundeslandAbgeleitet) n++;
    return n;
  }

  function feldDetail(id) {
    var d = IFP.FELDER.filter(function (x) { return x.id === id; })[0], f = Z.objekt.felder[id];
    if (!d) return '<div class="karte flach"><p>Wähle links ein Feld, um Fundstelle und Korrektur zu sehen.</p></div>';
    var h = '<div class="karte"><div class="objekt-zeile"><h3 style="margin:0;flex:1">' + (f.kandidaten ? "Fundstelle: " : "") + esc(d.label) + "</h3>" + feldBadges(d, f) + "</div>";
    if (d.id === "ORT") {
      h += '<div class="feld" style="margin-top:.75rem"><label for="f-ort">Ort</label><input id="f-ort" type="text" value="' + esc(Z.objekt.ort) + '"></div>' +
        '<div class="feld"><label for="f-bl">Bundesland (bestimmt die Grunderwerbsteuer)</label><select id="f-bl"><option value="">– bitte wählen –</option>' +
        IFP.GREST.laender.map(function (l) { return "<option" + (Z.objekt.bundesland === l[0] ? " selected" : "") + ">" + l[0] + "</option>"; }).join("") + "</select>" +
        (Z.objekt.bundeslandAbgeleitet ? '<div class="hilfe">Von der KI aus dem Ort abgeleitet – bitte bestätigen.</div>' : "") + "</div>" +
        '<button class="btn primaer" data-aktion="ort-uebernehmen">Übernehmen</button></div>';
      return h;
    }
    if (f.kandidaten && f.unsicher && !f.geklaert) {
      h += '<p class="klein">' + esc(f.grund || "Mehrere Werte gefunden.") + "</p>";
      f.kandidaten.forEach(function (k) { h += '<div class="zitat"><div class="klein zweit">Seite ' + k.seite + " · " + esc(k.ort) + (k.geprueft ? ' · <span style="color:var(--gruen)">✓ im Exposé-Text gefunden</span>' : k.geprueft === false ? " · <b>nicht im Text gefunden</b>" : "") + "</div>„" + esc(k.zitat).replace(esc(zahl(k.wert, 0)), "<mark>" + esc(zahl(k.wert, 0)) + "</mark>") + "“</div>"; });
      if (f.pruefung) h += '<div class="hinweis klein"><b>Prüfung der App:</b> ' + esc(f.pruefung) + ". Bitte im Exposé prüfen oder beim Makler nachfragen.</div>";
      h += '<fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Wert wählen</legend>' + f.kandidaten.map(function (k, i) {
        return '<label class="option"><input type="radio" name="kand" value="' + i + '">' + euro(k.wert, 0) + " (Seite " + k.seite + ")</label>"; }).join("") +
        '<label class="option"><input type="radio" name="kand" value="eigen">Anderen Wert eingeben</label></fieldset>' +
        '<div class="feld"><label for="f-eigen" class="sr-only">Anderer Wert</label><input id="f-eigen" type="number" inputmode="decimal" placeholder="eigener Wert"></div>' +
        '<button class="btn primaer" data-aktion="kandidat-uebernehmen" data-feld="' + id + '">Wert übernehmen</button></div>';
      return h;
    }
    if (f.fundstelle) h += '<div class="zitat"><div class="klein zweit">Seite ' + f.fundstelle.seite + " · " + esc(f.fundstelle.ort) + (f.fundstelleGeprueft ? ' · <span style="color:var(--gruen)">✓ im Exposé-Text gefunden</span>' : f.fundstelleGeprueft === false ? ' · <b>nicht im Text gefunden – bitte prüfen</b>' : "") + "</div>„" + esc(f.fundstelle.zitat) + "“</div>";

    if (f.hinweis) h += '<div class="hinweis warnung klein">' + esc(f.hinweis) + "</div>";
    var vorschlag = annahmeVorschlag(id);
    if (vorschlag !== null) h += '<button class="btn" data-aktion="annahme-vorschlag" data-feld="' + id + '" data-wert="' + vorschlag + '">' + euro(vorschlag) + ' als Annahme übernehmen</button>';
    var anzeige = f.wert === null ? "" : (d.prozent ? zahl(f.wert * 100, 2) : String(f.wert).replace(".", ","));
    h += '<div class="feld" style="margin-top:.75rem"><label for="f-wert">' + esc(d.label) + (d.einheit ? " (" + esc(d.einheit) + ")" : "") + "</label>" +
      '<input id="f-wert" type="' + (d.text ? "text" : "text") + '" inputmode="' + (d.text ? "text" : "decimal") + '" value="' + esc(anzeige) + '"></div>' +
      '<div class="btn-reihe"><button class="btn primaer" data-aktion="feld-speichern" data-feld="' + id + '">Übernehmen</button>' +
      (d.text ? "" : '<button class="btn" data-aktion="feld-annahme" data-feld="' + id + '">Als Annahme eintragen</button>') +
      (d.nullErlaubt || id === "HG_nu" ? '<button class="btn" data-aktion="feld-null" data-feld="' + id + '">0 bestätigen</button>' : "") +
      '<button class="btn link" data-aktion="feld-leeren" data-feld="' + id + '">Leeren</button></div>' +
      '<p class="klein zweit">„Annahme“ = bewusst geschätzt. Abhängige Ampeln bleiben dann grau, bis der Wert belegt ist.</p></div>';
    return h;
  }

  /* Rechnerischer Vorschlag für fehlendes nicht umlagefähiges Hausgeld – nur als Annahme, nie stillschweigend */
  function annahmeVorschlag(id) {
    var f = Z.objekt.felder;
    if (id !== "HG_nu" || f.HG_nu.zustand !== "leer") return null;
    if (f.HG.zustand === "wert" && f.HG_um.zustand === "wert" && IFP.istZahl(f.HG.wert) && IFP.istZahl(f.HG_um.wert)) return Math.round((f.HG.wert - f.HG_um.wert) * 100) / 100;
    return null;
  }
  function exposeTextBox() {
    var sz = IFP.sitzung; if (!sz.exposeSeiten) return "";
    return '<details class="gruppe" style="margin-top:1rem"><summary>Exposé-Text ansehen (nur in dieser Sitzung)</summary><div class="posten"><pre class="rechenweg" style="max-height:320px;overflow:auto">' + esc(sz.exposeSeiten.map(function (t, i) { return "[Seite " + (i + 1) + "]\n" + t.trim(); }).join("\n\n")) + "</pre></div></details>";
  }
  V.pruefen = function () {
    var o = Z.objekt, kern = IFP.FELDER.filter(function (d) { return d.kern; }), weitere = IFP.FELDER.filter(function (d) { return !d.kern; });
    var unsicher = offeneUnsichere(), fehlt = kern.filter(function (d) { return d.id !== "ORT" && o.felder[d.id].zustand === "leer"; }).length;
    if (!gewaehltesFeld) { var u = kern.filter(function (d) { return o.felder[d.id].unsicher && !o.felder[d.id].geklaert; })[0]; gewaehltesFeld = u ? u.id : "KP"; }
    var liste = function (arr) { return arr.map(function (d) {
      var f = o.felder[d.id];
      var cls = (f.unsicher && !f.geklaert) || (d.id === "ORT" && o.bundeslandAbgeleitet) ? " unsicher" : (f.zustand === "leer" && d.id !== "ORT" ? " fehlt" : "");
      return '<button class="pfeld' + cls + '" data-aktion="feld-waehlen" data-feld="' + d.id + '" aria-pressed="' + (gewaehltesFeld === d.id) + '"><span><span class="k">' + esc(d.label) + " " + feldBadges(d, f) + (d.id === "ORT" && o.bundeslandAbgeleitet ? '<span class="badge unsicher">bitte bestätigen</span>' : "") + '</span><span class="v">' + feldWertText(d, f) + '</span></span><span class="pfeil" aria-hidden="true">›</span></button>';
    }).join(""); };
    var kopf = '<div class="objekt-zeile"><h2 style="flex:1;margin:0">Werte prüfen</h2>' + (o.quelle === "demo" ? '<span class="badge demo">Demo-Antwort, keine echte KI</span>' : "") + "</div>" +
      '<p class="klein">' + kern.length + " Kernfelder · <b>" + unsicher + " unsicher</b> · <b>" + fehlt + ' fehlen</b> · <span class="badge ki">KI</span> = von der KI ausgelesen, bitte prüfen</p>';
    var links = kopf + liste(kern) + '<details class="gruppe"><summary>Weitere Angaben (' + weitere.length + "): Warmmiete, Zimmer, Energieausweis …</summary><div class=\"posten\">" + liste(weitere) + "</div></details>" +
      "";
    var gesperrt = unsicher > 0;
    var aktion = '<div class="btn-reihe"><button class="btn primaer breit" data-aktion="bestaetigen"' + (gesperrt ? ' aria-disabled="true"' : "") + ">" +
      (gesperrt ? "Werte bestätigen – " + unsicher + (unsicher === 1 ? " unsicherer Wert offen" : " unsichere Werte offen") : (o.bestaetigt ? "Bestätigt – weiter zum Lücken-Check" : "Werte bestätigen")) + "</button></div>" +
      (gesperrt ? '<p class="klein zweit">Tippe auf den gelb markierten Wert und kläre ihn. Erst dann kann gerechnet werden.</p>' : "");
    return '<div class="mit-panel drei"><section>' + links + '</section><aside class="panel immer" id="detail" aria-label="Fundstelle und Korrektur">' + feldDetail(gewaehltesFeld) + exposeTextBox() + '</aside><div class="aktionen">' + aktion + "</div></div>";
  };

  function offeneLuecken() {
    var o = Z.objekt, s = o.unterlagen;
    var angaben = IFP.FELDER.filter(function (d) { return d.kern && d.id !== "ORT" && (o.felder[d.id].zustand === "leer" || o.felder[d.id].zustand === "annahme"); });
    var fehlt = [], erwaehnt = [], optional = [];
    IFP.UNTERLAGEN.forEach(function (g) { if (!g.ki) return; g.posten.forEach(function (p) {
      var st = s[p.id] || "fehlt"; if (st === "fehlt") (p.optional ? optional : fehlt).push(p); else if (st === "erwaehnt") erwaehnt.push(p); }); });
    return { angaben: angaben, fehlt: fehlt, erwaehnt: erwaehnt, optional: optional };
  }
  function lueckenText() {
    var o = Z.objekt, l = offeneLuecken(), t = "Offene Punkte zum Objekt " + (o.adresse || o.ort || "") + "\n";
    if (l.angaben.length) t += "\nFehlende Angaben:\n" + l.angaben.map(function (d) { return "- " + (/^davon/.test(d.label) ? "Hausgeld – " : "") + d.label + (o.felder[d.id].zustand === "annahme" ? " (bisher nur geschätzt)" : ""); }).join("\n") + "\n";
    if (l.erwaehnt.length) t += "\nIm Exposé erwähnt, aber nicht beigefügt – bitte zusenden:\n" + l.erwaehnt.map(function (p) { return "- " + p.name; }).join("\n") + "\n";
    if (l.fehlt.length) t += "\nBitte zusenden:\n" + l.fehlt.map(function (p) { return "- " + p.name + " (" + p.wer + ")"; }).join("\n") + "\n";
    if (l.optional.length) t += "\nFalls zutreffend:\n" + l.optional.map(function (p) { return "- " + p.name; }).join("\n") + "\n";
    return t;
  }

  V.luecken = function () {
    var o = Z.objekt, l = offeneLuecken(), n = { enthalten: 0, liegtvor: 0 };
    IFP.UNTERLAGEN.forEach(function (g) { if (!g.ki) return; g.posten.forEach(function (p) { var st = o.unterlagen[p.id] || "fehlt"; if (n[st] !== undefined) n[st]++; }); });
    var w = (o.warnungen || []).map(function (x) {
      var f = x.feld && o.felder[x.feld], d = x.feld && IFP.FELDER.filter(function (q) { return q.id === x.feld; })[0];
      var geklaert = f && f.zustand === "wert" && (!f.kandidaten || f.geklaert);
      return '<div class="hinweis warnung"><b>Achtung: Das bewertet die Bank evtl. anders – ' + esc(x.titel) + '</b><div class="zitat">„' + esc(x.zitat) + "“</div><span class=\"klein\">" + esc(x.erklaerung) + "</span>" +
        (geklaert ? '<p class="klein" style="margin:.5rem 0 0"><b>Von dir geklärt:</b> ' + esc(d.label) + " = " + (d.id === "KP" ? euro(f.wert, 0) : feldWertText(d, f)) + ". Lass dir den Wert vor dem Bankgespräch schriftlich bestätigen.</p>" : "") + "</div>";
    }).join("");
    var kopf = '<div class="karte"><h3>Kurz zusammengefasst</h3><p class="klein" style="margin:0">' +
      "<b>" + l.angaben.length + "</b> fehlende Angabe" + (l.angaben.length === 1 ? "" : "n") + " · <b>" + (l.fehlt.length + l.erwaehnt.length) + "</b> Unterlagen anfordern (davon " + l.erwaehnt.length + " im Exposé erwähnt) · " +
      l.optional.length + " nur falls zutreffend · " + n.enthalten + " im Exposé enthalten · " + n.liegtvor + " von dir abgehakt</p>" +
      '<details class="gruppe" style="margin-top:.75rem"><summary>Liste zum Kopieren (für Makler oder Verwaltung)</summary><div class="posten">' +
      '<label for="luecken-text" class="klein zweit">Ohne KI erstellt, du kannst den Text vor dem Kopieren ändern.</label><textarea id="luecken-text" rows="10" style="width:100%;font:inherit">' + esc(lueckenText()) + "</textarea>" +
      '<div class="btn-reihe"><button class="btn" data-aktion="luecken-kopieren">Text kopieren</button></div></div></details></div>';
    var angabenHTML = l.angaben.length ? '<div class="karte"><h3>Fehlende oder nur angenommene Angaben</h3><ul>' + l.angaben.map(function (d) {
        var f = o.felder[d.id]; return "<li><b>" + esc(d.label) + "</b> – " + (f.zustand === "annahme" ? "als Annahme eingetragen (" + feldWertText(d, f) + ")" : "fehlt") +
          ' <button class="btn link" data-aktion="feld-oeffnen" data-feld="' + d.id + '">' + (f.zustand === "annahme" ? "ändern" : "eintragen") + "</button></li>"; }).join("") +
        '</ul><p class="klein">Die App setzt dafür keinen Standardwert ein. Betroffene Ampeln bleiben grau, bis die Angabe belegt ist.</p></div>' : "";
    return "<h2>Was fehlt noch?</h2>" + w + kopf + angabenHTML + unterlagenListe(true) +
      '<div class="btn-reihe"><button class="btn primaer" data-aktion="gehe" data-ziel="finanzierung">Weiter zur Finanzierung</button></div>';
  };

  function unterlagenListe(mitStatus) {
    var s = Z.objekt.unterlagen, fs = Z.objekt.fundstellenUnterlagen || {};
    var txt = { enthalten: "im Exposé enthalten", erwaehnt: "erwähnt, nicht beigefügt", fehlt: "fehlt", liegtvor: "liegt vor (von dir bestätigt)" };
    return IFP.UNTERLAGEN.map(function (g, gi) {
      var nG = g.posten.filter(function (p) { return !p.optional; }).length, dG = g.posten.filter(function (p) { return !p.optional && s[p.id] === "liegtvor"; }).length;
      return '<details class="gruppe"' + (gi < 2 || !mitStatus ? " open" : "") + "><summary>" + g.gruppe + " · " + esc(g.titel) + ' <span class="klein zweit">(' + dG + "/" + nG + " liegen vor)</span>" + (g.ki ? "" : ' <span class="badge korrigiert">geht nicht an die KI</span>') + '</summary><div class="posten">' +
        g.posten.map(function (p) {
          var st = s[p.id] || "fehlt";
          return '<div class="posten-zeile"><label class="checkzeile"><input type="checkbox" data-aktion="unterlage" data-id="' + p.id + '"' + (st === "liegtvor" ? " checked" : "") + '><span><b>' + esc(p.name) + "</b>" +
            (p.optional && st === "fehlt" ? ' <span class="status">falls zutreffend</span>' : "") + (mitStatus && g.ki && !(p.optional && st === "fehlt") ? ' <span class="status ' + st + '">' + txt[st] + "</span>" : (st === "liegtvor" ? ' <span class="status liegtvor">' + txt.liegtvor + "</span>" : "")) +
            '<br><span class="klein zweit">Wofür: ' + esc(p.wofuer) + " · Wer liefert: " + esc(p.wer) + "</span>" +
            (fs[p.id] && mitStatus ? '<span class="zitat klein" style="display:block">„' + esc(fs[p.id]) + "“</span>" : "") + "</span></label></div>";
        }).join("") + "</div></details>";
    }).join("");
  }
  V.unterlagen = function () {
    var st = Z.objekt.unterlagen || {}, ges = 0, da = 0;
    IFP.UNTERLAGEN.forEach(function (g) { g.posten.forEach(function (p) { if (p.optional) return; ges++; if (st[p.id] === "liegtvor") da++; }); });
    var pz = ges ? Math.round(da / ges * 100) : 0;
    return "<h2>Alle Unterlagen für Kauf und Finanzierung</h2><p>Diese Übersicht gilt für jedes Objekt – auch ohne Exposé. Erhaltene Unterlagen kannst du abhaken; der Stand wird mit dem Objekt gespeichert.</p>" +
      '<div class="karte flach"><div class="objekt-zeile"><b style="flex:1">' + da + " von " + ges + ' Unterlagen liegen vor</b><span class="klein zweit">ohne „falls zutreffend“</span></div>' +
      '<div class="fortschritt" role="progressbar" aria-valuemin="0" aria-valuemax="' + ges + '" aria-valuenow="' + da + '" aria-label="Unterlagen vorhanden"><span style="width:' + pz + '%"></span></div>' +
      '<p class="klein zweit" style="margin:.5rem 0 0">Gruppe E (persönliche Unterlagen) brauchst du nur für die Bank – sie gehen nie an die KI.</p></div>' + unterlagenListe(false);
  };

  function eingabeFeld(id, label, wert, einheit, hilfe, fehler, bereich) {
    var anzeige = wert === null || wert === undefined ? "" : (einheit === "%" ? zahl(wert * 100, 2).replace(/\./g, "") : String(wert).replace(".", ","));
    return '<div class="feld"><label for="in-' + id + '">' + label + '</label><div class="eingabe-einheit"><input id="in-' + id + '" type="text" inputmode="decimal" data-bereich="' + (bereich || "fin") + '" data-feld="' + id + '" data-einheit="' + einheit + '" value="' + esc(anzeige) + '"' + (fehler ? ' aria-invalid="true" aria-describedby="err-' + id + '"' : "") + "><span>" + einheit + "</span></div>" +
      (fehler ? '<div class="fehler" id="err-' + id + '">' + esc(fehler) + "</div>" : "") + (hilfe ? '<div class="hilfe">' + hilfe + "</div>" : "") + "</div>";
  }

  function heroHTML(erg) {
    var w = erg.werte;
    if (!IFP.istZahl(w.R)) return '<div class="hero"><p class="satz">Noch kein Ergebnis: Es fehlen bestätigte Angaben zu Kaufpreis, Bundesland, Maklerprovision oder Finanzierung (Eigenkapital, Zins, Tilgung, Zinsbindung).</p></div>';
    var satz = "Für <b>" + euro(w.D, 0) + "</b> Darlehen zahlst du <b>" + euro(w.R) + "</b> im Monat. " +
      (IFP.istZahl(w.CF) ? (w.CF >= 0 ? "Nach Miete und Kosten bleiben <b>" + euro(w.CF) + "</b> im Monat übrig." : "Nach Miete und Kosten legst du <b>" + euro(-w.CF) + "</b> im Monat drauf.") : "Für den Cashflow fehlen noch Angaben.");
    return '<div class="hero" aria-live="polite"><p class="satz">' + satz + '</p><div class="grosse-zahlen">' +
      "<div>Darlehen<b>" + euro(w.D, 0) + "</b></div><div>Monatsrate<b>" + euro(w.R) + "</b></div>" +
      "<div>Cashflow / Monat<b>" + euro(w.CF) + "</b></div><div>Zinsen in der Zinsbindung<b>" + euro(w.Z_ZB, 0) + "</b></div>" +
      "<div>Restschuld nach " + zahl(Z.objekt.finanzierung.ZB, 0) + " J. Zinsbindung<b>" + euro(w.RS_ZB, 0) + "</b></div><div>Laufzeit (gleicher Zins)<b>" + (w.volltilgung ? zahl(w.laufzeitJahre, 1) + " Jahre" : "keine Volltilgung") + "</b></div></div></div>";
  }

  /* Rechenweg als Tabelle: Zeilen [Zeichen, Text, Betrag, fett?] – Beträge rechtsbündig, auch auf dem Handy lesbar */
  function rechenTabelle(zeilen, titel) {
    return '<table class="rw-tab"><caption class="sr-only">' + esc(titel) + "</caption><tbody>" + zeilen.map(function (z) {
      if (z === "-") return '<tr class="trenn"><td colspan="3"></td></tr>';
      return "<tr" + (z[3] ? ' class="summe"' : "") + '><td class="op" aria-hidden="true">' + esc(z[0]) + "</td><th scope=\"row\">" + z[1] + "</th><td>" + esc(z[2]) + "</td></tr>";
    }).join("") + "</tbody></table>";
  }
  function fehltText(x) {
    var f = [];
    if (!IFP.istZahl(x.e.KM)) f.push("Kaltmiete");
    if (!IFP.istZahl(x.e.HG_nu)) f.push("nicht umlagefähiges Hausgeld");
    return f;
  }

  V.finanzierung = function () {
    var fin = Z.objekt.finanzierung, x = IFP.eingaben(), erg = IFP.ergebnis(), w = erg.werte, p = IFP.plausibel(x.e);
    var a = IFP.annahmenFlach(Z.einstellungen.annahmen);
    if (IFP.istZahl(fin.EK) && IFP.istZahl(w.GI) && fin.EK > w.GI) p.EK = "Eigenkapital ist höher als die Gesamtinvestition – bitte prüfen.";
    var hgAnnahme = Z.objekt.felder.HG_nu && Z.objekt.felder.HG_nu.zustand === "annahme";
    var ekHilfe = "Bankpraxis: mindestens die Nebenkosten aus Eigenkapital.";
    if (IFP.istZahl(w.KNK)) ekHilfe = "Nebenkosten bei diesem Objekt: <b>" + euro(w.KNK, 0) + "</b>. " + (IFP.istZahl(fin.EK) ? (fin.EK >= w.KNK ? "Dein Eigenkapital deckt sie, " + euro(fin.EK - w.KNK, 0) + " fließen zusätzlich in den Kaufpreis." : "Dein Eigenkapital deckt sie <b>nicht</b>, es fehlen " + euro(w.KNK - fin.EK, 0) + ". Viele Banken finanzieren Nebenkosten ungern mit.") : "Bankpraxis: mindestens diese Summe aus Eigenkapital.");
    var kap = IFP.istZahl(w.KNK) ? rechenTabelle([
      ["", "Grunderwerbsteuer " + proz(x.e.GrESt, 1), euro(w.KNK_teile.grest)], ["+", "Notar & Grundbuch " + proz(a.NOT, 1) + ' <span class="badge annahme">Annahme</span>', euro(w.KNK_teile.notar)],
      ["+", "Makler " + proz(x.e.MAK), euro(w.KNK_teile.makler)], ["=", "Kaufnebenkosten", euro(w.KNK), true], "-",
      ["", "Kaufpreis", euro(x.e.KP)], ["+", "Kaufnebenkosten", euro(w.KNK)],
      ["+", "Renovierung", IFP.istZahl(fin.REN) ? euro(w.REN) : "keine angegeben"], ["=", "Gesamtinvestition", euro(w.GI), true]].concat(
      IFP.istZahl(fin.EK) ? [["−", "Eigenkapital", euro(fin.EK)], ["=", "Darlehen", euro(w.D), true]] : []), "Rechenweg Kapitalbedarf")
      : '<p class="klein">Kaufpreis, Bundesland und Maklerprovision müssen bestätigt sein.</p>';
    var hgLabel = "nicht umlagef. Hausgeld" + (hgAnnahme ? ' <span class="badge annahme">Annahme</span>' : "");
    var mon = IFP.istZahl(w.R) ? rechenTabelle([
      ["", "Kreditrate (Zins + Tilgung)", euro(w.R)], ["+", hgLabel, euro(x.e.HG_nu)], ["=", "Deine Belastung pro Monat", euro(w.GB), true], "-",
      ["", "Kaltmiete", euro(x.e.KM)], ["−", hgLabel, euro(x.e.HG_nu)], ["−", "Mietausfall " + proz(a.MAW, 0) + ' <span class="badge annahme">Annahme</span>', euro(IFP.istZahl(x.e.KM) ? x.e.KM * a.MAW : null)],
      ["−", "Kreditrate", euro(w.R)], ["=", "Cashflow vor Steuern", euro(w.CF), true]], "Rechenweg Monatsbelastung") : "";
    var anschluss = IFP.istZahl(w.RS_ZB) && w.RS_ZB > 0 && IFP.istZahl(w.R_neu) ? '<h3 style="margin-top:1rem">Nach der Zinsbindung (' + zahl(fin.ZB, 0) + " Jahre)</h3>" + rechenTabelle([
      ["", "Restschuld", euro(w.RS_ZB, 0)], ["", "Anschlusszins" + ' <span class="badge annahme">Stresstest +' + zahl(a.ZUSCHLAG_ANSCHLUSS * 100, 1) + " %</span>", proz(w.i_neu, 2)],
      ["=", "Neue Rate (gleiche Tilgung)", euro(w.R_neu), true]], "Anschlussfinanzierung") +
      '<p class="klein zweit">Banken fragen oft, ob du auch einen höheren Zins nach der Zinsbindung tragen kannst. Den Aufschlag stellst du unter Bank-Annahmen ein.</p>' : "";
    var form = '<div class="karte"><h3>Deine Finanzierung</h3><div class="raster-2">' +
      eingabeFeld("EK", "Eigenkapital", fin.EK, "€", ekHilfe, p.EK) +
      eingabeFeld("i", "Sollzins pro Jahr", fin.i, "%", "Aktuellen Zins bei deiner Bank oder einem Vergleichsportal erfragen.", p.i) +
      eingabeFeld("t", "Anfängliche Tilgung pro Jahr", fin.t, "%", "Üblich sind 2 bis 3 %. Höhere Tilgung = schneller schuldenfrei, aber höhere Rate.", p.t) +
      eingabeFeld("ZB", "Zinsbindung", fin.ZB, "Jahre", "So lange bleibt der Zins fest.", p.ZB) +
      eingabeFeld("REN", "Renovierungskosten (optional)", fin.REN, "€", "Leer = keine Renovierung eingeplant.") + "</div>" +
      '<details class="gruppe"><summary>Erweitert: Alter und Rente (freiwillig)</summary><div class="posten"><div class="raster-2">' +
      eingabeFeld("ALT", "Dein Alter heute", Z.lokal.alter.ALT, "Jahre", "Bleibt nur auf diesem Gerät.", null, "alter") +
      eingabeFeld("RENT", "Geplanter Rentenbeginn mit", Z.lokal.alter.RENT, "Jahren", "Für die Restschuld bei Rentenbeginn.", null, "alter") + "</div></div></details></div>";
    var fehlt = fehltText(x);
    var cfHinweis = IFP.istZahl(w.R) && !IFP.istZahl(w.CF) && fehlt.length ? '<div class="hinweis">Für den Cashflow fehlt noch: <b>' + fehlt.join(", ") + '</b>. <button class="btn link" data-aktion="feld-oeffnen" data-feld="' + (IFP.istZahl(x.e.KM) ? "HG_nu" : "KM") + '">Jetzt eintragen</button></div>' :
      (hgAnnahme && IFP.istZahl(w.CF) ? '<p class="klein zweit">Der Cashflow enthält eine Annahme (nicht umlagefähiges Hausgeld). Die Ampeln dazu bleiben grau, bis der Wert belegt ist.</p>' : "");
    var ergebnisKarte = heroHTML(erg) + cfHinweis + '<div class="karte flach"><h3>Rechenweg Kapitalbedarf</h3>' + kap +
      (mon ? '<h3 style="margin-top:1rem">Rechenweg Monatsbelastung</h3>' + mon : "") + anschluss + "</div>";
    return nichtBestaetigt() + '<div class="mit-panel drei"><section>' + form + '</section><aside class="panel immer">' + ergebnisKarte + '</aside><div class="aktionen">' +
      '<div class="btn-reihe"><button class="btn primaer" data-aktion="gehe" data-ziel="auswertung">Zur Auswertung</button><a class="btn" href="#haushalt">Haushalt ergänzen (freiwillig)</a></div>' +
      ergebnisleiste(erg) + "</div></div>";
  };

  function nichtBestaetigt() {
    return Z.objekt.bestaetigt ? "" : '<div class="hinweis warnung"><b>Werte noch nicht bestätigt.</b> Gerechnet wird nur mit bestätigten Angaben – unsichere Werte bleiben außen vor. <a href="#pruefen">Zur Prüfmaske</a></div>';
  }
  function ergebnisleiste(erg) {
    var w = erg.werte;
    return '<div class="ergebnisleiste nur-mobil" aria-live="polite"><span>Rate <b>' + euro(w.R) + "</b></span><span>Cashflow <b>" + euro(w.CF) + '</b></span><a href="#auswertung">Auswertung ›</a></div>';
  }

  /* Kennzahlen-Definitionen für Kacheln und "So rechnet die Bank" */
  function kennzahlen(erg) {
    var w = erg.werte, x = IFP.eingaben().e, a = IFP.annahmenFlach(Z.einstellungen.annahmen), amp = {};
    erg.ampeln.forEach(function (q) { amp[q.id] = q; });
    return [
      { id: "CF", titel: "Cashflow vor Steuern", wert: euro(w.CF), unter: "pro Monat", begriff: "Cashflow",
        formel: "Cashflow = Kaltmiete − nicht umlagef. Hausgeld − Mietausfall − Rate", zahlen: "= " + euro(x.KM) + " − " + euro(x.HG_nu) + " − " + euro(IFP.istZahl(x.KM) ? x.KM * a.MAW : null) + " − " + euro(w.R) + "\n= " + euro(w.CF) },
      { id: "DSCR", titel: "DSCR", wert: zahl(w.DSCR), unter: "Schuldendienstdeckung", begriff: "DSCR",
        formel: "DSCR = (Jahreskaltmiete − nicht umlagef. Hausgeld × 12) ÷ (Rate × 12)", zahlen: "= (" + euro(w.JKM) + " − " + euro(IFP.istZahl(x.HG_nu) ? x.HG_nu * 12 : null) + ") ÷ " + euro(IFP.istZahl(w.R) ? w.R * 12 : null) + "\n= " + zahl(w.DSCR) },
      { id: "LTV_BANK", titel: "Beleihungsauslauf", wert: proz(w.LTV_Bank, 1), unter: "Darlehen ÷ Beleihungswert", begriff: "Beleihungsauslauf",
        formel: "Beleihungswert = Kaufpreis × (1 − Sicherheitsabschlag)\nBeleihungsauslauf = Darlehen ÷ Beleihungswert", zahlen: "Beleihungswert = " + euro(x.KP) + " × (1 − " + proz(a.SA, 0) + ") = " + euro(w.BLW) + "\nBeleihungsauslauf = " + euro(w.D) + " ÷ " + euro(w.BLW) + " = " + proz(w.LTV_Bank) + "\nZum Vergleich – Markt-LTV (Darlehen ÷ Kaufpreis): " + proz(w.LTV_Markt) },
      { id: "MIETE_REF", titel: "Nötige Miete/m²", wert: euro(w.KM_noetig_m2), unter: "Ist " + euro(w.KM_m2) + " · Ziel " + proz(a.ZR, 0), begriff: "Nötige Miete/m²",
        formel: "Nötige Miete/m² = Kaufpreis × Zielrendite ÷ 12 ÷ Wohnfläche", zahlen: "= " + euro(x.KP) + " × " + proz(a.ZR, 0) + " ÷ 12 ÷ " + zahl(x.WFL, 1) + " m²\n= " + euro(w.KM_noetig_m2) + " (ortsübliche Miete: " + euro(x.RM_m2) + ")\nMaximaler Kaufpreis bei Ist-Miete = Jahreskaltmiete ÷ Zielrendite = " + euro(w.KP_max) },
      { id: "KPF", titel: "Kaufpreisfaktor", wert: zahl(w.KPF), unter: "Jahreskaltmieten", begriff: "Kaufpreisfaktor",
        formel: "Kaufpreisfaktor = Kaufpreis ÷ Jahreskaltmiete", zahlen: "= " + euro(x.KP) + " ÷ " + euro(w.JKM) + "\n= " + zahl(w.KPF) },
      { id: "BMR", titel: "Bruttomietrendite", wert: proz(w.BMR), unter: "Nettomietrendite " + proz(w.NMR), begriff: "Bruttomietrendite",
        formel: "Bruttomietrendite = Jahreskaltmiete ÷ Kaufpreis", zahlen: "= " + euro(w.JKM) + " ÷ " + euro(x.KP) + "\n= " + proz(w.BMR) },
      { id: "EK_KNK", titel: "Eigenkapital ≥ Nebenkosten", wert: euro(x.EK, 0), unter: "Nebenkosten " + euro(w.KNK, 0), begriff: "Kaufnebenkosten",
        formel: "Prüfung: Eigenkapital ≥ Kaufnebenkosten", zahlen: euro(x.EK) + " ≥ " + euro(w.KNK) + " → " + (amp.EK_KNK && amp.EK_KNK.status === "gruen" ? "ja" : "nein") },
      { id: "HUE", titel: "Haushaltsüberschuss", wert: euro(w.HUE), unter: "freiwillig, nur lokal", begriff: "Haushaltsüberschuss",
        formel: "Überschuss = Netto + Miete × Anrechnung − Lebenshaltung − Kredite − Wohnkosten − nicht umlagef. Hausgeld − Rate", zahlen: IFP.istZahl(w.HUE) ? "= " + euro(x.NE) + " + " + euro(x.KM) + " × " + proz(a.MA, 0) + " − " + euro(w.LHP) + " − " + euro(x.BR) + " − " + euro(x.WK) + " − " + euro(x.HG_nu) + " − " + euro(w.R) + "\n= " + euro(w.HUE) : "Haushaltsdaten nicht ausgefüllt (freiwillig, bleiben auf deinem Gerät)." },
      { id: "KP_REF", titel: "Kaufpreis/m² vs. Markt", wert: euro(w.KP_m2), unter: "Referenz " + euro(x.RP_m2), begriff: "Kaufpreisfaktor",
        formel: "Abweichung = Kaufpreis/m² ÷ Referenz − 1", zahlen: IFP.istZahl(x.RP_m2) ? "= " + euro(w.KP_m2) + " ÷ " + euro(x.RP_m2) + " − 1 = " + proz(w.KP_m2 / x.RP_m2 - 1, 1) : "Kein Referenzwert hinterlegt." },
      { id: "RS_RENTE", titel: "Restschuld bei Rente", wert: euro(w.RS_Rente, 0), unter: "freiwillig, nur lokal", begriff: "Restschuld",
        formel: "Restschuld nach (Rentenalter − Alter) × 12 Monaten", zahlen: IFP.istZahl(w.RS_Rente) ? "= " + euro(w.RS_Rente) : "Alter und Rentenbeginn nicht angegeben (freiwillig)." }
    ].map(function (k) { k.ampel = amp[k.id]; return k; });
  }
  function ampelZusatz(q) {
    if (!q) return "";
    if (q.status === "unvollstaendig") {
      var namen = q.fehlt.concat(q.annahmen).map(function (f) { var d = IFP.FELDER.filter(function (x) { return x.id === f; })[0]; return d ? (/^davon/.test(d.label) ? "Hausgeld – " : "") + d.label : ({ GrESt: "Bundesland", EK: "Eigenkapital", i: "Zins", t: "Tilgung", ZB: "Zinsbindung" }[f] || f); });
      return (q.wegenAnnahme ? "Annahme: " : "fehlt: ") + namen.join(", ");
    }
    if (q.status === "nichtbewertet") return q.text || "freiwillig – nicht ausgefüllt";
    return "";
  }
  function schwelleText(q) {
    var s = q.schwelle, std = IFP.SCHWELLEN_STANDARD[q.id];
    var f = function (v) { return s.einheit === "%" ? proz(v, 1) : s.einheit === "€" ? euro(v, 0) : zahl(v, 2); };
    if (s.richtung === "ja") return "gut, wenn das Eigenkapital mindestens die Nebenkosten deckt.";
    if (q.id === "HUE") return "gut ≥ 10 % vom Nettoeinkommen · prüfen 0–10 % · kritisch < 0 €";
    if (q.id === "RS_RENTE") return "gut = 0 € · prüfen ≤ 30 % des Darlehens · kritisch darüber";
    var t = s.richtung === "hoch" ? "gut ≥ " + f(s.gruen) + " · prüfen " + f(s.gelb) + "–" + f(s.gruen) + " · kritisch < " + f(s.gelb) : "gut ≤ " + f(s.gruen) + " · prüfen bis " + f(s.gelb) + " · kritisch > " + f(s.gelb);
    var eigen = std && (std.gruen !== s.gruen || std.gelb !== s.gelb);
    return t + (eigen ? ' <span class="badge annahme">eigene Einstellung</span><br><span class="zweit">Standard: ' + (s.richtung === "hoch" ? "gut ≥ " + f(std.gruen) + " · kritisch < " + f(std.gelb) : "gut ≤ " + f(std.gruen) + " · kritisch > " + f(std.gelb)) + "</span>" : "");
  }
  function kennzahlPanel(k) {
    var q = k.ampel;
    return '<div class="karte"><div class="objekt-zeile"><h3 style="flex:1;margin:0">So rechnet die Bank: ' + esc(k.titel) + "</h3>" + (q ? ampel(q.status) : "") + "</div>" +
      '<p class="klein"><b>' + esc(k.begriff) + ":</b> " + esc(IFP.GLOSSAR[k.begriff] || "") + "</p>" +
      '<pre class="rechenweg">' + esc(k.formel + "\n" + k.zahlen) + "</pre>" +
      (q && q.status === "unvollstaendig" ? '<p class="klein"><b>Warum grau?</b> ' + esc(ampelZusatz(q)) + "</p>" : "") +
      (q ? '<p class="klein"><b>Schwellen:</b> ' + schwelleText(q) + "</p>" : "") +
      '<div class="btn-reihe"><a class="btn link" href="#einstellungen">Schwellen ändern</a><button class="btn" data-aktion="erklaeren" data-id="' + k.id + '">Erklären <span class="badge ki">KI</span></button></div><div id="erkl-' + k.id + '" aria-live="polite"></div></div>';
  }

  /* Stellschrauben „Was müsste sich ändern?“ (03 v0.4, Formeln 36a–d) – gemeinsam für Auswertung und PDF */
  function stellschrauben(erg) {
    var w = erg.werte, ex = IFP.eingaben().e, hb = [], sw = IFP.schwellen();
    var auf = function (v, d) { var f = Math.pow(10, d); return Math.ceil(v * f - 1e-9) / f; }; // „mindestens“ → aufrunden
    if (IFP.istZahl(w.CF) && w.CF < 0) {
      if (IFP.istZahl(w.H_KM_CF0)) hb.push(["Kaltmiete für Cashflow 0 €", euro(auf(w.H_KM_CF0, 2)) + " statt " + euro(ex.KM)]);
      if (IFP.istZahl(w.H_EK_CF0)) hb.push(["oder mehr Eigenkapital für Cashflow 0 €", "+ " + euro(auf(w.H_EK_CF0, 0), 0)]);
    }
    if (IFP.istZahl(w.DSCR) && w.DSCR < sw.DSCR.gruen && IFP.istZahl(w.H_KM_DSCR)) hb.push(["Kaltmiete für DSCR " + zahl(sw.DSCR.gruen), euro(auf(w.H_KM_DSCR, 2))]);
    if (IFP.istZahl(w.H_EK_LTV) && w.H_EK_LTV > 0) hb.push(["Mehr Eigenkapital für Beleihungsauslauf ≤ " + proz(sw.LTV_BANK.gelb, 0), "+ " + euro(auf(w.H_EK_LTV, 0), 0)]);
    if (IFP.istZahl(w.KP_max) && IFP.istZahl(ex.KP) && w.KP_max < ex.KP) hb.push(["Kaufpreis für " + proz(IFP.annahmenFlach(Z.einstellungen.annahmen).ZR, 0) + " Zielrendite (Verhandlungsziel)", euro(w.KP_max, 0)]);
    return hb;
  }

  V.auswertung = function () {
    var erg = IFP.ergebnis(), ks = kennzahlen(erg), g = erg.gesamt, z = { gruen: 0, gelb: 0, rot: 0, unvollstaendig: 0 };
    erg.ampeln.forEach(function (q) { if (z[q.status] !== undefined) z[q.status]++; });
    var aktiv = ks.filter(function (k) { return k.id === aktiveKennzahl; })[0] || ks[1];
    var kachel = function (k) {
      var q = k.ampel, nb = q && q.status === "nichtbewertet";
      return '<button class="kachel' + (k.id === aktiv.id ? " aktiv" : "") + (nb ? " nb" : "") + '" data-aktion="kennzahl" data-id="' + k.id + '" aria-pressed="' + (k.id === aktiv.id) + '"><span class="t">' + esc(k.titel) + '<span aria-hidden="true">ⓘ</span></span><span class="z">' + k.wert + "</span>" + (q ? ampel(q.status) : "") + '<span class="u">' + esc(q && (q.status === "unvollstaendig" || nb) ? ampelZusatz(q) : k.unter) + "</span></button>";
    };
    var istPflicht = function (k) { var d = IFP.SCHWELLEN_STANDARD[k.id]; return d && d.art === "pflicht"; };
    var kacheln = '<h3 class="gruppen-titel">Das prüft die Bank <span class="klein zweit">(fließt ins Gesamturteil ein)</span></h3><div class="kacheln">' + ks.filter(istPflicht).map(kachel).join("") + "</div>" +
      '<h3 class="gruppen-titel">Zusätzlich für dich <span class="klein zweit">(Marktvergleich, freiwillige Angaben)</span></h3><div class="kacheln">' + ks.filter(function (k) { return !istPflicht(k); }).map(kachel).join("") + "</div>";
    var hb = stellschrauben(erg);
    var hebel = hb.length ? '<div class="karte"><h3>Was müsste sich ändern?</h3><p class="klein zweit">Jede Zeile für sich gerechnet, die anderen Werte bleiben gleich. Hilft beim Verhandeln und im Bankgespräch.</p>' +
      rechenTabelle(hb.map(function (h) { return ["", esc(h[0]), h[1]]; }), "Stellschrauben") +
      (Z.objekt.felder.HG_nu && Z.objekt.felder.HG_nu.zustand === "annahme" ? '<p class="klein"><span class="badge annahme">Annahme</span> Gerechnet mit dem geschätzten nicht umlagefähigen Hausgeld.</p>' : "") + "</div>" : "";
    var kopf = '<div class="objekt-zeile"><h2 style="flex:1;margin:0">Auswertung</h2><span class="klein zweit">Stand ' + new Date().toLocaleDateString("de-DE") + "</span></div>" +
      '<div class="karte flach"><div class="objekt-zeile"><b>Gesamt:</b> ' + ampel(g.status) + ' <span class="klein">' + g.gruen + " von " + g.bewertet + " bewerteten Prüfungen grün</span></div>" +
      (g.status === "unvollstaendig" ? '<p class="klein" style="margin-top:.5rem">Kein Gesamturteil, solange Pflichtprüfungen offen sind: ' + esc(g.offen.join(", ")) + ".</p>" : "") +
      '<div class="ampel-zusammen" style="margin-top:.5rem">' + ampel("rot", "(" + z.rot + ")") + ampel("gelb", "(" + z.gelb + ")") + ampel("gruen", "(" + z.gruen + ")") + ampel("unvollstaendig", "(" + z.unvollstaendig + ")") + "</div></div>";
    return nichtBestaetigt() + '<div class="mit-panel drei"><section>' + kopf + heroHTML(erg) + kacheln + hebel +
      '</section><aside class="panel immer" id="detail">' + kennzahlPanel(aktiv) + '</aside><div class="aktionen"><div class="btn-reihe"><a class="btn link" href="#bank">Alle Formeln: So rechnet die Bank</a><a class="btn link" href="#entwicklung">10-Jahres-Entwicklung</a><a class="btn link" href="#markt">Marktvergleich</a></div>' +
      '<div class="btn-reihe"><button class="btn" data-aktion="objekt-speichern">Objekt speichern</button><button class="btn primaer" data-aktion="gehe" data-ziel="praesentation">Präsentation für die Bank</button></div></div></div>';
  };

  V.bank = function () {
    var erg = IFP.ergebnis(), ks = kennzahlen(erg);
    var uebersicht = '<nav class="karte flach" aria-label="Kennzahlen im Überblick"><h3>Überblick</h3><ul class="chip-liste">' + ks.map(function (k) {
      return '<li><a href="#bank" data-aktion="springe" data-ziel="kz-' + k.id + '">' + esc(k.titel) + " " + (k.ampel ? ampel(k.ampel.status) : "") + "</a></li>"; }).join("") + "</ul></nav>";
    return "<h2>So rechnet die Bank</h2><p>Alle Kennzahlen mit Formel, deinen eingesetzten Zahlen und Schwellen. Grundlage: Formel-Spezifikation " + IFP.SPEZ + ".</p>" + uebersicht +
      ks.map(function (k) { return '<div id="kz-' + k.id + '" tabindex="-1">' + kennzahlPanel(k) + "</div>"; }).join("") + '<p class="klein zweit">Banken rechnen unterschiedlich. Die Werte sind Orientierung, keine Finanzberatung und keine Zusage einer Bank.</p>';
  };

  function diagramm(verlauf) {
    if (!verlauf) return "";
    var haupt = document.getElementById("inhalt") || document.querySelector("main");
    var W = Math.round(Math.min(760, Math.max(300, ((haupt && haupt.clientWidth) || 640) - 48))), H = W < 500 ? 240 : 300;
    var maxV = Math.max.apply(null, verlauf.map(function (z) { return Math.max(z.wert, z.restschuld); }));
    var minV = Math.min.apply(null, verlauf.map(function (z) { return Math.min(z.wert, z.restschuld); }));
    var roh = (maxV - minV) * 1.1 / 4, p10 = Math.pow(10, Math.floor(Math.log10(Math.max(roh, 1))));
    var schritt = [1, 2, 2.5, 5, 10].map(function (f) { return f * p10; }).filter(function (v) { return v >= roh; })[0];
    var lo = Math.max(0, Math.floor(minV / schritt) * schritt), hi = lo + schritt * 4;
    while (hi < maxV) hi += schritt;
    var ticks = []; for (var tv = lo; tv <= hi + 1e-6; tv += schritt) ticks.push(tv);
    var L = W < 500 ? 52 : 64, B = 28, T = 12, R = 12;
    var x = function (j) { return L + (j - 1) * (W - L - R) / 9; }, y = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
    var pkt = function (key) { return verlauf.map(function (z) { return x(z.jahr).toFixed(1) + " " + y(z[key]).toFixed(1); }); };
    var linie = function (key) { return "M" + pkt(key).join(" L"); };
    var flaeche = "M" + pkt("wert").join(" L") + " L" + pkt("restschuld").reverse().join(" L") + " Z";
    var achse = ticks.map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="var(--linie)"/><text x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="12" fill="var(--text-2)">' + zahl(v / 1000, 0) + " T€</text>"; }).join("");
    var jahre = verlauf.map(function (z) { return (W < 500 && [1, 3, 5, 7, 10].indexOf(z.jahr) < 0) ? "" : '<text x="' + x(z.jahr).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="12" fill="var(--text-2)">' + z.jahr + "</text>"; }).join("");
    var letzt = verlauf[verlauf.length - 1];
    return '<figure style="margin:0"><svg class="diagramm" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Diagramm: Prognosewert steigt von ' + euro(verlauf[0].wert, 0) + " auf " + euro(letzt.wert, 0) + ", Restschuld sinkt von " + euro(verlauf[0].restschuld, 0) + " auf " + euro(letzt.restschuld, 0) + '.">' + achse +
      '<path d="' + flaeche + '" fill="var(--gold)" fill-opacity=".12"/>' + jahre +
      '<path d="' + linie("wert") + '" fill="none" stroke="var(--gold)" stroke-width="3"/><path d="' + linie("restschuld") + '" fill="none" stroke="var(--text)" stroke-width="3" stroke-dasharray="6 4"/></svg>' +
      '<figcaption class="klein legende"><span><i class="leg-gold"></i>Prognosewert</span><span><i class="leg-strich"></i>Restschuld</span><span><i class="leg-flaeche"></i>Dein Anteil am Objekt (Wert − Restschuld)</span><span class="zweit">Jahre 1–10, Achse beginnt nicht bei 0</span></figcaption></figure>';
  }
  V.entwicklung = function () {
    var erg = IFP.ergebnis(), w = erg.werte, a = IFP.annahmenFlach(Z.einstellungen.annahmen);
    if (!w.verlauf) return '<div class="hinweis">Für die 10-Jahres-Entwicklung fehlen noch Angaben (Kaufpreis, Finanzierung). <a href="#finanzierung">Zur Finanzierung</a></div>';
    var b = w.bruecke, letzt = w.verlauf[w.verlauf.length - 1];
    var hgAnnahme = Z.objekt.felder.HG_nu && Z.objekt.felder.HG_nu.zustand === "annahme";
    var kopf = "<h2>10-Jahres-Entwicklung</h2>" + '<p class="klein"><span class="badge annahme">Prognose</span> Wertsteigerung ' + proz(a.WS, 1) + " und Mietsteigerung " + proz(a.MS, 1) + " pro Jahr, Hausgeld bleibt gleich" +
      (hgAnnahme ? ", nicht umlagefähiges Hausgeld ist geschätzt" : "") + '. Restschuld und Tilgung folgen aus dem Darlehen bei gleichem Zins. <a href="#einstellungen">Annahmen ändern</a></p>';
    var kpi = '<div class="hero"><div class="grosse-zahlen">' +
      "<div>Vermögenszuwachs nach 10 J.<b>" + euro(w.VZ_10, 0) + "</b></div><div>Restschuld nach 10 J.<b>" + euro(letzt.restschuld, 0) + "</b></div>" +
      "<div>Summe Cashflow 10 J.<b>" + euro(letzt.cfKum, 0) + "</b></div><div>Dein Anteil nach 10 J.<b>" + euro(letzt.wert - letzt.restschuld, 0) + "</b></div></div></div>";
    var tabelle = '<div class="karte"><h3>Jahr für Jahr</h3><p class="klein zweit nur-mobil">Tabelle seitlich wischen für alle Spalten.</p><div class="tabelle-wrap" tabindex="0" role="region" aria-label="Jahresverlauf, seitlich scrollbar"><table class="verlauf"><caption class="sr-only">Jahresverlauf</caption><thead><tr><th scope="col">Jahr</th><th class="zahl" scope="col">Jahresmiete (Prognose)</th><th class="zahl" scope="col">Restschuld</th><th class="zahl" scope="col">getilgt</th><th class="zahl" scope="col">Wert (Prognose)</th><th class="zahl" scope="col">Cashflow</th><th class="zahl" scope="col">kumuliert</th></tr></thead><tbody>' +
      w.verlauf.map(function (z) { return '<tr><th scope="row">' + z.jahr + '</th><td class="zahl">' + euro(z.miete, 0) + '</td><td class="zahl">' + euro(z.restschuld, 0) + '</td><td class="zahl">' + euro(z.getilgt, 0) + '</td><td class="zahl">' + euro(z.wert, 0) + '</td><td class="zahl">' + euro(z.cf, 0) + '</td><td class="zahl">' + euro(z.cfKum, 0) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
      '<p class="klein zweit">Auf volle Euro gerundet. Genaue Werte stehen in der Präsentation für die Bank.</p></div>';
    var bruecke = b ? '<div class="karte flach"><h3>Vermögensbrücke: Woraus setzt sich der Zuwachs zusammen?</h3>' + rechenTabelle([
      ["", "Wertsteigerung " + '<span class="badge annahme">Prognose</span>', euro(b.wert)], ["+", "Getilgter Kredit", euro(b.tilgung)], [b.cf < 0 ? "−" : "+", "Summe Cashflow 10 Jahre " + (b.cf < 0 ? "(Zuzahlung)" : ""), euro(Math.abs(b.cf))],
      ["−", "Kaufnebenkosten", euro(-b.nebenkosten)], ["−", "Renovierung", euro(-b.renovierung)], ["=", "Vermögenszuwachs", euro(w.VZ_10), true]], "Vermögensbrücke") +
      '<p class="klein zweit">Ohne Steuern. Steuerfreiheit des Verkaufsgewinns nach 10 Jahren (§ 23 EStG) nach heutigem Stand – keine Steuerberatung.</p></div>' : "";
    return kopf + kpi + '<div class="karte">' + diagramm(w.verlauf) + "</div>" + tabelle + bruecke;
  };

  V.markt = function () {
    var o = Z.objekt, ref = IFP.REFERENZEN[o.ort], w = IFP.ergebnis().werte;
    if (!ref) return "<h2>Marktvergleich</h2><div class=\"hinweis warnung\">Für „" + esc(o.ort || "diesen Ort") + "“ sind <b>keine Referenzwerte hinterlegt</b>. Du kannst eigene Werte mit Quelle eintragen.</div>" +
      '<div class="karte">' + eingabeFeld("refkp", "Referenz-Kaufpreis", o.refEigen ? o.refEigen.kp : null, "€/m²", null, null, "ref") + eingabeFeld("refmiete", "Ortsübliche Miete", o.refEigen ? o.refEigen.miete : null, "€/m²", null, null, "ref") +
      '<div class="feld"><label for="refquelle">Quelle und Stand</label><input id="refquelle" type="text" data-bereich="refq" value="' + esc(o.refEigen ? o.refEigen.quelle : "") + '" placeholder="z. B. Mietspiegel Mannheim 2025"></div></div>';
    var zeile = function (titel, ist, r, istFmt) { return '<div class="karte"><h3>' + titel + "</h3><p>Dieses Objekt: <b>" + istFmt + "</b> · Referenz: <b>" + euro(r.wert) + "/m²</b></p><p class=\"klein\">" + esc(r.text) + '<br><span class="zweit">Quelle: ' + esc(r.quelle) + " · " + esc(r.stand) + (r.hinweis ? " · " + esc(r.hinweis) : "") + "</span></p></div>"; };
    return "<h2>Marktvergleich " + esc(o.ort) + "</h2>" +
      zeile("Kaufpreis pro m²", w.KP_m2, ref.kaufpreisM2, euro(w.KP_m2) + "/m²") +
      zeile("Miete pro m² (Ist / nötig)", w.KM_m2, ref.mieteM2, euro(w.KM_m2) + " / " + euro(w.KM_noetig_m2)) +
      zeile("Angebotsmiete (nur Information)", null, ref.angebotsmieteM2, "–") +
      '<div class="hinweis ki"><b>KI-Einordnung</b> <span class="badge demo">noch nicht angebunden</span><br><span class="klein">Die KI ordnet später nur diese hinterlegten Werte ein und nennt Unsicherheiten. Sie erfindet keine Vergleichspreise.</span></div>';
  };

  /* Offene Punkte für die Präsentation (US-06 AK 1, E5): jede Ursache nur einmal */
  function offenePunkte() {
    var o = Z.objekt, fin = o.finanzierung, l = [];
    if (!o.bestaetigt) l.push({ text: "Werte in der Prüfmaske noch nicht bestätigt", aktion: "gehe", ziel: "pruefen" });
    IFP.FELDER.forEach(function (d) {
      if (!d.kern) return;
      var f = o.felder[d.id], lab = (/^davon/.test(d.label) ? "Hausgeld – " : "") + d.label;
      if (d.id === "ORT") { if (!o.ort || !o.bundesland) l.push({ text: "Ort / Bundesland fehlt", aktion: "feld-oeffnen", feld: "ORT" }); return; }
      if (f.unsicher && !f.geklaert) l.push({ text: lab + ": unsicherer Wert", aktion: "feld-oeffnen", feld: d.id });
      else if (f.zustand === "leer") l.push({ text: lab + " fehlt", aktion: "feld-oeffnen", feld: d.id });
      else if (f.zustand === "annahme") l.push({ text: lab + " ist nur geschätzt (Annahme)", aktion: "feld-oeffnen", feld: d.id });
    });
    [["EK", "Eigenkapital"], ["i", "Sollzins"], ["t", "Tilgung"], ["ZB", "Zinsbindung"]].forEach(function (q) { if (!IFP.istZahl(fin[q[0]])) l.push({ text: q[1] + " fehlt", aktion: "gehe", ziel: "finanzierung" }); });
    return l;
  }
  function vorschauSeite1(erg, entwurf) {
    var w = erg.werte, x = IFP.eingaben().e, o = Z.objekt, ks = kennzahlen(erg).filter(function (k) { var d = IFP.SCHWELLEN_STANDARD[k.id]; return d && d.art === "pflicht"; });
    return '<div class="seite-vorschau" aria-label="Vorschau Seite 1">' + (entwurf ? '<div class="entwurf-stempel" aria-hidden="true">Entwurf</div>' : "") +
      '<div class="sv-kopf"><img src="assets/logo-hell.svg" alt="Immo Finanz Pilot" onerror="this.style.display=\'none\'"><span>Objekt-Präsentation · Seite 1 von ca. 8</span></div>' +
      "<h3>" + esc(o.adresse || o.ort || "Objekt ohne Namen") + "</h3>" +
      '<p class="klein zweit">' + [x.WFL ? zahl(x.WFL, 1) + " m²" : "", o.felder.BJ && o.felder.BJ.wert ? "Baujahr " + o.felder.BJ.wert : "", o.bundesland || ""].filter(Boolean).join(" · ") + "</p>" +
      '<div class="sv-zahlen"><div>Kaufpreis<b>' + euro(x.KP, 0) + "</b></div><div>Darlehen<b>" + euro(w.D, 0) + "</b></div><div>Rate / Monat<b>" + euro(w.R) + "</b></div><div>Cashflow / Monat<b>" + euro(w.CF) + "</b></div></div>" +
      '<p style="margin:.5rem 0"><b>Gesamt:</b> ' + ampel(erg.gesamt.status) + ' <span class="klein">' + erg.gesamt.gruen + " von " + erg.gesamt.bewertet + " Prüfungen grün</span></p>" +
      '<ul class="sv-ampeln">' + ks.map(function (k) { return "<li><span>" + esc(k.titel) + "</span><span>" + k.wert + " " + (k.ampel ? ampel(k.ampel.status) : "") + "</span></li>"; }).join("") + "</ul>" +
      '<p class="klein zweit" style="margin-top:.5rem">Erstellt mit Immo Finanz Pilot am ' + new Date().toLocaleDateString("de-DE") + " · keine Finanzberatung · Grundlage: Formel-Spezifikation " + IFP.SPEZ + "</p></div>";
  }
  V.praesentation = function () {
    var erg = IFP.ergebnis(), o = Z.objekt, op = offenePunkte(), entwurf = op.length > 0 || erg.gesamt.status === "unvollstaendig";
    var profil = Z.lokal.profil.aktiv, hatAnnahme = IFP.FELDER.some(function (d) { return o.felder[d.id] && o.felder[d.id].zustand === "annahme"; });
    var st = function (ok, warn, txt) { return ok ? '<span class="badge ok">vollständig</span>' : '<span class="badge ' + (warn ? "annahme" : "fehlt") + '">' + esc(txt) + "</span>"; };
    var w = erg.werte, x = IFP.eingaben().e;
    var kap = [
      ["Kurzfassung auf einen Blick", st(!entwurf, true, "Entwurf")],
      ["Objekt-Steckbrief", st(IFP.istZahl(x.KP) && IFP.istZahl(x.WFL) && !!o.ort, false, "Angaben fehlen")],
      ["Kapitalbedarf und Finanzierung", st(IFP.istZahl(w.R), false, "Finanzierung fehlt")],
      ["Rentabilität", st(IFP.istZahl(w.CF) && !hatAnnahme, IFP.istZahl(w.CF), IFP.istZahl(w.CF) ? "mit Annahme" : "Angaben fehlen")],
      ["So rechnet die Bank (inkl. „Was müsste sich ändern?“)", st(erg.gesamt.status !== "unvollstaendig", true, "Ampeln teils grau")],
      ["Zehn-Jahres-Entwicklung", st(!!w.verlauf, true, "Prognose fehlt")],
      ["Unterlagen-Checkliste und offene Punkte", '<span class="badge ok">immer dabei</span>'],
      ["Investor-Kurzprofil", profil ? '<span class="badge ok">dabei (nur lokal)</span>' : '<span class="badge fehlt">entfällt – kein Profil</span>'],
      ["Annahmen und Hinweise", '<span class="badge ok">immer dabei</span>']
    ];
    var ki = o.kiTexte.zusammenfassung || { text: "", an: false, geprueft: false };
    var offenHTML = op.length ? '<div class="hinweis warnung"><b>' + op.length + (op.length === 1 ? " offener Punkt" : " offene Punkte") + ':</b> Die Präsentation wird als <b>„Entwurf“</b> gekennzeichnet, bis alles geklärt ist.<ul>' +
      op.map(function (p) { return "<li>" + esc(p.text) + ' <button class="btn link" data-aktion="' + p.aktion + '"' + (p.feld ? ' data-feld="' + p.feld + '"' : "") + (p.ziel ? ' data-ziel="' + p.ziel + '"' : "") + ">klären</button></li>"; }).join("") + "</ul></div>" :
      '<div class="hinweis ok"><b>Alle Pflichtangaben belegt.</b> Die Präsentation wird ohne „Entwurf“-Vermerk erstellt.</div>';
    var links = "<h2>Objekt-Präsentation für die Bank</h2><p>Immer dasselbe Schema, damit deine Bank jedes Objekt schnell erfasst. Das PDF wird auf deinem Gerät erzeugt, es wird nichts verschickt.</p>" + offenHTML +
      '<div class="karte"><h3>Inhalt: 9 Kapitel, voraussichtlich 6–8 Seiten</h3><ol class="kapitel">' + kap.map(function (k) { return "<li><span>" + esc(k[0]) + "</span>" + k[1] + "</li>"; }).join("") + "</ol>" +
      (profil ? "" : '<p class="klein"><a href="#haushalt">Kurzprofil ausfüllen (freiwillig, bleibt auf diesem Gerät)</a></p>') + "</div>" +
      '<div class="karte"><h3>Zusammenfassung für die Bank <span class="badge ki">KI-Vorschlag</span></h3>' +
      '<label class="checkzeile"><input type="checkbox" data-aktion="ki-text-an"' + (ki.an ? " checked" : "") + "><span>KI-Text in die Präsentation aufnehmen</span></label>" +
      '<div class="feld"><label for="ki-text">Text (bearbeitbar)</label><textarea id="ki-text" data-bereich="kitext">' + esc(ki.text) + "</textarea>" +
      '<div class="hilfe">Erscheint im PDF nur, wenn du ihn geprüft hast, mit dem Hinweis „KI-generiert, vom Nutzer geprüft“. Die Zahlen im Text prüft die App nicht – vergleiche sie mit der Vorschau.</div></div>' +
      '<label class="checkzeile"><input type="checkbox" data-aktion="ki-text-geprueft"' + (ki.geprueft ? " checked" : "") + "><span>Ich habe den Text geprüft</span></label>" +
      '<button class="btn" data-aktion="ki-text-vorschlag">Vorschlag erzeugen <span class="badge demo">Demo</span></button></div>';
    var rechts = '<h3 class="gruppen-titel" style="margin-top:0">Vorschau Seite 1</h3>' + vorschauSeite1(erg, entwurf);
    return '<div class="mit-panel drei"><section>' + links + '</section><aside class="panel immer">' + rechts + '</aside><div class="aktionen"><div class="btn-reihe"><button class="btn primaer" data-aktion="pdf">' + (entwurf ? "Entwurf als PDF erstellen" : "PDF erstellen") + '</button><button class="btn" data-aktion="objekt-speichern">Objekt speichern</button></div></div></div>';
  };

  IFP.ui = { kennzahlen: kennzahlen, offenePunkte: offenePunkte, stellschrauben: stellschrauben, feldWertText: feldWertText, schwelleText: schwelleText, ampelZusatz: ampelZusatz, lueckenText: lueckenText, euro: euro, zahl: zahl, proz: proz };

  function speicherOrt() { return IFP.objekte.modus === "supabase" ? "Supabase (Region EU, Frankfurt) mit pseudonymer Kennung" : "nur auf diesem Gerät"; }
  V.objekte = function () {
    return '<div class="hinweis klein">Speicherort: <b>' + speicherOrt() + "</b>. Gespeichert werden nur Objekt- und Finanzierungsdaten – keine Einkommens-, Haushalts-, Profil- oder Altersdaten, keine Fotos, kein Exposé-Text.</div>" +
      '<div id="objekt-liste" aria-live="polite"><div class="karte flach"><p>Objekte werden geladen …</p></div></div>';
  };
  V.objekte.nach = function () {
    IFP.objekte.liste().then(function (l) {
      var c = document.getElementById("objekt-liste"); if (!c) return;
      if (!l.length) { c.innerHTML = '<div class="karte flach" style="text-align:center"><h2>Noch keine Objekte</h2><p>Prüfe ein Objekt und tippe in der Auswertung auf „Objekt speichern“.</p><a class="btn primaer" href="#start">Objekt prüfen</a></div>'; return; }
      c.innerHTML = l.map(function (o) {
        return '<div class="karte"><div class="objekt-zeile"><div style="flex:1"><h3 style="margin:0">' + esc(o.titel) + '</h3><span class="klein zweit">' + euro(o.kp, 0) + " · gespeichert " + new Date(o.datum).toLocaleDateString("de-DE") + "</span></div>" + ampel(o.gesamt || "unvollstaendig") +
          '</div><p class="klein">' + (o.gruen || 0) + " von " + (o.bewertet || 0) + ' Prüfungen grün</p><div class="btn-reihe"><button class="btn primaer" data-aktion="objekt-oeffnen" data-id="' + esc(o.id) + '">Öffnen</button><button class="btn" data-aktion="objekt-loeschen" data-id="' + esc(o.id) + '">Löschen</button></div></div>';
      }).join("");
    }).catch(function (e) {
      var c = document.getElementById("objekt-liste"); if (!c) return;
      c.innerHTML = '<div class="hinweis fehler" role="alert"><b>„Meine Objekte“ konnten nicht geladen werden.</b><br>' + esc(e.message) + '<div class="btn-reihe"><button class="btn" data-aktion="neu-laden">Nochmal versuchen</button><a class="btn link" href="#daten">Verbindung prüfen</a></div></div>';
    });
  };

  V.einstellungen = function () {
    var a = Z.einstellungen.annahmen, s = Z.einstellungen.schwellen;
    var feld = function (k) {
      var d = IFP.ANNAHMEN_STANDARD[k], wert = IFP.istZahl(a[k]) ? a[k] : d.wert, eigen = IFP.istZahl(a[k]) && a[k] !== d.wert;
      var std = d.einheit === "%" ? proz(d.wert, 1) : d.einheit === "€" ? euro(d.wert, 0) : zahl(d.wert, 1);
      return eingabeFeld(k, esc(d.label) + (eigen ? ' <span class="badge annahme">eigene Einstellung</span>' : ""), wert, d.einheit === "x" ? "Faktor" : d.einheit, esc(d.erklaerung) + " Standard: " + std + ".", null, "annahme");
    };
    var gruppen = [
      ["Kaufnebenkosten und Bank", "Notar, Beleihungswert, Mietausfall, Stresstest", ["NOT", "SA", "MAW", "ZUSCHLAG_ANSCHLUSS"]],
      ["Prognosen und Ziel", "Wert- und Mietsteigerung, Zielrendite", ["WS", "MS", "ZR"]],
      ["Haushaltsrechnung (freiwillig)", "Mietanrechnung und Lebenshaltung", ["MA", "LHP1", "LHP2", "LHPK"]],
      ["Beleihungswert – zweite Sicht", "Ausstattungsfaktoren", ["AF_EINFACH", "AF_MITTEL", "AF_GUT"]]
    ];
    var ann = gruppen.map(function (g, i) {
      var nEigen = g[2].filter(function (k) { return IFP.istZahl(a[k]) && a[k] !== IFP.ANNAHMEN_STANDARD[k].wert; }).length;
      return '<details class="gruppe"' + (i === 0 ? " open" : "") + "><summary>" + esc(g[0]) + ' <span class="klein zweit">· ' + esc(g[1]) + "</span>" + (nEigen ? ' <span class="badge annahme">' + nEigen + " geändert</span>" : "") + '</summary><div class="posten"><div class="raster-2">' + g[2].map(feld).join("") + "</div></div></details>";
    }).join("");
    var sch = ["LTV_BANK", "DSCR", "BMR", "CF", "KPF"].map(function (k) {
      var d = IFP.SCHWELLEN_STANDARD[k], e = s[k] || {}, ein = d.einheit === "%" ? "%" : d.einheit === "€" ? "€" : "Wert";
      return '<fieldset class="karte flach"><legend><b>' + esc(d.label) + "</b></legend><div class=\"raster-2\">" +
        eingabeFeld("s-" + k + "-gruen", "Grenze gut", IFP.istZahl(e.gruen) ? e.gruen : d.gruen, ein, "Standard: " + (d.einheit === "%" ? proz(d.gruen, 1) : zahl(d.gruen, 2)), null, "schwelle") +
        eingabeFeld("s-" + k + "-gelb", "Grenze kritisch", IFP.istZahl(e.gelb) ? e.gelb : d.gelb, ein, "Standard: " + (d.einheit === "%" ? proz(d.gelb, 1) : zahl(d.gelb, 2)), null, "schwelle") + "</div></fieldset>";
    }).join("");
    return "<h2>Bank-Annahmen</h2><p>Alle Werte sind einstellbare Modellannahmen, keine verbindlichen Bankwerte. Frag deine Bank nach ihren Werten.</p>" + ann +
      '<h2 style="margin-top:1.5rem">Ampel-Schwellen</h2><p class="klein">Geänderte Schwellen werden in der Auswertung als „eigene Einstellung“ neben dem Standard gezeigt.</p><details class="gruppe"><summary>Schwellen der 5 Pflichtprüfungen mit Zahlenwert</summary><div class="posten">' + sch + "</div></details>" +
      '<div class="btn-reihe"><button class="btn" data-aktion="annahmen-reset">Alles auf Standard zurücksetzen</button></div>' +
      '<h2 style="margin-top:2rem">Darstellung</h2><div class="karte"><fieldset style="border:0;padding:0"><legend class="sr-only">Darstellung</legend>' +
      [["hell", "Hell (Standard)"], ["dunkel", "Dunkel"], ["system", "Wie im System"]].map(function (t) { return '<label class="option"><input type="radio" name="theme" data-aktion="theme" value="' + t[0] + '"' + (Z.einstellungen.theme === t[0] ? " checked" : "") + ">" + t[1] + "</label>"; }).join("") +
      '</fieldset><p class="klein zweit">„Wie im System“ folgt der Einstellung deines Geräts. Die Bank-Präsentation (Vorschau und PDF) ist immer hell, damit sie gedruckt und von der Bank gut gelesen werden kann.</p></div>';
  };

  V.haushalt = function () {
    var h = Z.lokal.haushalt, p = Z.lokal.profil;
    return '<div class="hinweis"><b>Nur auf diesem Gerät.</b> Diese Angaben sind freiwillig, gehen nie an die KI und werden nicht in „Meine Objekte“ gespeichert. Ohne sie bleibt die Haushaltsprüfung „nicht bewertet“.</div>' +
      '<div class="karte"><h3>Haushaltsrechnung</h3><div class="raster-2">' +
      eingabeFeld("NE", "Haushaltsnettoeinkommen", h.NE, "€/Monat", null, null, "haus") + eingabeFeld("BR", "Bestehende Kreditraten", h.BR, "€/Monat", "0 eintragen, wenn keine.", null, "haus") +
      eingabeFeld("WK", "Eigene Wohnkosten (Miete/Rate)", h.WK, "€/Monat", null, null, "haus") + eingabeFeld("ERW", "Erwachsene im Haushalt", h.ERW, "Personen", null, null, "haus") +
      eingabeFeld("KINDER", "Kinder", h.KINDER, "Kinder", null, null, "haus") + "</div></div>" +
      '<div class="karte"><h3>Investor-Kurzprofil für die Präsentation (optional)</h3><label class="checkzeile"><input type="checkbox" data-aktion="profil-an"' + (p.aktiv ? " checked" : "") + "><span>Kurzprofil in die Präsentation aufnehmen</span></label>" +
      ["name:Name", "objekte:Bestehende Objekte (Anzahl, Orte)", "mieteinnahmen:Mieteinnahmen pro Jahr", "bank:Hausbank seit", "notiz:Kurze Notiz"].map(function (x) { var k = x.split(":"); return '<div class="feld"><label for="pr-' + k[0] + '">' + k[1] + '</label><input id="pr-' + k[0] + '" type="text" data-bereich="profil" data-feld="' + k[0] + '" value="' + esc(p[k[0]]) + '"></div>'; }).join("") + "</div>";
  };

  V.transparenz = function () {
    return '<h2>Über diesen Prototyp</h2><div class="karte"><p><b>Immo Finanz Pilot</b> ist ein Prototyp aus einem Abschlussprojekt der Weiterbildung „KI-Anwendungsspezialist“ (Syntax Institut). Version ' + IFP.VERSION + ".</p>" +
      "<p><b>Anbieter / Impressum:</b><br>Mike Reichenbach<br>Werrabronner Straße 8<br>76229 Karlsruhe<br>E-Mail: <a href=\"mailto:mike.reichenbach@tn.syntax-institut.de\">mike.reichenbach@tn.syntax-institut.de</a></p><p><a href=\"../impressum.html\">Impressum</a> · <a href=\"../datenschutz.html\">Datenschutzerklärung</a></p>" +
      "<p><b>Was die App nicht ist:</b> keine Finanz-, Steuer- oder Rechtsberatung · keine Darlehensvermittlung · verkauft nichts · verdient nicht an Finanzierungen.</p></div>" +
      '<h2>Datenfluss</h2><div class="datenfluss"><div class="box"><b>1 · Dein Gerät</b><br><span class="klein">PDF wird hier in Text umgewandelt</span></div><div class="box"><b>2 · Make</b><br><span class="klein">leitet nur den Exposé-Text weiter</span></div><div class="box"><b>3 · KI-Dienst (Gemini)</b><br><span class="klein">liest Angaben aus, rechnet nie</span></div><div class="box lokal"><b>Bleibt auf dem Gerät</b><br><span class="klein">Einkommen, Haushalt, Alter, Profil, Fotos</span></div></div>' +
      '<div class="karte" style="margin-top:1rem"><h3>Speicherung</h3><ul><li>Entwurf und Einstellungen: im Browser dieses Geräts.</li><li>„Meine Objekte“: in <b>Supabase (Region EU, Frankfurt)</b> unter einer <b>pseudonymen Kennung</b> ohne Namen und ohne Login – nur Objekt- und Finanzierungsdaten mit kurzen Belegstellen aus dem Exposé (max. ca. 120 Zeichen). Jede Kennung sieht nur ihre eigenen Objekte. <b>Automatische Löschung 6 Monate nach der letzten Änderung</b>; vorher jederzeit unter „Meine Daten“.</li><li>Exposé-Text: wird von der App nicht gespeichert, nur kurze Belegstellen (siehe oben). Nach Anbindung der KI kann er kurzzeitig im Make-Ausführungsprotokoll stehen; die Frist wird vor der Live-Anbindung festgelegt und hier genannt.</li><li>KI-Dienst: geplant ist Google Gemini über Make im <b>bezahlten Tarif mit Datenschutz-Zusatz – Eingaben werden nicht zum Training genutzt</b>. Trotzdem geht nur der Exposé-Text an die KI, den du vorher sehen und kürzen kannst – nie Einkommen, Haushalt, Alter, Profil oder Fotos. Im Prototyp ist die Live-KI noch nicht angeschlossen (Demo-Modus).</li><li>Rechenregeln: Formel-Spezifikation ' + IFP.SPEZ + ' – alle Werte rechnet die App selbst.</li></ul><p><a href="#daten">Daten exportieren oder löschen</a> · <a href="../datenschutz.html">Datenschutzerklärung</a></p></div>' +
      '<div class="karte"><h3>Was die KI tut – und was nicht</h3><ul><li>Liest Angaben aus dem Exposé und zeigt die Fundstelle im Originalwortlaut.</li><li>Zeigt fehlende Unterlagen und Widersprüche.</li><li>Erklärt berechnete Kennzahlen und schlägt bearbeitbare Texte vor.</li><li><b>Rechnet nie</b>, erfindet keine fehlenden Werte, Vergleichspreise oder Fundstellen.</li></ul><p class="klein">KI-Inhalte sind gekennzeichnet. Diese Kennzeichnung ist eine Produktentscheidung und keine Bestätigung rechtlicher Konformität.</p></div>' +
      '<div class="karte flach"><h3>Haftung</h3><p class="klein">Alle Berechnungen beruhen auf deinen Eingaben und vereinfachten Modellannahmen. Keine Gewähr für Richtigkeit oder Bankzusagen.</p></div>';
  };

  V.daten = function () {
    var ein = Z.einstellungen.kiEinwilligung;
    return '<div class="karte"><h3>Daten exportieren</h3><p>Lädt alle in dieser App gespeicherten Daten als JSON-Datei (maschinenlesbares Textformat) herunter – auch die lokalen.</p><button class="btn" data-aktion="export">„Meine Daten“ herunterladen</button></div>' +
      '<div class="karte"><h3>Speicherung prüfen</h3><p>Speicherort für „Meine Objekte“: <b>' + speicherOrt() + '</b></p><button class="btn" data-aktion="verbindung-pruefen">Verbindung prüfen</button><div id="pruef-ergebnis" aria-live="polite"></div></div>' +
      '<div class="karte"><h3>KI-Zustimmung</h3><p>Aktueller Stand: <b>' + (ein === true ? "erteilt" : ein === false ? "abgelehnt" : "noch nicht gefragt") + "</b></p>" + (ein !== null ? '<button class="btn" data-aktion="ki-widerruf">Zustimmung zurücksetzen</button>' : "") + "</div>" +
      '<div class="karte"><h3>Alles löschen</h3><p>Löscht Entwurf, Einstellungen und lokale Daten auf diesem Gerät sowie deine pseudonyme Kennung samt aller „Meine Objekte“ in Supabase.</p><button class="btn" data-aktion="alles-loeschen">Alle Daten löschen</button></div>';
  };

  V.mehr = function () {
    return '<div class="start-optionen">' + [["einstellungen", "Bank-Annahmen & Einstellungen", "Schwellen, Annahmen, Darstellung"], ["haushalt", "Haushalt & Kurzprofil", "freiwillig, nur lokal"], ["transparenz", "Über die App & Transparenz", "Betreiber, Datenfluss, KI"], ["daten", "Meine Daten", "Export und Löschen"], ["hilfe", "Hilfe & Begriffe", "Einführung, Glossar"]]
      .map(function (x) { return '<a class="start-option" href="#' + x[0] + '" style="text-decoration:none"><b>' + x[1] + '</b><span class="klein">' + x[2] + "</span></a>"; }).join("") + "</div>";
  };
  V.hilfe = function () {
    return '<div class="btn-reihe"><button class="btn" data-aktion="ob-neu">Einführung erneut ansehen</button><a class="btn" href="#transparenz">Transparenz</a></div><h2 style="margin-top:1.5rem">Begriffe</h2>' +
      Object.keys(IFP.GLOSSAR).map(function (k) { return '<div class="karte flach"><h3>' + esc(k) + '</h3><p class="klein" style="margin:0">' + esc(IFP.GLOSSAR[k]) + "</p></div>"; }).join("");
  };

  /* ---------- Rendern ---------- */
  function render() {
    var r = route();
    if (r === "einwilligung" && Z.einstellungen.kiEinwilligung !== null) r = "import";
    rahmen(r, V[r]());
    if (V[r].nach) V[r].nach();
  }

  /* ---------- Dialoge & Meldungen ---------- */
  function toast(t) { var d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500); }
  function dialog(titel, html, knoepfe) {
    var d = document.getElementById("dialog");
    d.innerHTML = '<div class="d-inhalt"><h2 id="d-titel">' + esc(titel) + "</h2>" + html + '</div><div class="d-fuss">' + knoepfe.map(function (k, i) { return '<button class="btn' + (k.primaer ? " primaer" : "") + '" data-i="' + i + '">' + esc(k.text) + "</button>"; }).join("") + "</div>";
    d.setAttribute("aria-labelledby", "d-titel");
    d.querySelectorAll(".d-fuss button").forEach(function (b) { b.onclick = function () { d.close(); var k = knoepfe[+b.dataset.i]; if (k.aktion) k.aktion(); }; });
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }
  IFP.toast = toast;

  function speichern() { if (!IFP.sichern()) toast("Speichern im Browser nicht möglich – Eingaben gehen beim Schließen verloren."); }

  /* ---------- Werte einlesen ---------- */
  function zahlAus(s) { if (s === null || s === undefined) return null; s = String(s).trim().replace(/\s|€|%/g, ""); if (!s) return null; if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", "."); var n = parseFloat(s); return isFinite(n) ? n : NaN; }

  function demoLaden(seiten) {
    seiten = seiten || IFP.DEMO_E3_SEITEN;
    IFP.sitzung.exposeSeiten = seiten; if (!IFP.sitzung.exposeName) IFP.sitzung.exposeName = "Beispiel-Exposé Leipzig (fiktiv)";
    IFP.neuesObjekt(); var o = Z.objekt, d = IFP.DEMO_E3;
    o.quelle = "demo"; o.adresse = d.adresse; o.ort = "Leipzig"; o.bundesland = "Sachsen"; o.bundeslandAbgeleitet = true;
    Object.keys(d.felder).forEach(function (k) {
      var q = d.felder[k], f = o.felder[k]; if (!f) return;
      f.herkunft = "ki";
      if (q.kandidaten) {
        f.kandidaten = q.kandidaten.map(function (k) { var t = IFP.fundstelleSuchen(k.zitat, seiten); return Object.assign({}, k, { geprueft: t.gefunden, seite: t.seite || k.seite }); });
        f.unsicher = true; f.grund = q.grund; f.pruefung = q.pruefung; f.zustand = "wert"; f.wert = null;
      }
      else if (q.wert === null) { f.zustand = "leer"; f.hinweis = q.hinweisRechnung || null; }
      else {
        f.wert = q.wert; f.zustand = "wert"; f.zusatz = q.zusatz;
        if (q.zitat) {
          var tr = IFP.fundstelleSuchen(q.zitat, seiten);
          f.fundstelle = { seite: tr.seite || q.seite, ort: q.ort, zitat: q.zitat }; f.fundstelleGeprueft = tr.gefunden;
          if (!tr.gefunden) { f.unsicher = true; f.grund = "Die angegebene Fundstelle steht nicht im Exposé-Text."; f.kandidaten = [{ wert: q.wert, seite: q.seite, ort: q.ort, zitat: q.zitat }]; }
        }
      }
    });
    var tOrt = IFP.fundstelleSuchen(d.felder.ORT.zitat, seiten);
    o.felder.ORT = Object.assign(o.felder.ORT, { wert: "Leipzig", zustand: "wert", herkunft: "ki", fundstelle: { seite: tOrt.seite || 1, ort: "Kopf", zitat: d.felder.ORT.zitat }, fundstelleGeprueft: tOrt.gefunden });
    o.unterlagen = Object.assign({}, d.unterlagen); o.fundstellenUnterlagen = {};
    Object.keys(d.fundstellenUnterlagen).forEach(function (k) { if (IFP.fundstelleSuchen(d.fundstellenUnterlagen[k], seiten).gefunden) o.fundstellenUnterlagen[k] = d.fundstellenUnterlagen[k]; else o.unterlagen[k] = "fehlt"; });
    o.warnungen = d.warnungen;
    o.finanzierung = { EK: 30000, i: 0.038, t: 0.02, ZB: 10, REN: null, BEG: "" };
    gewaehltesFeld = "KP"; speichern();
  }

  function importAnimation(fertig) {
    var st = document.getElementById("import-status"); if (!st) { fertig(); return; }
    var schritte = ["Text wird gelesen …", "Angaben werden gesucht …", "Fundstellen werden geprüft …"], i = 0;
    st.innerHTML = '<div class="karte flach" style="margin-top:1rem"><p id="imp-txt"></p><div class="fortschritt"><div id="imp-bar" style="width:0%"></div></div><p class="klein zweit">Demo-Modus: vorbereitete Antwort für das Beispiel-Exposé.</p></div>';
    var tick = function () { if (i < schritte.length) { document.getElementById("imp-txt").textContent = schritte[i]; document.getElementById("imp-bar").style.width = ((i + 1) / schritte.length * 100) + "%"; i++; setTimeout(tick, 450); } else fertig(); };
    tick();
  }

  /* ---------- Ereignisse ---------- */
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-aktion]"); if (!el) return;
    var a = el.dataset.aktion, o = Z.objekt;
    if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio")) return; // über "change"
    switch (a) {
      case "ob-weiter": onboardingSchritt++; render(); break;
      case "ob-fertig": Z.einstellungen.onboardingGesehen = true; onboardingSchritt = 0; speichern(); gehe("start"); break;
      case "ob-neu": onboardingSchritt = 0; gehe("onboarding"); break;
      case "weiter-entwurf": gehe(o.bestaetigt ? "auswertung" : "pruefen"); break;
      case "neu": IFP.neuesObjekt(); gewaehltesFeld = null; render(); break;
      case "start-beispiel":
        IFP.sitzung.exposeSeiten = IFP.DEMO_E3_SEITEN; IFP.sitzung.exposeName = "Beispiel-Exposé Leipzig (fiktiv)"; importZustand = { phase: "bereit" };
        gehe("import"); break;
      case "import-neu": importZustand = { phase: "auswahl" }; IFP.sitzung.exposeSeiten = null; IFP.sitzung.exposeName = null; render(); break;
      case "text-uebernehmen": {
        var tx = (document.getElementById("exp-text") || {}).value || "";
        if (tx.replace(/\s/g, "").length < 100) { toast("Bitte mindestens ein paar Zeilen Exposé-Text einfügen."); break; }
        IFP.sitzung.exposeSeiten = [tx]; IFP.sitzung.exposeName = "Eingefügter Text"; importZustand = { phase: "bereit" }; render(); break; }
      case "start-manuell-text": { var seitenBehalten = IFP.sitzung.exposeSeiten; IFP.neuesObjekt(); var om = Z.objekt; om.quelle = "manuell"; IFP.FELDER.forEach(function (d) { om.felder[d.id].herkunft = "manuell"; }); IFP.sitzung.exposeSeiten = seitenBehalten; gewaehltesFeld = "KP"; speichern(); gehe("pruefen"); break; }
      case "start-eigenes": gehe(Z.einstellungen.kiEinwilligung === null ? "einwilligung" : "import"); break;
      case "start-manuell": IFP.neuesObjekt(); o = Z.objekt; o.quelle = "manuell"; IFP.FELDER.forEach(function (d) { o.felder[d.id].herkunft = "manuell"; }); gewaehltesFeld = "KP"; speichern(); gehe("pruefen"); break;
      case "ki-ja": Z.einstellungen.kiEinwilligung = true; speichern(); gehe("import"); break;
      case "ki-nein": Z.einstellungen.kiEinwilligung = false; speichern(); toast("Kein Problem – du gibst die Werte selbst ein."); el.dataset.aktion = ""; IFP.neuesObjekt(); Z.objekt.quelle = "manuell"; gehe("pruefen"); break;
      case "import-ansicht": importAnsicht = el.dataset.wert; render(); break;
      case "auslesen": {
        var seitenJetzt = IFP.sitzung.exposeSeiten;
        if (!seitenJetzt) { toast("Bitte zuerst ein PDF wählen oder Text einfügen."); break; }
        if (IFP.istBeispielExpose(seitenJetzt)) { importAnimation(function () { demoLaden(seitenJetzt); gehe("pruefen"); }); break; }
        if (Z.einstellungen.kiEinwilligung !== true) { gehe("einwilligung"); break; }
        dialog("Live-KI noch nicht angebunden", "<p>In diesem Prototyp-Stand ist die echte KI-Verarbeitung über Make noch nicht eingerichtet. Es wurden <b>keine Daten gesendet</b>.</p><p>Du kannst die Werte selbst eingeben – der Exposé-Text bleibt in der Prüfmaske zum Nachsehen geöffnet.</p>",
          [{ text: "Selbst eingeben", primaer: true, aktion: function () { document.querySelector('[data-aktion="start-manuell-text"]').click(); } }, { text: "Abbrechen" }]);
        break; }
      case "annahme-vorschlag": { var fa = o.felder[el.dataset.feld]; fa.wert = parseFloat(el.dataset.wert); fa.zustand = "annahme"; fa.herkunft = "manuell"; o.bestaetigt = false; speichern(); toast("Als Annahme eingetragen – Ampeln bleiben grau, bis der Wert belegt ist."); render(); break; }
      case "feld-waehlen": gewaehltesFeld = el.dataset.feld; render(); var m = document.getElementById("detail"); if (m && window.innerWidth < 1100) m.scrollIntoView({ behavior: "smooth", block: "start" }); break;
      case "kandidat-uebernehmen": {
        var f = o.felder[el.dataset.feld], wahl = document.querySelector('input[name="kand"]:checked');
        if (!wahl) { toast("Bitte einen Wert auswählen."); break; }
        if (wahl.value === "eigen") { var v = zahlAus(document.getElementById("f-eigen").value); if (!IFP.istZahl(v) || v <= 0) { toast("Bitte einen gültigen Betrag eingeben."); break; } f.wert = v; f.herkunft = "korrigiert"; }
        else { var k = f.kandidaten[+wahl.value]; f.wert = k.wert; f.fundstelle = { seite: k.seite, ort: k.ort, zitat: k.zitat }; f.herkunft = "bestaetigt"; }
        f.geklaert = true; f.zustand = "wert"; o.bestaetigt = false; speichern(); toast("Übernommen."); render(); break; }
      case "ort-uebernehmen": o.ort = document.getElementById("f-ort").value.trim(); o.bundesland = document.getElementById("f-bl").value; o.bundeslandAbgeleitet = false; o.felder.ORT.zustand = o.ort ? "wert" : "leer"; o.felder.ORT.wert = o.ort; o.bestaetigt = false; speichern(); render(); break;
      case "feld-speichern": case "feld-annahme": {
        var id = el.dataset.feld, d = IFP.FELDER.filter(function (x) { return x.id === id; })[0], f2 = o.felder[id], roh = document.getElementById("f-wert").value;
        if (d.text) { f2.wert = roh.trim() || null; f2.zustand = f2.wert ? "wert" : "leer"; }
        else {
          var n = zahlAus(roh);
          if (n === null) { toast("Feld ist leer – nutze „Leeren“ oder trage einen Wert ein."); break; }
          if (!IFP.istZahl(n) || n < 0) { toast("Bitte eine gültige Zahl eingeben (z. B. 139.000 oder 3,57)."); break; }
          f2.wert = d.prozent ? n / 100 : n; f2.zustand = a === "feld-annahme" ? "annahme" : "wert";
        }
        if (f2.herkunft === "ki" || f2.herkunft === "bestaetigt") f2.herkunft = "korrigiert"; else if (!f2.herkunft) f2.herkunft = "manuell";
        f2.unsicher = false; o.bestaetigt = false; speichern(); toast(a === "feld-annahme" ? "Als Annahme eingetragen." : "Übernommen."); render(); break; }
      case "feld-null": { var f3 = o.felder[el.dataset.feld]; f3.wert = 0; f3.zustand = "null"; f3.herkunft = f3.herkunft === "ki" ? "korrigiert" : "manuell"; o.bestaetigt = false; speichern(); render(); break; }
      case "feld-leeren": { var f4 = o.felder[el.dataset.feld]; f4.wert = null; f4.zustand = "leer"; o.bestaetigt = false; speichern(); render(); break; }
      case "bestaetigen":
        if (offeneUnsichere() > 0) { toast("Bitte zuerst den gelb markierten Wert klären."); break; }
        o.bestaetigt = true; IFP.FELDER.forEach(function (d) { var f5 = o.felder[d.id]; if (f5.herkunft === "ki" && f5.zustand !== "leer") f5.herkunft = "bestaetigt"; });
        speichern(); gehe("luecken"); break;
      case "springe": { ev.preventDefault(); var zz = document.getElementById(el.dataset.ziel); if (zz) { zz.scrollIntoView({ behavior: "smooth", block: "start" }); zz.focus({ preventScroll: true }); } break; }
      case "feld-oeffnen": gewaehltesFeld = el.dataset.feld; gehe("pruefen"); break;
      case "luecken-kopieren": {
        var ta = document.getElementById("luecken-text");
        var fertig = function () { toast("Text kopiert."); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(ta.value).then(fertig, function () { ta.select(); toast("Bitte mit Strg/Cmd + C kopieren."); });
        else { ta.select(); try { document.execCommand("copy") ? fertig() : toast("Bitte mit Strg/Cmd + C kopieren."); } catch (e) { toast("Bitte mit Strg/Cmd + C kopieren."); } }
        break; }
      case "gehe":
        if (["finanzierung", "auswertung", "praesentation"].indexOf(el.dataset.ziel) >= 0 && !o.bestaetigt) {
          dialog("Werte noch nicht bestätigt", "<p>Bevor gerechnet wird, bestätige bitte die Angaben in der Prüfmaske.</p>", [{ text: "Zur Prüfmaske", primaer: true, aktion: function () { gehe("pruefen"); } }, { text: "Abbrechen" }]); break; }
        gehe(el.dataset.ziel); break;
      case "kennzahl": aktiveKennzahl = el.dataset.id; render(); var dk = document.getElementById("detail"); if (dk && window.innerWidth < 1100) dk.scrollIntoView({ behavior: "smooth", block: "start" }); break;
      case "glossar": dialog(el.dataset.begriff, "<p>" + esc(IFP.GLOSSAR[el.dataset.begriff] || "") + "</p>", [{ text: "Schließen", primaer: true }]); break;
      case "erklaeren": {
        var box = document.getElementById("erkl-" + el.dataset.id);
        if (box) box.innerHTML = '<div class="hinweis ki"><b>Standarderklärung</b> <span class="badge demo">KI noch nicht angebunden</span><p class="klein" style="margin:.25rem 0 0">' + esc(IFP.GLOSSAR[{ CF: "Cashflow", DSCR: "DSCR", LTV_BANK: "Beleihungsauslauf", MIETE_REF: "Nötige Miete/m²", KPF: "Kaufpreisfaktor", BMR: "Bruttomietrendite", EK_KNK: "Kaufnebenkosten", HUE: "Haushaltsüberschuss", KP_REF: "Kaufpreisfaktor", RS_RENTE: "Restschuld" }[el.dataset.id]] || "") + "</p></div>";
        break; }
      case "objekt-speichern":
        if (!o.bestaetigt) { toast("Bitte zuerst die Werte bestätigen."); break; }
        el.setAttribute("aria-disabled", "true");
        IFP.objekte.speichern().then(function () { toast("Objekt gespeichert (" + speicherOrt() + ")."); })
          .catch(function (e) { dialog("Speichern fehlgeschlagen", "<p>" + esc(e.message) + "</p><p>Deine Eingaben bleiben als Entwurf auf diesem Gerät erhalten.</p>", [{ text: "Verbindung prüfen", primaer: true, aktion: function () { gehe("daten"); } }, { text: "Schließen" }]); })
          .then(function () { el.removeAttribute("aria-disabled"); });
        break;
      case "neu-laden": render(); break;
      case "objekt-oeffnen": IFP.objekte.laden(el.dataset.id).then(function (d) { if (!d) { toast("Objekt nicht gefunden."); return; } Z.objekt = d; IFP.zustand.objekt = d; IFP.sitzung.exposeSeiten = null; speichern(); gewaehltesFeld = null; gehe("auswertung"); }).catch(function (e) { toast("Öffnen fehlgeschlagen: " + e.message); }); break;
      case "objekt-loeschen": { var oid = el.dataset.id;
        dialog("Objekt löschen?", "<p>Das Objekt wird aus „Meine Objekte“ entfernt" + (IFP.objekte.modus === "supabase" ? " – auch in Supabase" : "") + ". Das kann nicht rückgängig gemacht werden.</p>", [{ text: "Löschen", primaer: true, aktion: function () { IFP.objekte.loeschen(oid).then(function () { toast("Gelöscht."); render(); }).catch(function (e) { toast("Löschen fehlgeschlagen: " + e.message); }); } }, { text: "Abbrechen" }]); break; }
      case "verbindung-pruefen": {
        var pe = document.getElementById("pruef-ergebnis"); if (pe) pe.innerHTML = '<p class="klein">Prüfe …</p>';
        IFP.objekte.pruefen().then(function (sch) { if (pe) pe.innerHTML = "<ul>" + sch.map(function (x) { return "<li>" + (x.ok ? '<span class="ampel gruen">✓</span> ' : '<span class="ampel rot">✕</span> ') + esc(x.text) + "</li>"; }).join("") + "</ul>"; });
        break; }
      case "ki-text-vorschlag": {
        var w = IFP.ergebnis().werte, kt = o.kiTexte.zusammenfassung || {};
        kt.text = "[Demo-Vorschlag – keine echte KI] Vermietete 2-Zimmer-Altbauwohnung in " + (o.ort || "–") + ", " + zahl(IFP.eingaben().e.WFL, 1) + " m². Kaufpreis " + euro(IFP.eingaben().e.KP, 0) + ", Darlehen " + euro(w.D, 0) + ", Rate " + euro(w.R) + " pro Monat. Offene Punkte siehe Unterlagen-Checkliste.";
        kt.an = true; kt.geprueft = false; o.kiTexte.zusammenfassung = kt; speichern(); render(); break; }
      case "pdf":
        el.setAttribute("aria-busy", "true"); var altText = el.textContent; el.textContent = "PDF wird erstellt …";
        IFP.pdf.erstellen().then(function (info) {
          toast("PDF gespeichert: " + info.datei + " (" + info.seiten + " Seiten)" + (info.entwurf ? " – als Entwurf" : ""));
        }).catch(function (e) { dialog("PDF konnte nicht erstellt werden", "<p>" + esc(e.message || String(e)) + "</p><p>Es wurde nichts verschickt. Bitte versuche es erneut oder nutze einen anderen Browser.</p>", [{ text: "Schließen", primaer: true }]); })
          .then(function () { el.removeAttribute("aria-busy"); el.textContent = altText; });
        break;
      case "annahmen-reset":
        dialog("Auf Standard zurücksetzen?", "<p>Alle eigenen Annahmen und Schwellen werden auf die Standardwerte aus der Formel-Spezifikation gesetzt.</p>", [{ text: "Zurücksetzen", primaer: true, aktion: function () { Z.einstellungen.annahmen = {}; Z.einstellungen.schwellen = {}; speichern(); toast("Standardwerte gelten wieder."); render(); } }, { text: "Abbrechen" }]); break;
      case "export": {
        IFP.objekte.liste().catch(function () { return []; }).then(function (liste) {
          var blob = new Blob([IFP.exportJSON(liste)], { type: "application/json" }), url = URL.createObjectURL(blob), l = document.createElement("a");
          l.href = url; l.download = "immo-finanz-pilot_meine-daten_" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }); break; }
      case "ki-widerruf": Z.einstellungen.kiEinwilligung = null; speichern(); toast("Zustimmung zurückgesetzt."); render(); break;
      case "alles-loeschen":
        dialog("Wirklich alles löschen?", "<p>Entwurf, Einstellungen, lokale Daten und gespeicherte Objekte auf diesem Gerät werden gelöscht.</p>", [{ text: "Alles löschen", primaer: true, aktion: function () { IFP.objekte.allesLoeschen().then(function () { return 0; }).catch(function (e) { toast("Supabase konnte nicht gelöscht werden (" + e.message + "). Lokale Daten werden gelöscht."); return 3500; }).then(function (warte) { IFP.allesLoeschen(); setTimeout(function () { location.hash = ""; location.reload(); }, warte); }); } }, { text: "Abbrechen" }]); break;
    }
  });

  document.addEventListener("change", function (ev) {
    var el = ev.target, o = Z.objekt;
    if (el.dataset.aktion === "unterlage") { o.unterlagen[el.dataset.id] = el.checked ? "liegtvor" : ((IFP.DEMO_E3.unterlagen[el.dataset.id] && o.quelle === "demo") ? IFP.DEMO_E3.unterlagen[el.dataset.id] : "fehlt"); speichern(); render(); return; }
    if (el.dataset.aktion === "theme") { Z.einstellungen.theme = el.value; speichern(); themeAnwenden(); return; }
    if (el.dataset.aktion === "profil-an") { Z.lokal.profil.aktiv = el.checked; speichern(); return; }
    if (el.dataset.aktion === "ki-text-an" || el.dataset.aktion === "ki-text-geprueft") { var kt = o.kiTexte.zusammenfassung || { text: "" }; kt[el.dataset.aktion === "ki-text-an" ? "an" : "geprueft"] = el.checked; o.kiTexte.zusammenfassung = kt; speichern(); return; }
    if (el.dataset.aktion === "pdf-gewaehlt" && el.files && el.files[0]) {
      var datei = el.files[0];
      importZustand = { phase: "lesen", fortschritt: 0, seitenAnzahl: 0 }; render();
      IFP.ladePdfJs().then(function () {
        return IFP.pdfZuText(datei, function (nr, n) { importZustand.fortschritt = nr; importZustand.seitenAnzahl = n; if (route() === "import") render(); });
      }).then(function (seiten) {
        IFP.sitzung.exposeSeiten = seiten; IFP.sitzung.exposeName = datei.name; importZustand = { phase: "bereit" }; render();
      }).catch(function (e) { importZustand = { phase: "auswahl", fehler: (e && e.message) || "Unbekannter Fehler beim Lesen." }; render(); });
      return;
    }
    var b = el.dataset.bereich; if (!b) return;
    if (b === "exptext") { IFP.sitzung.exposeSeiten = el.value.split(/\n?\[Seite \d+\]\n/).filter(function (x) { return x.trim(); }); return; }
    var n = zahlAus(el.value), id = el.dataset.feld, prozent = el.dataset.einheit === "%";
    if (b === "profil") { Z.lokal.profil[id] = el.value; speichern(); return; }
    if (b === "kitext") { var k2 = o.kiTexte.zusammenfassung || {}; k2.text = el.value; k2.geprueft = false; o.kiTexte.zusammenfassung = k2; speichern(); render(); return; }
    if (b === "refq") { o.refEigen = o.refEigen || {}; o.refEigen.quelle = el.value; speichern(); return; }
    if (IFP.istZahl(n) === false && n !== null) { toast("Bitte eine gültige Zahl eingeben."); return; }
    var wert = n === null ? null : (prozent ? n / 100 : n);
    if (b === "fin") o.finanzierung[id] = wert;
    else if (b === "alter") Z.lokal.alter[id] = wert;
    else if (b === "haus") Z.lokal.haushalt[id] = wert;
    else if (b === "ref") { o.refEigen = o.refEigen || {}; o.refEigen[id === "refkp" ? "kp" : "miete"] = wert; }
    else if (b === "annahme") { if (wert === null) delete Z.einstellungen.annahmen[id]; else Z.einstellungen.annahmen[id] = wert; }
    else if (b === "schwelle") { var t = id.split("-"); Z.einstellungen.schwellen[t[1]] = Z.einstellungen.schwellen[t[1]] || {}; Z.einstellungen.schwellen[t[1]][t[2]] = wert; }
    speichern();
    var fokusId = el.id; render(); var neu = document.getElementById(fokusId); if (neu) neu.focus();
  });

  function themeAnwenden() {
    var t = Z.einstellungen.theme; if (t === "system") t = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dunkel" : "hell";
    document.documentElement.setAttribute("data-theme", t);
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", function () { themeAnwenden(); render(); });
  if (window.matchMedia) { var mq = matchMedia("(prefers-color-scheme: dark)"); var mqf = function () { if (Z.einstellungen.theme === "system") themeAnwenden(); }; if (mq.addEventListener) mq.addEventListener("change", mqf); else if (mq.addListener) mq.addListener(mqf); }
})();
