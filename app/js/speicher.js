/* Immo Finanz Pilot – "Meine Objekte": Speicherung in Supabase (EU) mit pseudonymer Kennung (Supabase "anonymous sign-in"), Rückfall auf lokalen Speicher.
   Ohne Zusatzbibliothek: direkte Aufrufe der Supabase-Schnittstellen (Auth + REST).
   Gesendet werden ausschließlich Objekt- und Finanzierungsdaten – lokale Daten (Haushalt, Profil, Alter, Fotos, Exposé-Text) nie. */
(function () {
  "use strict";
  var IFP = window.IFP, K = IFP.KONFIG || {}, K_SITZUNG = "ifp.sb.sitzung.v2", K_LOKAL = "ifp.objekte.v1";
  function lesen(k, s) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : s; } catch (e) { return s; } }
  function schreiben(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var aktiv = !!(K.supabaseUrl && K.supabaseKey);

  /* Nur erlaubte Felder des Objekts übernehmen (Positivliste statt Negativliste) */
  function bereinigt(o) {
    var c = JSON.parse(JSON.stringify(o));
    var erlaubt = ["id", "quelle", "adresse", "ort", "bundesland", "bundeslandAbgeleitet", "felder", "bestaetigt", "finanzierung", "ausstattung", "unterlagen", "fundstellenUnterlagen", "warnungen", "kiTexte", "refEigen", "angelegt", "geaendert"];
    Object.keys(c).forEach(function (k) { if (erlaubt.indexOf(k) < 0) delete c[k]; });
    if (c.finanzierung) { delete c.finanzierung.ALT; delete c.finanzierung.RENT; }
    /* Belegstellen aus dem Exposé auf max. 120 Zeichen kürzen (Datensparsamkeit, Entscheidung E-04) */
    var MAX = 120, kurz = function (t) { t = String(t == null ? "" : t); return t.length > MAX ? t.slice(0, MAX - 1) + "…" : t; };
    if (c.felder) Object.keys(c.felder).forEach(function (k) {
      var f = c.felder[k]; if (!f) return;
      if (f.fundstelle && f.fundstelle.zitat) f.fundstelle.zitat = kurz(f.fundstelle.zitat);
      if (Array.isArray(f.kandidaten)) f.kandidaten.forEach(function (q) { if (q && q.zitat) q.zitat = kurz(q.zitat); });
    });
    if (c.fundstellenUnterlagen) Object.keys(c.fundstellenUnterlagen).forEach(function (k) { c.fundstellenUnterlagen[k] = kurz(c.fundstellenUnterlagen[k]); });
    return c;
  }
  IFP.bereinigtFuerSpeicher = bereinigt;

  function fetchJson(pfad, opt) {
    opt = opt || {}; opt.headers = Object.assign({ apikey: K.supabaseKey, "Content-Type": "application/json" }, opt.headers || {});
    return fetch(K.supabaseUrl + pfad, opt).catch(function () {
      throw new Error("Keine Verbindung zu Supabase. Prüfe Internet, Werbeblocker oder Firmennetz.");
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
        if (!r.ok) { var err = new Error((j && (j.msg || j.message || j.error_description || j.error)) || ("HTTP " + r.status)); err.status = r.status; err.antwort = j; throw err; }
        return j;
      });
    });
  }

  /* Anonyme Anmeldung mit Sitzungs-Erneuerung */
  var sitzung = lesen(K_SITZUNG, null);
  function sitzungSpeichern(s) {
    sitzung = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)), user_id: s.user ? s.user.id : (sitzung && sitzung.user_id) };
    schreiben(K_SITZUNG, sitzung); return sitzung;
  }
  function anmelden() {
    var jetzt = Math.floor(Date.now() / 1000);
    if (sitzung && sitzung.access_token && sitzung.expires_at - 60 > jetzt) return Promise.resolve(sitzung);
    if (sitzung && sitzung.refresh_token) {
      return fetchJson("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: sitzung.refresh_token }) })
        .then(sitzungSpeichern).catch(function () { sitzung = null; return anmelden(); });
    }
    return fetchJson("/auth/v1/signup", { method: "POST", body: JSON.stringify({ data: {} }) }).then(sitzungSpeichern);
  }
  function rest(pfad, opt) {
    return anmelden().then(function (s) {
      opt = opt || {}; opt.headers = Object.assign({ Authorization: "Bearer " + s.access_token }, opt.headers || {});
      return fetchJson("/rest/v1" + pfad, opt);
    });
  }

  /* Lokaler Rückfall */
  var lokal = {
    liste: function () { return Promise.resolve(lesen(K_LOKAL, [])); },
    speichern: function (e) { var l = lesen(K_LOKAL, []).filter(function (x) { return x.id !== e.id; }); l.unshift(e); return Promise.resolve(schreiben(K_LOKAL, l)); },
    laden: function (id) { return Promise.resolve((lesen(K_LOKAL, []).filter(function (x) { return x.id === id; })[0] || {}).daten || null); },
    loeschen: function (id) { return Promise.resolve(schreiben(K_LOKAL, lesen(K_LOKAL, []).filter(function (x) { return x.id !== id; }))); }
  };

  IFP.objekte = {
    modus: aktiv ? "supabase" : "lokal",
    letzterFehler: null,
    liste: function () {
      if (!aktiv) return lokal.liste();
      return rest("/objekte?select=id,titel,ort,kaufpreis,gesamt_status,gruen,bewertet,geaendert&order=geaendert.desc").then(function (rows) {
        IFP.objekte.letzterFehler = null;
        return rows.map(function (r) { return { id: r.id, titel: r.titel, ort: r.ort, kp: r.kaufpreis, datum: r.geaendert, gesamt: r.gesamt_status, gruen: r.gruen, bewertet: r.bewertet }; });
      });
    },
    speichern: function () {
      var o = bereinigt(IFP.zustand.objekt), erg = IFP.ergebnis(), kp = IFP.eingaben().e.KP;
      var e = { id: o.id, titel: o.adresse || o.ort || "Objekt ohne Namen", ort: o.ort, kp: kp, datum: new Date().toISOString(), gesamt: erg.gesamt.status, gruen: erg.gesamt.gruen, bewertet: erg.gesamt.bewertet, daten: o };
      if (!aktiv) return lokal.speichern(e);
      return anmelden().then(function (s) {
        return rest("/objekte?on_conflict=nutzer,id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({ nutzer: s.user_id, id: e.id, titel: e.titel, ort: e.ort, kaufpreis: kp, gesamt_status: e.gesamt, gruen: e.gruen, bewertet: e.bewertet, daten: o }) });
      }).then(function () { return true; });
    },
    laden: function (id) {
      if (!aktiv) return lokal.laden(id);
      return rest("/objekte?select=daten&id=eq." + encodeURIComponent(id)).then(function (r) { return r && r[0] ? r[0].daten : null; });
    },
    loeschen: function (id) {
      if (!aktiv) return lokal.loeschen(id);
      return rest("/objekte?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: { Prefer: "return=minimal" } }).then(function () { return true; });
    },
    allesLoeschen: function () {
      if (!aktiv || !sitzung) return Promise.resolve(true);
      return rest("/rpc/konto_loeschen", { method: "POST", body: "{}" }).then(function () { sitzung = null; try { localStorage.removeItem(K_SITZUNG); } catch (e) {} return true; });
    },
    /* Selbsttest für "Verbindung prüfen" */
    pruefen: function () {
      var schritte = [];
      if (!aktiv) return Promise.resolve([{ ok: false, text: "Keine Supabase-Verbindungsdaten eingetragen (js/konfig.js)." }]);
      return fetchJson("/auth/v1/settings", {}).then(function () {
        schritte.push({ ok: true, text: "Supabase erreichbar." });
        return anmelden();
      }).then(function () {
        schritte.push({ ok: true, text: "Anonyme Anmeldung funktioniert." });
        return rest("/objekte?select=id&limit=1");
      }).then(function () {
        schritte.push({ ok: true, text: "Tabelle „objekte“ mit Zugriffsschutz erreichbar." }); return schritte;
      }).catch(function (e) {
        var t = e.message || String(e);
        if (/anonymous/i.test(t) || e.status === 422) t = "Anonyme Anmeldung ist ausgeschaltet – bitte in Authentication einschalten. (" + t + ")";
        else if (e.status === 404 || /relation|does not exist|schema cache/i.test(t)) t = "Tabelle „objekte“ fehlt – bitte supabase/01_einrichtung.sql im SQL Editor ausführen. (" + t + ")";
        schritte.push({ ok: false, text: t }); return schritte;
      });
    }
  };
})();
