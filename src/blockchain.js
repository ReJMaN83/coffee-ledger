import { Block } from './block.js'
import { calculateHash } from './hash.js'

export class Blockchain {
  constructor() {
    this.difficulty =
      process.env.NODE_ENV === 'test' ? 1 : parseInt(process.env.DIFFICULTY) || 2
    this.chain = [new Block(0, Date.now(), [], '0')]
    this.pendingTransactions = []
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1]
  }

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction)
  }

  minePendingTransactions() {
    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    )
    block.mineBlock(this.difficulty)
    this.chain.push(block)
    this.pendingTransactions = []
    return block
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i]
      if (block.hash !== calculateHash(block)) {
        return false
      }
      if (block.previousHash !== this.chain[i - 1].hash) {
        return false
      }
    }
    return true
  }
}
