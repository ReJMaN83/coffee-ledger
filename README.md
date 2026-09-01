# Coffee Ledger ☕

En decentraliserad logistikliggare för Fair Trade-kaffe, byggd som en enkel blockkedja med Proof-of-Work. Varje transaktion beskriver en förflyttning av en kaffebatch (t.ex. från odlare till rosteri) och minas in i block som kedjas ihop med SHA-256-hashar — manipulering av historiken upptäcks av kedjevalideringen.

Byggd med Node.js (ESM), Express och Vitest, strikt enligt TDD (se [TDD: Red-Green-commits](#tdd-red-green-commits)).

## Installation & körning

```bash
npm install
npm start          # startar servern på port 3000 (eller PORT-env)
npm test           # kör alla tester
npm run coverage   # tester + täckningsrapport
```

## API

### GET /blockchain

Returnerar hela kedjan och de väntande transaktionerna.

```bash
curl http://localhost:3000/blockchain
```

```json
{
  "chain": [ { "index": 0, "timestamp": 1788268381001, "transactions": [], "previousHash": "0", "nonce": 0, "hash": "66c1..." } ],
  "pendingTransactions": []
}
```

### POST /transactions

Lägger till en transaktion i kön av väntande transaktioner. Svarar `201` med transaktionen.

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{ "sender": "farm-01", "recipient": "roastery-01", "batchId": "batch-42", "weightKg": 60 }'
```

Valideringsmiddleware ger `400` med `{ "error": "..." }` om:

- `sender`, `recipient` eller `batchId` saknas eller inte är icke-tomma strängar
- `weightKg` inte är ett positivt tal (t.ex. `-5` eller `"abc"`)
- request-body saknas helt

### POST /mine

Minar alla väntande transaktioner till ett nytt block, lägger blocket i kedjan och tömmer kön. Svarar `201` med det nya blocket.

```bash
curl -X POST http://localhost:3000/mine
```

## Proof-of-Work

`Block.mineBlock(difficulty)` är en while-loop: så länge blockets hash inte börjar med `difficulty` stycken nollor ökas `nonce` med 1 och hashen räknas om med `calculateHash` (SHA-256 över `index + previousHash + JSON.stringify(transactions) + nonce`). Eftersom hashen är oförutsägbar är enda sättet att hitta en giltig hash att prova nonce efter nonce — det är arbetsbeviset.

Svårighetsgraden styrs i `Blockchain`-konstruktorn:

- `NODE_ENV=test` → difficulty **1** (snabba tester)
- annars → värdet i `DIFFICULTY`-env, eller **2** som standard

`Blockchain.isChainValid()` verifierar kedjan genom att för varje block räkna om hashen och jämföra `previousHash` mot föregående blocks hash.

## Testning

Testerna är skrivna med **Vitest** (enhetstester) och **supertest** (integrationstester mot Express-appen utan att starta en riktig server). API-testerna skapar en färsk app och blockkedja per test via `createApp()` så att inga tester delar state.

Aktuell täckning (`npm run coverage`, v8):

| Mätning    | Täckning        |
| ---------- | --------------- |
| Statements | 100 % (51/51)   |
| Branches   | 100 % (19/19)   |
| Functions  | 100 % (13/13)   |
| Lines      | 100 % (50/50)   |

## TDD: Red-Green-commits

Projektet är byggt strikt test-först. Varje funktion har ett commit-par: först committas ett failande test (red), därefter implementationen som får det grönt (green).

1. **calculateHash** — SHA-256-hashfunktionen: determinism, nonce-känslighet, 64 tecken hex.
   - Red: [test: add failing unit tests for calculateHash](https://github.com/ReJMaN83/coffee-ledger/commit/ede18ed9b7aaa0dfe40bc81cad696c353971201e)
   - Green: [feat: implement calculateHash with node:crypto](https://github.com/ReJMaN83/coffee-ledger/commit/694895ee05b7617e174501820eb93157113b5561)
2. **Block.mineBlock** — blockets fält och Proof-of-Work-loopen som hittar en hash som uppfyller difficulty.
   - Red: [test: add failing unit tests for Block.mineBlock](https://github.com/ReJMaN83/coffee-ledger/commit/05f564f6ef1f69291ba76dafdea854987765e78a)
   - Green: [feat: implement Block class with PoW mining loop](https://github.com/ReJMaN83/coffee-ledger/commit/cb0309f225c3dd24e774f2e6aa3ad0ad5a80a541)
3. **Blockchain** — genesis-block, transaktioner, mining av väntande transaktioner och kedjevalidering med manipuleringsskydd.
   - Red: [test: add failing unit tests for Blockchain class](https://github.com/ReJMaN83/coffee-ledger/commit/3c2f074a10615f8060a7c1c29aa028f56b2a3913)
   - Green: [feat: implement Blockchain class](https://github.com/ReJMaN83/coffee-ledger/commit/06633c5455dee5b3ea90d2173570d7ddde696f07)
4. **Express-API** — de tre endpointsen och valideringsmiddlewaren, testade med supertest.
   - Red: [test: add failing integration tests for API endpoints](https://github.com/ReJMaN83/coffee-ledger/commit/6779a4d4287906b6c162443816c740afd79d36c3)
   - Green: [feat: implement Express API with validation middleware](https://github.com/ReJMaN83/coffee-ledger/commit/79b52c7cf873a8fb44b69ce7294c653ff04c6ef8)
