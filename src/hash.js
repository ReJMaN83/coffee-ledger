import { createHash } from 'node:crypto'

export function calculateHash({ index, previousHash, transactions, nonce }) {
  return createHash('sha256')
    .update(index + previousHash + JSON.stringify(transactions) + nonce)
    .digest('hex')
}
