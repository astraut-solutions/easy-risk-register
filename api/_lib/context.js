const { requireSupabaseAuth } = require('./auth')
const { resolveWorkspaceId } = require('./workspace')
const { logSecurityEvent } = require('./logger')

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
    logSecurityEvent('workspace_resolution_failed', {
      requestId: req.requestId,
      path: req.url,
      status: error.status,
      message: error.message,
      requestedWorkspaceId: rawWorkspaceId || undefined,
    })
    res.status(error.status).json({ error: error.message })
    return null
  }

  return { ...auth, workspaceId }
}

module.exports = { requireApiContext }
