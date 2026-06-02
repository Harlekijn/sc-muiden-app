# Teams importeren — testscenario's

---

# Scenario: Geldige CSV succesvol importeren

**Scenario ID:** S01-A
**Feature:** Teams importeren via CSV
**Rol:** beheerder

## Stappen

```gherkin
Functionaliteit: Teams importeren via CSV — succesvol pad

  Scenario: Beheerder importeert een geldige CSV met nieuwe teams

    Gegeven de beheerder is ingelogd en bevindt zich op /dashboard/teams/importeren/
    En de tabel teams bevat geen rijen met name='Heren 1', sport='voetbal', season='2025-2026'
    En de tabel teams bevat geen rijen met name='Dames 1', sport='hockey', season='2025-2026'

    Als de beheerder een CSV-bestand uploadt met koptekstrij "name,sport,age_category,season"
      en rijen:
        | name     | sport    | age_category | season    |
        | Heren 1  | voetbal  | senioren     | 2025-2026 |
        | Dames 1  | hockey   | senioren     | 2025-2026 |

    Dan toont de wizard de kolomkoppelingsstap
    En de kolommen "name" en "sport" zijn automatisch gekoppeld

    Als de beheerder de kolomkoppeling bevestigt en klikt op "Analyseren"
    Dan toont de wizard een importpreview met:
      | naam     | status |
      | Heren 1  | Nieuw  |
      | Dames 1  | Nieuw  |

    Als de beheerder klikt op "Importeren"
    Dan toont de resultaatpagina "2 nieuwe teams toegevoegd. 0 teams bijgewerkt."
    En de wizard staat op stap "done"
```

## Verwacht resultaat

- Twee nieuwe rijen aanwezig in de tabel `teams` met `deleted_at IS NULL`.
- `name = 'Heren 1'`, `sport = 'voetbal'`, `age_category = 'senioren'`, `season = '2025-2026'`.
- `name = 'Dames 1'`, `sport = 'hockey'`, `age_category = 'senioren'`, `season = '2025-2026'`.
- Geen rijen in de `failed`-lijst van het importresultaat.

## Verificatie via Supabase Studio

- Controleer tabel `teams`: filter op `name IN ('Heren 1', 'Dames 1')` — beide rijen aanwezig, `deleted_at IS NULL`.
- Controleer `created_at` van beide rijen: tijdstip valt binnen de testrun.

---

# Scenario: Duplicate conflicten behandelen — overschrijven

**Scenario ID:** S01-B
**Feature:** Teams importeren via CSV — conflictafhandeling (overschrijven)
**Rol:** beheerder

## Stappen

```gherkin
Functionaliteit: Teams importeren — conflictrij overschrijven

  Scenario: CSV-rij matcht bestaand team op federation_team_id; beheerder kiest overschrijven

    Gegeven de beheerder is ingelogd en bevindt zich op /dashboard/teams/importeren/
    En de tabel teams bevat een rij met:
      | id         | name     | sport   | season    | federation_team_id | deleted_at |
      | <uuid-A>   | Heren 1  | voetbal | 2024-2025 | KNVB-12345         | NULL       |

    Als de beheerder een CSV uploadt met rij:
      | name    | sport   | season    | federation_team_id | age_category |
      | Heren 1 | voetbal | 2025-2026 | KNVB-12345         | senioren     |

    En de beheerder klikt op "Analyseren"
    Dan toont de wizard een importpreview met:
      | naam    | status   | conflictreden                    |
      | Heren 1 | Conflict | Zelfde federation_team_id        |

    Als de beheerder het selectievakje naast "Heren 1" aanvinkt
    En de beheerder klikt op "Importeren"
    Dan toont de resultaatpagina "0 nieuwe teams toegevoegd. 1 team bijgewerkt."
```

## Verwacht resultaat

- Rij met `id = <uuid-A>` in tabel `teams` is bijgewerkt: `season = '2025-2026'`, `age_category = 'senioren'`.
- `deleted_at` blijft `NULL`.
- `updated_at` is vernieuwd.
- Geen nieuwe rij aangemaakt.

## Verificatie via Supabase Studio

- Controleer tabel `teams`: filter op `federation_team_id = 'KNVB-12345'` — slechts één rij, `season = '2025-2026'`, `age_category = 'senioren'`, `deleted_at IS NULL`.

---

# Scenario: Duplicate conflicten behandelen — overslaan

**Scenario ID:** S01-C
**Feature:** Teams importeren via CSV — conflictafhandeling (overslaan)
**Rol:** beheerder

## Stappen

```gherkin
Functionaliteit: Teams importeren — conflictrij overslaan

  Scenario: CSV-rij matcht bestaand team; beheerder kiest overslaan

    Gegeven de beheerder is ingelogd en bevindt zich op /dashboard/teams/importeren/
    En de tabel teams bevat een rij met:
      | id       | name    | sport   | season    | age_category |
      | <uuid-B> | Dames 2 | hockey  | 2025-2026 | junioren     |

    Als de beheerder een CSV uploadt met rij:
      | name    | sport  | season    | age_category |
      | Dames 2 | hockey | 2025-2026 | senioren     |

    En de beheerder klikt op "Analyseren"
    Dan toont de wizard een importpreview met:
      | naam    | status   | conflictreden                        |
      | Dames 2 | Conflict | Zelfde naam, sport en seizoen        |

    Als de beheerder het selectievakje naast "Dames 2" NIET aanvinkt
    En de beheerder klikt op "Importeren"
    Dan toont de resultaatpagina "0 nieuwe teams toegevoegd. 0 teams bijgewerkt."
```

## Verwacht resultaat

- Rij met `id = <uuid-B>` in tabel `teams` is ongewijzigd: `age_category = 'junioren'`.
- Geen nieuwe rij aangemaakt.

## Verificatie via Supabase Studio

- Controleer tabel `teams`: filter op `name = 'Dames 2' AND sport = 'hockey'` — `age_category` is nog steeds `'junioren'`.

---

# Scenario: Zacht-verwijderd team herleven via import

**Scenario ID:** S01-D
**Feature:** Teams importeren via CSV — herleving van verwijderd team
**Rol:** beheerder

## Stappen

```gherkin
Functionaliteit: Teams importeren — zacht-verwijderd team herleven

  Scenario: CSV-rij matcht een zacht-verwijderd team; beheerder kiest overschrijven

    Gegeven de beheerder is ingelogd en bevindt zich op /dashboard/teams/importeren/
    En de tabel teams bevat een rij met:
      | id       | name    | sport   | season    | deleted_at              |
      | <uuid-C> | Jongens U17 | voetbal | 2025-2026 | 2026-01-15T10:00:00Z |

    Als de beheerder een CSV uploadt met rij:
      | name        | sport   | season    | age_category |
      | Jongens U17 | voetbal | 2025-2026 | junioren     |

    En de beheerder klikt op "Analyseren"
    Dan toont de wizard een importpreview met:
      | naam        | status   |
      | Jongens U17 | Conflict |

    Als de beheerder het selectievakje naast "Jongens U17" aanvinkt
    En de beheerder klikt op "Importeren"
    Dan toont de resultaatpagina "0 nieuwe teams toegevoegd. 1 team bijgewerkt."
```

## Verwacht resultaat

- Rij met `id = <uuid-C>` heeft `deleted_at = NULL` na de import.
- `age_category = 'junioren'` is bijgewerkt.
- Geen nieuwe rij aangemaakt.

## Verificatie via Supabase Studio

- Controleer tabel `teams`: filter op `id = '<uuid-C>'` — `deleted_at IS NULL`, `age_category = 'junioren'`.

---

# Scenario: Ongeldige CSV-rijen worden afgewezen

**Scenario ID:** S01-E
**Feature:** Teams importeren via CSV — validatiefouten
**Rol:** beheerder

## Stappen

```gherkin
Functionaliteit: Teams importeren — ongeldige rijen

  Scenario: CSV bevat rijen met ontbrekende verplichte velden en ongeldige sport-waarde

    Gegeven de beheerder is ingelogd en bevindt zich op /dashboard/teams/importeren/

    Als de beheerder een CSV uploadt met rijen:
      | name       | sport   | season    |
      |            | voetbal | 2025-2026 |  <- ontbrekende name
      | Heren 3    | tennis  | 2025-2026 |  <- ongeldige sport
      | Dames 3    | hockey  | 2025-2026 |  <- geldig

    En de beheerder klikt op "Analyseren"
    Dan toont de preview:
      | naam    | status   | foutmelding                        |
      | (leeg)  | Ongeldig | Naam is verplicht                  |
      | Heren 3 | Ongeldig | Ongeldige sport waarde             |
      | Dames 3 | Nieuw    |                                    |

    Als de beheerder klikt op "Importeren"
    Dan toont de resultaatpagina "1 nieuw team toegevoegd. 0 teams bijgewerkt."
    En de resultaatpagina toont "2 rijen niet geïmporteerd"
```

## Verwacht resultaat

- Alleen `Dames 3` is ingevoegd in de tabel `teams`.
- Geen rijen met lege `name` of `sport = 'tennis'` aanwezig.

## Verificatie via Supabase Studio

- Controleer tabel `teams`: filter op `season = '2025-2026'` — slechts `Dames 3` aanwezig als nieuwe rij.
- Verifieer dat geen rij met `name = ''` of `sport = 'tennis'` bestaat.

---

# Scenario: Gedeeltelijke import met databasefout op één rij

**Scenario ID:** S01-F
**Feature:** Teams importeren via CSV — gedeeltelijke mislukking
**Rol:** beheerder

## Stappen

```gherkin
Functionaliteit: Teams importeren — gedeeltelijke mislukking

  Scenario: Import van drie rijen waarbij de tweede rij een databasefout veroorzaakt

    Gegeven de beheerder is ingelogd en bevindt zich op /dashboard/teams/importeren/
    En rij 2 in het CSV-bestand veroorzaakt een unique-constraint-schending (23505) bij opslaan

    Als de beheerder drie geldige rijen importeert
    Dan worden rij 1 en rij 3 succesvol opgeslagen
    En rij 2 verschijnt in de "niet geïmporteerd"-lijst met de melding
      "E-mailadres of ClubBase-ID bestaat al in de database."
    En de resultaatpagina toont "2 nieuwe teams toegevoegd. 1 rij niet geïmporteerd."
```

## Verwacht resultaat

- Twee nieuwe rijen in de tabel `teams`.
- Eén rij mislukt; overige rijen zijn niet teruggedraaid (geen transactie over alle rijen).

## Verificatie via Supabase Studio

- Controleer tabel `teams`: twee van de drie verwachte rijen aanwezig.
- Controleer de serverlogboeken: `[cms-teams-import] row_index=1 outcome=insert_failed pg_code=23505`.

---

# Scenario: Onbevoegde toegang tot importendpoint

**Scenario ID:** S01-G
**Feature:** Teams importeren via CSV — toegangsbeveiliging
**Rol:** lid (niet-beheerder)

## Stappen

```gherkin
Functionaliteit: Teams importeren — toegangsbeveiliging

  Scenario: Gebruiker met rol 'lid' probeert het importendpoint te benaderen

    Gegeven een gebruiker is ingelogd met rol 'lid'

    Als de gebruiker een POST stuurt naar /api/cms/teams/import/analyse
      met een geldig JSON-body { "rows": [] }
    Dan retourneert het systeem HTTP 403
    En de responsebody bevat { "error": "Geen toegang." }

    Als de gebruiker een POST stuurt naar /api/cms/teams/import
      met een geldig JSON-body { "rows": [], "selectedConflicts": [] }
    Dan retourneert het systeem HTTP 403
    En de responsebody bevat { "error": "Geen toegang." }
```

## Verwacht resultaat

- Geen wijzigingen in de tabel `teams`.
- Beide endpoints retourneren 403 voor niet-beheerder-rollen.

## Verificatie via Supabase Studio

- Controleer tabel `teams`: geen nieuwe rijen aangemaakt tijdens de testrun.

---

# Scenario: Niet-ingelogde gebruiker wordt doorgestuurd

**Scenario ID:** S01-H
**Feature:** Teams importeren via CSV — authenticatiebeveiliging
**Rol:** anoniem

## Stappen

```gherkin
Functionaliteit: Teams importeren — authenticatiebeveiliging

  Scenario: Niet-ingelogde bezoeker probeert de importpagina te openen

    Gegeven geen actieve sessie aanwezig in de browser

    Als de bezoeker navigeert naar /dashboard/teams/importeren/
    Dan wordt hij doorgestuurd naar /login
    En de importpagina is niet zichtbaar

    Als de bezoeker een POST stuurt naar /api/cms/teams/import/analyse zonder Authorization-header
    Dan retourneert het systeem HTTP 401
    En de responsebody bevat { "error": "Niet ingelogd." }
```

## Verwacht resultaat

- De importwizard is niet bereikbaar zonder actieve sessie.
- Beide endpoints retourneren 401 bij een ontbrekende sessie.

## Verificatie via Supabase Studio

- Geen wijzigingen in de tabel `teams` door deze testrun.
