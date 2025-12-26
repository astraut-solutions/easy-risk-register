const { getSupabaseAdmin } = require('../_lib/supabase')

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (chunks.length === 0) return null

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  return JSON.parse(raw)
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const body = await readJsonBody(req)
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Expected JSON body' })
    }

    const riskId = typeof body.riskId === 'string' ? body.riskId : ''
    const probability = Number(body.probability)
    const impact = Number(body.impact)
    const riskScore = Number(body.riskScore)
    const timestamp = Number(body.timestamp)
    const category = typeof body.category === 'string' ? body.category : undefined
    const status = typeof body.status === 'string' ? body.status : undefined

    if (!riskId) return res.status(400).json({ error: '`riskId` is required' })
    if (!Number.isFinite(probability)) return res.status(400).json({ error: '`probability` must be a number' })
    if (!Number.isFinite(impact)) return res.status(400).json({ error: '`impact` must be a number' })
    if (!Number.isFinite(riskScore)) return res.status(400).json({ error: '`riskScore` must be a number' })

    const supabase = getSupabaseAdmin()

    const row = {
      risk_id: riskId,
      probability: Math.trunc(probability),
      impact: Math.trunc(impact),
      risk_score: Math.trunc(riskScore),
      timestamp: Math.trunc(Number.isFinite(timestamp) ? timestamp : Date.now()),
      category: category || null,
      status: status || null,
    }

    const { error } = await supabase.from('risk_trends').insert(row)
    if (error) {
      return res.status(502).json({ error: `Supabase insert failed: ${error.message}` })
    }

    return res.status(204).end()
  } catch (error) {
    const message = error?.code === 'MISSING_ENV' ? error.message : 'Failed to write time-series data'
    return res.status(500).json({ error: message })
  }
}
