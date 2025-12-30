const { supabaseErrorToApiError } = require('./apiErrors')

async function getWorkspaceRole({ supabase, workspaceId, userId }) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) return { error: supabaseErrorToApiError(error, { action: 'query' }) }
  const role = typeof data?.role === 'string' ? data.role : null
  return { role }
}

function isAuditViewerRole(role) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

function sanitizeRiskAuditPayload(riskRow) {
  if (!riskRow || typeof riskRow !== 'object') return {}

  const probability = Number(riskRow.probability)
  const impact = Number(riskRow.impact)
  const riskScore = Number(riskRow.risk_score)

  const safe = {
    id: typeof riskRow.id === 'string' ? riskRow.id : undefined,
    title: typeof riskRow.title === 'string' ? riskRow.title : undefined,
    category: typeof riskRow.category === 'string' ? riskRow.category : undefined,
    status: typeof riskRow.status === 'string' ? riskRow.status : undefined,
    threatType: typeof riskRow.threat_type === 'string' ? riskRow.threat_type : undefined,
    probability: Number.isFinite(probability) ? probability : undefined,
    impact: Number.isFinite(impact) ? impact : undefined,
    riskScore: Number.isFinite(riskScore) ? riskScore : undefined,
  }

  return Object.fromEntries(Object.entries(safe).filter(([, v]) => v !== undefined))
}

function sanitizeRiskUpdateAuditPayload({ updates }) {
  if (!updates || typeof updates !== 'object') return { updatedFields: [] }

  const updatedFields = Object.keys(updates).sort()
  const safeValueFields = new Set([
    'title',
    'category',
    'status',
    'threat_type',
    'probability',
    'impact',
    'last_reviewed_at',
    'next_review_at',
    'review_interval_days',
  ])

  const safeValues = {}
  for (const key of updatedFields) {
    if (!safeValueFields.has(key)) continue
    safeValues[key] = updates[key]
  }

  const payload = { updatedFields }
  if (Object.keys(safeValues).length > 0) payload.safeValues = safeValues
  return payload
}

async function insertAuditEvent({ supabase, workspaceId, riskId, eventType, payload }) {
  const insertRow = {
    workspace_id: workspaceId,
    risk_id: riskId ?? null,
    event_type: eventType,
    payload: payload && typeof payload === 'object' ? payload : {},
  }

  const { error } = await supabase.from('audit_events').insert(insertRow)
  if (error) return { error: supabaseErrorToApiError(error, { action: 'insert' }) }
  return { ok: true }
}

module.exports = {
  getWorkspaceRole,
  insertAuditEvent,
  isAuditViewerRole,
  sanitizeRiskAuditPayload,
  sanitizeRiskUpdateAuditPayload,
}

