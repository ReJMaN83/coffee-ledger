import { describe, it, expect, vi, afterEach } from 'vitest'
import { Blockchain } from '../src/blockchain.js'
import { calculateHash } from '../src/hash.js'

describe('Blockchain', () => {
  const transaction = { sender: 'farm-01', recipient: 'roastery-01', batchId: 'batch-42', weightKg: 60 }

  it('starts with a genesis block and empty pendingTransactions', () => {
    const chain = new Blockchain()

    expect(chain.chain.length).toBe(1)
    expect(chain.pendingTransactions).toEqual([])
  })

  it('has difficulty 1 when NODE_ENV is test', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(new Blockchain().difficulty).toBe(1)
  })

  describe('when NODE_ENV is not test', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('uses the DIFFICULTY env variable when set', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('DIFFICULTY', '3')

      expect(new Blockchain().difficulty).toBe(3)
    })

    it('falls back to difficulty 2 when DIFFICULTY is not a number', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('DIFFICULTY', '')

      expect(new Blockchain().difficulty).toBe(2)
    })
  })

  it('addTransaction adds the transaction to pendingTransactions', () => {
    const chain = new Blockchain()
    chain.addTransaction(transaction)

    expect(chain.pendingTransactions).toEqual([transaction])
  })

  it('minePendingTransactions mines a block with the pending transactions and clears them', () => {
    const chain = new Blockchain()
    chain.addTransaction(transaction)
    const block = chain.minePendingTransactions()

    expect(block.transactions).toEqual([transaction])
    expect(chain.chain.length).toBe(2)
    expect(chain.chain[1]).toBe(block)
    expect(chain.pendingTransactions).toEqual([])
  })

  it('mined block links to the previous block and meets the difficulty', () => {
    const chain = new Blockchain()
    chain.addTransaction(transaction)
    const block = chain.minePendingTransactions()

    expect(block.previousHash).toBe(chain.chain[0].hash)
    expect(block.hash.startsWith('0'.repeat(chain.difficulty))).toBe(true)
  })

  it('isChainValid returns true for an untampered chain', () => {
    const chain = new Blockchain()
    chain.addTransaction(transaction)
    chain.minePendingTransactions()

    expect(chain.isChainValid()).toBe(true)
  })

  it('isChainValid returns false when transaction data is tampered with', () => {
    const chain = new Blockchain()
    chain.addTransaction(transaction)
    chain.minePendingTransactions()

    chain.chain[1].transactions = [{ ...transaction, weightKg: 999 }]

    expect(chain.isChainValid()).toBe(false)
  })

  it('isChainValid returns false when previousHash does not match the previous block hash', () => {
    const chain = new Blockchain()
    chain.addTransaction(transaction)
    chain.minePendingTransactions()

    const block = chain.chain[1]
    block.previousHash = 'f'.repeat(64)
    block.hash = calculateHash(block)

    expect(chain.isChainValid()).toBe(false)
  })
})
