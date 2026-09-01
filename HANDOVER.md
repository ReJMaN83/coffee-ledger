# HANDOVER

_Senast uppdaterad: 2026-09-01_

## Status

**Inlämning 1 är komplett och pushad** till https://github.com/ReJMaN83/coffee-ledger (branch `main`, 11 commits).

- Blockkedja med SHA-256-hash, Proof-of-Work-mining och kedjevalidering
- Express-API (`GET /blockchain`, `POST /transactions`, `POST /mine`) med valideringsmiddleware
- Strikt TDD: fyra red/green-commit-par, länkade i README
- 25 tester gröna (Vitest + supertest)
- TESTING.md med red-green-bevis per par, testsvitens struktur och manuell API-verifiering med verkliga svar (länkad från README)

## Coverage (`npm run coverage`)

| Mätning    | Täckning      |
| ---------- | ------------- |
| Statements | 100 % (51/51) |
| Branches   | 100 % (19/19) |
| Functions  | 100 % (13/13) |
| Lines      | 100 % (50/50) |

## Återstår (manuellt)

- [ ] Lämna in på itslearning
- [ ] Bjuda in läraren som collaborator på GitHub-repot

## Nästa steg

Inlämning 2: databas.
