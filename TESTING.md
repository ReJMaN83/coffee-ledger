# Testning — arbetssätt och bevis

## 1. Arbetssätt (red-green-refactor)

Projektet är byggt strikt test-först. För varje funktionsdel (hashfunktion, block/mining, blockkedja, API) skrevs testerna **först** och committades i ett läge där de bevisligen failade — modulen som testerna importerar fanns inte ännu, så testkörningen gav `Cannot find module`. Därefter implementerades produktionskoden i en **separat commit** tills alla tester var gröna.

Verifieringen gjordes genom att faktiskt köra `npm test` före och efter varje implementations-commit: rött utfall verifierades innan test-committen gjordes, grönt utfall innan implementations-committen. Commit-historiken visar därmed att varje test är skrivet och committat före sin implementation.

## 2. Red-green-bevis per par

| Vad som testades | Röd commit | Utfall vid röd | Grön commit | Utfall vid grön |
| --- | --- | --- | --- | --- |
| `calculateHash` — determinism, nonce-känslighet, 64 tecken hex | [ede18ed](https://github.com/ReJMaN83/coffee-ledger/commit/ede18ed9b7aaa0dfe40bc81cad696c353971201e) | 1 failed — `Cannot find module '../src/hash.js'` | [694895e](https://github.com/ReJMaN83/coffee-ledger/commit/694895ee05b7617e174501820eb93157113b5561) | 3 passed |
| `Block.mineBlock` — blockets fält, PoW-loop, difficulty, nonce | [05f564f](https://github.com/ReJMaN83/coffee-ledger/commit/05f564f6ef1f69291ba76dafdea854987765e78a) | 1 failed \| 1 passed — `Cannot find module '../src/block.js'` (hash-testerna gröna: 3 passed) | [cb0309f](https://github.com/ReJMaN83/coffee-ledger/commit/cb0309f225c3dd24e774f2e6aa3ad0ad5a80a541) | 7 passed |
| `Blockchain` — genesis, transaktioner, mining, kedjevalidering | [3c2f074](https://github.com/ReJMaN83/coffee-ledger/commit/3c2f074a10615f8060a7c1c29aa028f56b2a3913) | 1 failed \| 2 passed — `Cannot find module '../src/blockchain.js'` (7 passed) | [06633c5](https://github.com/ReJMaN83/coffee-ledger/commit/06633c5455dee5b3ea90d2173570d7ddde696f07) | 15 passed |
| Express-API — endpoints och valideringsmiddleware | [6779a4d](https://github.com/ReJMaN83/coffee-ledger/commit/6779a4d4287906b6c162443816c740afd79d36c3) | 1 failed \| 3 passed — `Cannot find module '../src/app.js'` (15 passed) | [79b52c7](https://github.com/ReJMaN83/coffee-ledger/commit/79b52c7cf873a8fb44b69ce7294c653ff04c6ef8) | 22 passed |

Därefter lades två täckningstester till i [53b08b6](https://github.com/ReJMaN83/coffee-ledger/commit/53b08b6599ebff5e3b944e79e57f51203d8f8556) (difficulty-grenarna och tom request-body), vilket ger slutläget **25 passed** och 100 % branch-täckning.

## 3. Testsvitens struktur

**Enhetstester:**

- `tests/hash.test.js` — `calculateHash`: samma indata ger samma hash, ändrat nonce ger annan hash, resultatet är en 64 tecken lång hex-sträng (SHA-256).
- `tests/block.test.js` — `Block`: konstruktorns fält (index, timestamp, transactions, previousHash, nonce = 0, korrekt starthash), att `mineBlock(2)` ger en hash som börjar med `00`, att nonce ökar från 0, och att hash-fältet efter mining matchar `calculateHash` på blockets slutliga innehåll.
- `tests/blockchain.test.js` — `Blockchain`: genesis-block och tom transaktionskö, miljöstyrd difficulty, `addTransaction`, `minePendingTransactions` (nytt block med transaktionerna, kedjan växer, kön töms), länkning via previousHash, samt `isChainValid` för orörd kedja, manipulerad transaktionsdata och bruten previousHash-länk.

**Integrationstester:**

- `tests/api.test.js` — hela API:t testas med **supertest** direkt mot Express-appen, utan att binda en port. Täcker `GET /blockchain`, `POST /transactions` (giltig transaktion, saknad batchId/sender/recipient, ogiltig weightKg, helt utan body) och `POST /mine` (blocket innehåller transaktionerna, kedjan växer, kön töms, hashen uppfyller difficulty).

Varje API-test får en **färsk app och blockkedja** via `createApp()` i `beforeEach`, så inga tester delar state och ordningen mellan tester spelar ingen roll.

## 4. Miljöstyrd difficulty

`vitest.config.js` sätter `NODE_ENV=test` för alla testkörningar. `Blockchain`-konstruktorn läser miljön:

- `NODE_ENV=test` → difficulty **1** — mining hittar en giltig hash på i snitt 16 försök, så testsviten är snabb och riskerar inga timeouts.
- annars → värdet i `DIFFICULTY`-env, eller **2** som standard.

Produktionsgrenarna täcks av ett test som stubbar miljövariablerna med `vi.stubEnv('NODE_ENV', 'production')` respektive `vi.stubEnv('DIFFICULTY', ...)` och återställer med `vi.unstubAllEnvs()` i `afterEach`.

## 5. Coverage

`npm run coverage` (v8-provider, 25 tester i 4 testfiler):

```
Statements   : 100% ( 51/51 )
Branches     : 100% ( 19/19 )
Functions    : 100% ( 13/13 )
Lines        : 100% ( 50/50 )
```

## 6. Manuell verifiering av API:et

Utöver den automatiska testsviten verifierades hela flödet mot en körande server i produktionsläge (difficulty 2). Repot klonades även till en separat maskin och verifierades där. Verkliga svar från en lokal körning:

**`npm start`** (här med `PORT=3111`):

```
Coffee Ledger listening on port 3111
```

**POST /transactions med giltig body → 201:**

```bash
curl -X POST http://localhost:3111/transactions \
  -H "Content-Type: application/json" \
  -d '{ "sender": "farm-01", "recipient": "roastery-01", "batchId": "batch-42", "weightKg": 60 }'
```

```json
{ "transaction": { "sender": "farm-01", "recipient": "roastery-01", "batchId": "batch-42", "weightKg": 60 } }
```

**POST /mine → 201.** Det nya blocket innehåller transaktionen, `previousHash` matchar genesis-blockets hash, hashen börjar med `00` (difficulty 2) och nonce > 0:

```json
{
  "index": 1,
  "timestamp": 1788270171017,
  "transactions": [
    { "sender": "farm-01", "recipient": "roastery-01", "batchId": "batch-42", "weightKg": 60 }
  ],
  "previousHash": "66c1f978d80ce2da318e5c65283d0668fd5dfe593644ae9fd7496bd2f91be72b",
  "nonce": 65,
  "hash": "004ff64b16f0b54fdb16c6687883526360d1dac794a3e2fc735deb4042c9d6ad"
}
```

**GET /blockchain → 200.** Kedjan har 2 block (genesis-blockets hash `66c1f9...` återfinns som `previousHash` i block 1) och `pendingTransactions` är tömd:

```json
{
  "chain": [
    { "index": 0, "previousHash": "0", "nonce": 0, "hash": "66c1f978d80ce2da318e5c65283d0668fd5dfe593644ae9fd7496bd2f91be72b", "transactions": [] },
    { "index": 1, "previousHash": "66c1f978d80ce2da318e5c65283d0668fd5dfe593644ae9fd7496bd2f91be72b", "nonce": 65, "hash": "004ff64b16f0b54fdb16c6687883526360d1dac794a3e2fc735deb4042c9d6ad", "transactions": [ { "sender": "farm-01", "recipient": "roastery-01", "batchId": "batch-42", "weightKg": 60 } ] }
  ],
  "pendingTransactions": []
}
```

**POST /transactions utan batchId → 400:**

```json
{ "error": "batchId is required and must be a non-empty string" }
```
