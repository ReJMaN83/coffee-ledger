import { calculateHash } from './hash.js'

export class Block {
  constructor(index, timestamp, transactions, previousHash) {
    this.index = index
    this.timestamp = timestamp
    this.transactions = transactions
    this.previousHash = previousHash
    this.nonce = 0
    this.hash = calculateHash(this)
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty)
    while (!this.hash.startsWith(target)) {
      this.nonce++
      this.hash = calculateHash(this)
    }
  }
}
