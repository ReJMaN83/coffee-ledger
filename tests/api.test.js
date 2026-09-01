import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

describe('Coffee Ledger API', () => {
  const transaction = { sender: 'farm-01', recipient: 'roastery-01', batchId: 'batch-42', weightKg: 60 }

  let app
  beforeEach(() => {
    app = createApp()
  })

  describe('GET /blockchain', () => {
    it('returns the chain with the genesis block and pendingTransactions', async () => {
      const res = await request(app).get('/blockchain')

      expect(res.status).toBe(200)
      expect(res.body.chain).toHaveLength(1)
      expect(res.body.chain[0].index).toBe(0)
      expect(res.body.pendingTransactions).toEqual([])
    })
  })

  describe('POST /transactions', () => {
    it('accepts a valid transaction and adds it to pendingTransactions', async () => {
      const res = await request(app).post('/transactions').send(transaction)
      expect(res.status).toBe(201)

      const chainRes = await request(app).get('/blockchain')
      expect(chainRes.body.pendingTransactions).toEqual([transaction])
    })

    it('rejects a transaction without batchId', async () => {
      const { batchId, ...rest } = transaction
      const res = await request(app).post('/transactions').send(rest)

      expect(res.status).toBe(400)
      expect(res.body.error).toBeDefined()
    })

    it('rejects a transaction without sender or recipient', async () => {
      const { sender, ...noSender } = transaction
      const { recipient, ...noRecipient } = transaction

      expect((await request(app).post('/transactions').send(noSender)).status).toBe(400)
      expect((await request(app).post('/transactions').send(noRecipient)).status).toBe(400)
    })

    it('rejects a transaction where weightKg is not a positive number', async () => {
      expect(
        (await request(app).post('/transactions').send({ ...transaction, weightKg: -5 })).status
      ).toBe(400)
      expect(
        (await request(app).post('/transactions').send({ ...transaction, weightKg: 'abc' })).status
      ).toBe(400)
    })
  })

  describe('POST /mine', () => {
    it('mines pending transactions into a new block and clears them', async () => {
      await request(app).post('/transactions').send(transaction)

      const res = await request(app).post('/mine')
      expect(res.status).toBe(201)
      expect(res.body.transactions).toEqual([transaction])

      const chainRes = await request(app).get('/blockchain')
      expect(chainRes.body.chain).toHaveLength(2)
      expect(chainRes.body.pendingTransactions).toEqual([])
    })

    it('returns a block whose hash meets the difficulty', async () => {
      await request(app).post('/transactions').send(transaction)

      const res = await request(app).post('/mine')
      expect(res.body.hash.startsWith('0')).toBe(true)
    })
  })
})
