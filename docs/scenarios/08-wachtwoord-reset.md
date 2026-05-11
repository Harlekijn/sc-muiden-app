# Scenario: Wachtwoord-resetmail door beheerder

Covers de admin-gestuurde wachtwoord-reset vanuit het CMS-dashboard.

**Prerequisites:** Local Supabase running (`supabase start`), seed data applied (`cd apps/web && pnpm seed`), beheerder ingelogd in het CMS als `e2e-beheerder@e2e.scmuiden.test`.

---

## S08-A — Beheerder stuurt resetmail voor een lid

**Doel:** Een beheerder kan via de Leden-pagina een resetmail sturen naar een lid.

**Stappen:**

1. Log in op het CMS als `e2e-beheerder@e2e.scmuiden.test`.
2. Navigeer naar Dashboard → Leden.
3. Zoek de sectie "Wachtwoord-resetmail sturen".
4. Vul in het e-mailveld: `e2e-lid@e2e.scmuiden.test`.
5. Klik op "Stuur resetmail".

**Verwacht resultaat:**

- Het succesbericht "Resetmail verstuurd naar e2e-lid@e2e.scmuiden.test." verschijnt.
- Open Inbucket op http://127.0.0.1:54324 → inbox van `e2e-lid@e2e.scmuiden.test`: een reset-e-mail met herstelkoppeling staat klaar.

---

## S08-B — Commissielid heeft geen toegang tot de reset-sectie

**Doel:** De admin-sectie is alleen zichtbaar voor beheerders, niet voor commissieleden.

**Stappen:**

1. Log in op het CMS als een gebruiker met rol `commissielid`.
2. Navigeer naar Dashboard → Leden.

**Verwacht resultaat:**

- De sectie "Wachtwoord-resetmail sturen" is niet zichtbaar op de pagina.
