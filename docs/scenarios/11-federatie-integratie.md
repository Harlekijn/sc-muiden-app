# Scenario: Federatie-integratie

End-to-end flows voor KNVB/KNHB sync, wedstrijddetail-scherm, en CMS synchronisatiepagina.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Seed bevat: 1 voetbalteam met `federation_team_id = 'knvb-test-001'`, 1 hockeyteam met `federation_team_id = 'knhb-test-001'`
- Edge function `federation-sync` lokaal beschikbaar (`supabase functions serve`)
- Mock-clients actief (geen `KNVB_API_KEY` / `KNHB_API_KEY` in `.env` → mock-data wordt gebruikt)
- CMS open en ingelogd als Beheerder (`e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)

---

## S11-A — Cron sync verwerkt wedstrijden van KNVB (mock)

**Goal:** Na het uitvoeren van de federation-sync edge function zijn wedstrijden aanwezig in `matches` en `activities`.

**Steps:**

1. Roep de edge function aan via curl of Supabase Studio:
   ```
   POST http://localhost:54321/functions/v1/federation-sync
   Body: { "sport": "voetbal", "triggered_by": "cron" }
   ```
2. Wacht op HTTP 200-respons.

**Expected result:**

- Supabase Studio → `matches`: minimaal 1 rij aanwezig met `federation_source = 'knvb'` en `team_id` gevuld met het voetbalteam-ID.
- Supabase Studio → `activities`: overeenkomstig `wedstrijd`-record aanwezig met `type = 'wedstrijd'` en `team_id`.
- Supabase Studio → `sync_log`: 1 nieuwe rij met `sport = 'voetbal'`, `triggered_by = 'cron'`, `finished_at IS NOT NULL`, `error IS NULL`.

**Verificatie via Supabase Studio:**

`SELECT * FROM sync_log WHERE sport = 'voetbal' ORDER BY started_at DESC LIMIT 1;`
→ verwacht: `error IS NULL`, `records_updated >= 1`.

---

## S11-B — Handmatige sync triggeren via CMS — succesvol

**Goal:** Een beheerder kan via de CMS-synchronisatiepagina een handmatige sync triggeren die direct de data bijwerkt.

**Prerequisites:** S11-A uitgevoerd (zodat een baseline bestaat).

**Steps:**

1. Open de CMS in de browser.
2. Navigeer naar `/dashboard/instellingen/synchronisatie`.
3. Controleer dat de Voetbal-sectie zichtbaar is met een timestamp van de laatste sync.
4. Klik "Synchroniseer nu" in de Voetbal-sectie.

**Expected result:**

- De knop toont een spinner en de tekst "Synchroniseren..." en is disabled.
- Na afloop: spinner verdwijnt, knop is actief.
- De last-sync timestamp in de UI is bijgewerkt naar het huidige tijdstip (Dutch format, bijv. "maandag 11 mei om 14:32").
- Geen foutbanner zichtbaar.
- Klapt het logpaneel open → de nieuwe run staat bovenaan met een groen vinkje en een record count.

**Verificatie via Supabase Studio:**

`SELECT * FROM sync_log WHERE sport = 'voetbal' AND triggered_by = 'manual' ORDER BY started_at DESC LIMIT 1;`
→ verwacht: `error IS NULL`, `finished_at IS NOT NULL`.

---

## S11-C — Handmatige sync triggeren via CMS — API onbereikbaar (mock fout)

**Goal:** Als de sync mislukt, ziet de beheerder een duidelijke Nederlandse foutmelding en verschijnt de foutrun in het logpaneel.

**Setup:**

1. Stop tijdelijk de edge function (`supabase functions serve` stoppen of simuleer een fout door `KNVB_FORCE_ERROR=true` env var te zetten als dat geïmplementeerd is in de mock).

**Steps:**

2. Navigeer naar `/dashboard/instellingen/synchronisatie`.
3. Klik "Synchroniseer nu" voor Voetbal.

**Expected result:**

- Na afloop: knop is actief.
- Rode foutbanner zichtbaar: "Synchronisatie mislukt. Probeer het opnieuw." (geen Engelse tekst, geen stack trace).
- Klapt het logpaneel open → de mislukte run staat bovenaan met een rood kruis en een Nederlandse foutmelding in de rij.

**Verificatie via Supabase Studio:**

`SELECT error FROM sync_log WHERE sport = 'voetbal' ORDER BY started_at DESC LIMIT 1;`
→ verwacht: `error IS NOT NULL`.

**Cleanup:**

4. Herstart de edge function.

---

## S11-D — Wedstrijddetail-scherm toont correcte informatie

**Goal:** Na het tikken op een wedstrijd-activity card navigeert de app naar het wedstrijddetail-scherm met alle correcte gegevens.

**Prerequisites:**
- S11-A uitgevoerd (wedstrijden zijn aanwezig in `matches` en `activities`).
- Mobile app open en ingelogd als Test Lid.
- Thuisscherm of Agenda-tab toont een wedstrijd-activiteitskaart.

**Steps:**

1. Open het thuisscherm of de Agenda-tab.
2. Tik op een activiteitskaart van type `wedstrijd`.

**Expected result voor wedstrijd met status `gepland`:**

- Scherm navigeert naar `/wedstrijd/[id]`.
- Navy header met terug-pijl en de naam van het team.
- Statusbadge `GEPLAND` zichtbaar (ALL CAPS, navy tekst).
- Geen scorebord zichtbaar.
- Info-kaart toont: datum in Dutch long format (bijv. "zaterdag 16 mei"), tijd in 24h format, locatie (als aanwezig), teamnaam.

**Steps (uitslag toetsen):**

3. Update in Supabase Studio: stel de wedstrijd in op `status = 'gespeeld'`, `score_home = 3`, `score_away = 1`.
4. Trek scherm omlaag (pull-to-refresh) of verlaat en open opnieuw.

**Expected result voor wedstrijd met status `gespeeld`:**

- Statusbadge `GESPEELD` zichtbaar (groen).
- Scorebord zichtbaar: `3 – 1` (en-dash, spaties, ds-score formaat).
- Thuisteam en uitteam weergegeven boven het scorebord.

---

## S11-E — Lid ziet rol-afgeschermde synchistorie niet

**Goal:** Een gewone `lid`-gebruiker heeft geen toegang tot sync_log data (RLS).

**Steps:**

1. Log in als Test Lid (rol: `lid`).
2. Probeer via Supabase Studio of een directe API-call de `sync_log`-tabel te lezen met de anon/publishable key.

**Expected result:**

- De query retourneert 0 rijen (RLS blokkeert de select).
- Geen foutmelding, maar lege resultatenset — zoals verwacht van Supabase RLS.
- De CMS-synchronisatiepagina is niet bereikbaar voor een `lid`-gebruiker (bestaande dashboard role guard retourneert "Geen toegang").

**Verificatie via Supabase Studio:**

Schakel tijdelijk naar de anon-rol in Studio en voer uit:
`SELECT * FROM sync_log;`
→ verwacht: 0 rijen (RLS policy blokkeert).
