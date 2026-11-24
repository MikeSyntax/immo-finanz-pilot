/* Immo Finanz Pilot – Verbindungsdaten
   Nur öffentliche Angaben! Der "publishable key" darf öffentlich sein; geschützt wird über Row Level Security (supabase/01_einrichtung.sql).
   NIE den "secret key" / "service_role key" hier eintragen. */
window.IFP = window.IFP || {};
IFP.KONFIG = {
  supabaseUrl: "https://xagqmqpnortkotfuojhk.supabase.co",
  supabaseKey: "sb_publishable_sJ7JayWR_3yUr7aT5q8Hqg_ZgzggG4N",
  makeWebhook: null   // folgt in Woche 10 (KI-Workflow). Gilt als öffentlich.
};
