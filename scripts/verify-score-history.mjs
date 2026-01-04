import process from 'node:process'
import crypto from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

const env = (key) => (process.env[key] ?? '').trim()

const SUPABASE_URL = env('SUPABASE_URL')
const SERVICE_KEY =
  env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SERVICE_KEY')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars: SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY).')
  process.exit(1)
}

const KEEP_DATA = env('KEEP_DATA') === 'true'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const nowIso = () => new Date().toISOString()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function chunk(array, size) {
  const batches = []
  for (let i = 0; i < array.length; i += size) batches.push(array.slice(i, i + size))
  return batches
}

async function main() {
  const runId = crypto.randomUUID().slice(0, 8)
  const userId = crypto.randomUUID()

  const startedAt = Date.now()
  console.log(`[score-history] start ${nowIso()} run=${runId}`)

  const workspaceName = `Perf workspace ${runId}`
  const { data: workspaceRow, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({ name: workspaceName, created_by: userId })
    .select('id')
    .single()
  if (workspaceError) throw workspaceError
  const workspaceId = workspaceRow.id

  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role: 'owner' })
  if (memberError) throw memberError

  console.log(`[score-history] workspace created ${workspaceId}`)

  const riskCount = 1000
  const risks = Array.from({ length: riskCount }, (_, i) => ({
    workspace_id: workspaceId,
    title: `Perf risk ${i + 1}`,
    description: '',
    probability: (i % 5) + 1,
    impact: ((i * 3) % 5) + 1,
    category: 'Operational',
    status: 'open',
    threat_type: 'other',
    data: {},
  }))

  const insertStarted = Date.now()
  let insertedIds = []
  for (const batch of chunk(risks, 200)) {
    const { data, error } = await supabase.from('risks').insert(batch).select('id')
    if (error) throw error
    insertedIds = insertedIds.concat((data ?? []).map((row) => row.id))
  }
  console.log(
    `[score-history] inserted ${insertedIds.length}/${riskCount} risks in ${Date.now() - insertStarted}ms`,
  )

  await sleep(250)

  const snapshotQueryStarted = Date.now()
  const { data: snapshotRows, error: snapshotError } = await supabase
    .from('risk_score_snapshots')
    .select('risk_id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .limit(5000)
  if (snapshotError) throw snapshotError
  console.log(
    `[score-history] queried snapshots in ${Date.now() - snapshotQueryStarted}ms (rows=${snapshotRows?.length ?? 0})`,
  )

  if ((snapshotRows?.length ?? 0) < 1000) {
    throw new Error(`Expected >=1000 snapshots after inserts; got ${snapshotRows?.length ?? 0}`)
  }

  const probeRiskId = insertedIds[0]
  if (!probeRiskId) throw new Error('No risk IDs returned from insert')

  for (let i = 0; i < 25; i += 1) {
    const probability = ((i + 1) % 5) + 1
    const { error } = await supabase
      .from('risks')
      .update({ probability })
      .eq('workspace_id', workspaceId)
      .eq('id', probeRiskId)
    if (error) throw error
  }

  const { data: probeSnapshots, error: probeError } = await supabase
    .from('risk_score_snapshots')
    .select('id, created_at')
    .eq('workspace_id', workspaceId)
    .eq('risk_id', probeRiskId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (probeError) throw probeError

  if ((probeSnapshots?.length ?? 0) > 20) {
    throw new Error(`Retention failed: expected <=20 snapshots per risk; got ${probeSnapshots?.length ?? 0}`)
  }

  const oldCreatedAt = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  const { error: oldInsertError } = await supabase.from('risk_score_snapshots').insert({
    workspace_id: workspaceId,
    risk_id: probeRiskId,
    probability: 1,
    impact: 1,
    risk_score: 1,
    category: 'Operational',
    status: 'open',
    created_at: oldCreatedAt,
    created_by: null,
  })
  if (oldInsertError) throw oldInsertError

  const ninetyDaysAgoIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: oldRows, error: oldRowsError } = await supabase
    .from('risk_score_snapshots')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('risk_id', probeRiskId)
    .lt('created_at', ninetyDaysAgoIso)
    .limit(10)
  if (oldRowsError) throw oldRowsError
  if ((oldRows?.length ?? 0) > 0) {
    throw new Error('Retention failed: found snapshot(s) older than 90 days after retention trigger ran')
  }

  const totalMs = Date.now() - startedAt
  console.log(`[score-history] ok in ${totalMs}ms`)

  if (!KEEP_DATA) {
    const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId)
    if (error) throw error
    console.log('[score-history] cleaned up workspace')
  } else {
    console.log(`[score-history] KEEP_DATA=true; workspace retained: ${workspaceId}`)
  }
}

main().catch((error) => {
  console.error('[score-history] FAILED', error?.message ?? error)
  process.exit(1)
})

