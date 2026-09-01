import { describe, it, expect } from 'vitest'
import { calculateHash } from '../src/hash.js'

describe('calculateHash', () => {
  const block = {
    index: 1,
    previousHash: '0'.repeat(64),
    transactions: [{ from: 'alice', to: 'bob', amount: 2 }],
    nonce: 0,
  }

  it('returns the same hash for the same input', () => {
    expect(calculateHash(block)).toBe(calculateHash({ ...block }))
  })

  it('returns a different hash when the nonce changes', () => {
    expect(calculateHash(block)).not.toBe(calculateHash({ ...block, nonce: 1 }))
  })

  it('returns a 64-character hex string (SHA-256)', () => {
    expect(calculateHash(block)).toMatch(/^[0-9a-f]{64}$/)
  })
})
