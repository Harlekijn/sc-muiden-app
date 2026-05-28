# Scenario: Kalender — recurring trainings on-the-fly

End-to-end flow: trainings worden niet meer gematerialiseerd in `activities`,
maar gegenereerd uit `recurring_rules` via de view `activities_with_occurrences`.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data toegepast (`cd apps/web && pnpm seed`)
- RecurringRule bestaat: maandag 19:00–20:30, valid_from = vandaag − 7d, valid_until = vandaag + 90d, voor het voetbalteam
- Test Lid is via `team_members` gekoppeld aan dat voetbalteam
- Mobile app open en ingelogd als Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)

---

## S17-A — RecurringRule produceert dots zonder materialisatie

**Goal:** Een nieuwe RecurringRule levert direct trainings in de agenda, zonder
een "genereer"-knop.

**Steps:**

1. Log in als Test Beheerder in CMS (`/dashboard`).
2. Open `/dashboard/activiteiten/nieuw`, kies "Training" als type.
3. Vul rule-velden in: team = voetbalteam, dag = maandag, tijd 19:00–20:30, locatie "Sportpark Muiden", valid_from = vandaag, valid_until = +30d.
4. Klik "Opslaan".
5. Open de mobiele app als Test Lid.
6. Open Agenda-tab op de huidige maand.

**Expected result:**

- Op elke maandag binnen het venster verschijnt een blauwe trainingsdot.
- Geen aparte "Genereer"-stap was nodig.
- Geen Engelse tekst of technische foutmeldingen.

**Verificatie via Supabase Studio:**

- `recurring_rules`: 1 rij voor de aangemaakte rule.
- `activities`: geen nieuwe rijen voor `recurring_rule_id = <id>`.
- `select * from activities_with_occurrences where recurring_rule_id = '<id>'`: meerdere rijen, één per maandag in het venster.

---

## S17-B — Override op één datum overschrijft de rule

**Goal:** Een override-Activity op een specifieke datum vervangt de gegenereerde
training voor die datum.

**Prerequisites:** S17-A.

**Steps:**

1. Log in als Test Beheerder.
2. Open de eerstvolgende maandag in CMS-agenda.
3. Klik op de gegenereerde trainingscard, kies "Wijzigen alleen deze datum".
4. Pas tijd aan naar 18:00 en klik "Opslaan".
5. Open mobiele app, ga naar diezelfde datum.

**Expected result:**

- Eén trainingscard op die datum, met tijd 18:00 (override), niet 19:00 (rule).
- Andere maandagen tonen nog steeds 19:00.

**Verificatie via Supabase Studio:**

- `activities`: 1 nieuwe rij met `recurring_rule_id = <id>` en `starts_at` op die datum 18:00.
- `activities_with_occurrences`: voor die datum levert de view alleen de override-rij,
  niet de gegenereerde rij.

---

## S17-C — Soft-deleted override = afgelaste training

**Goal:** Een override met `deleted_at` zorgt dat de training onzichtbaar is.

**Prerequisites:** RecurringRule actief.

**Steps:**

1. Log in als Test Beheerder.
2. Open een specifieke maandag.
3. Klik "Annuleren". Bevestig met "Ja, annuleer".
4. Open mobiele app, ga naar diezelfde datum.

**Expected result:**

- Geen trainingsdot op die datum.
- Daglijst toont "Geen activiteiten op deze dag." (of overige activiteiten zonder de training).

**Verificatie via Supabase Studio:**

- `activities`: rij met `recurring_rule_id = <id>` op die datum, `deleted_at` gezet.
- `activities_with_occurrences`: voor die datum geen rij voor deze rule.

---

## S17-D — RecurringRule wijzigen update alle toekomstige occurrences

**Goal:** Tijd of locatie aanpassen op de rule reflecteert direct in de agenda.

**Prerequisites:** RecurringRule actief, mobiele app open.

**Steps:**

1. Log in als Test Beheerder.
2. Open de rule, wijzig start_time van 19:00 → 19:30, klik "Opslaan".
3. Open mobiele app, pull-to-refresh op de agenda.

**Expected result:**

- Alle toekomstige maandagen tonen tijd 19:30.
- Datums met een override behouden hun override-tijd (niet beïnvloed).

---

## S17-E — Geen training-notificatie meer in voorkeuren

**Goal:** Training-notificaties zijn volledig verwijderd uit het systeem.

**Steps:**

1. Log in als Test Lid.
2. Open Notificatie-instellingen.

**Expected result:**

- Toggles zichtbaar: Wedstrijd, Bardienst, Aankondiging.
- Géén "Training"-toggle.

**Verificatie via Supabase Studio:**

- `notification_preferences`: kolom `training` bestaat niet (alleen `wedstrijd`, `bardienst`, `aankondiging`, `profile_id`, `id`, timestamps).
- `notifications`: geen rijen met type `training_herinnering`.

---

## S17-F — Lid van team A ziet geen trainings van team B (RLS)

**Goal:** RLS via `security_invoker` view blokkeert cross-team-trainings.

**Prerequisites:** RecurringRule voor team A én RecurringRule voor team B. Test Lid is alleen lid van team A.

**Steps:**

1. Log in als Test Lid.
2. Open de Agenda-tab.
3. Bekijk de dots op een maandag waar zowel team A als team B een training heeft.

**Expected result:**

- Maximaal één trainingsdot per dag (alleen team A).
- Detail van de training toont team A.

**Verificatie via Supabase Studio (anon key, JWT van Test Lid):**

```sql
select team_id, count(*)
  from activities_with_occurrences
 where type = 'training'
 group by team_id;
```

- Resultaat bevat alleen `team_id = team_A`.
- Geen rijen voor team B.
