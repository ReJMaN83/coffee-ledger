import express from 'express'
import { Blockchain } from './blockchain.js'
import { validateTransaction } from './middleware/validateTransaction.js'

export function createApp() {
  const app = express()
  const blockchain = new Blockchain()

  app.use(express.json())

  app.get('/blockchain', (req, res) => {
    res.json({ chain: blockchain.chain, pendingTransactions: blockchain.pendingTransactions })
  })

  app.post('/transactions', validateTransaction, (req, res) => {
    const { sender, recipient, batchId, weightKg } = req.body
    const transaction = { sender, recipient, batchId, weightKg }
    blockchain.addTransaction(transaction)
    res.status(201).json({ transaction })
  })

  app.post('/mine', (req, res) => {
    const block = blockchain.minePendingTransactions()
    res.status(201).json(block)
  })

  return app
}

export const app = createApp()
