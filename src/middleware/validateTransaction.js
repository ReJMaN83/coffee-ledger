export function validateTransaction(req, res, next) {
  const { sender, recipient, batchId, weightKg } = req.body ?? {}

  for (const [field, value] of Object.entries({ sender, recipient, batchId })) {
    if (typeof value !== 'string' || value.trim() === '') {
      return res.status(400).json({ error: `${field} is required and must be a non-empty string` })
    }
  }

  if (typeof weightKg !== 'number' || !Number.isFinite(weightKg) || weightKg <= 0) {
    return res.status(400).json({ error: 'weightKg must be a positive number' })
  }

  next()
}
