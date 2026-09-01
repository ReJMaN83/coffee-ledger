import { describe, it, expect } from 'vitest'
import { Block } from '../src/block.js'
import { calculateHash } from '../src/hash.js'

describe('Block', () => {
  const transactions = [{ from: 'alice', to: 'bob', amount: 2 }]

  function createBlock() {
    return new Block(1, '2026-09-01T00:00:00.000Z', transactions, '0'.repeat(64))
  }

  it('is created with index, timestamp, transactions, previousHash, nonce 0 and a calculated hash', () => {
    const block = createBlock()

    expect(block.index).toBe(1)
    expect(block.timestamp).toBe('2026-09-01T00:00:00.000Z')
    expect(block.transactions).toEqual(transactions)
    expect(block.previousHash).toBe('0'.repeat(64))
    expect(block.nonce).toBe(0)
    expect(block.hash).toBe(
      calculateHash({
        index: block.index,
        previousHash: block.previousHash,
        transactions: block.transactions,
        nonce: block.nonce,
      })
    )
  })

  it('mineBlock(2) produces a hash starting with "00"', () => {
    const block = createBlock()
    block.mineBlock(2)

    expect(block.hash.startsWith('00')).toBe(true)
  })

  it('mineBlock increments the nonce from 0', () => {
    const block = createBlock()
    block.mineBlock(2)

    expect(block.nonce).toBeGreaterThan(0)
  })

  it('keeps the hash field consistent with calculateHash after mining', () => {
    const block = createBlock()
    block.mineBlock(2)

    expect(block.hash).toBe(
      calculateHash({
        index: block.index,
        previousHash: block.previousHash,
        transactions: block.transactions,
        nonce: block.nonce,
      })
    )
  })
})
