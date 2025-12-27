const { requireSupabaseAuth } = require('./auth')
const { resolveWorkspaceId } = require('./workspace')

async function requireApiContext(req, res, { requireWorkspace = true } = {}) {
  const auth = await requireSupabaseAuth(req, res)
  if (!auth) return null

  if (!requireWorkspace) {
    return { ...auth, workspaceId: null }
  }

  const headerWorkspaceId = Array.isArray(req.headers?.['x-workspace-id'])
    ? req.headers['x-workspace-id'][0]
    : req.headers?.['x-workspace-id']

  const queryWorkspaceId = Array.isArray(req.query?.workspaceId)
    ? req.query.workspaceId[0]
    : req.query?.workspaceId

  const rawWorkspaceId = headerWorkspaceId ?? queryWorkspaceId

  const { workspaceId, error } = await resolveWorkspaceId({
    supabase: auth.supabase,
    userId: auth.user.id,
    requestedWorkspaceId: rawWorkspaceId,
  })

  if (error) {
    res.status(error.status).json({ error: error.message })
    return null
  }

  return { ...auth, workspaceId }
}

module.exports = { requireApiContext }
