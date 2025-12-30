const { supabaseErrorToApiError } = require('./apiErrors')

const UUID_V4ish_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeWorkspaceId(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!UUID_V4ish_REGEX.test(trimmed)) return null
  return trimmed.toLowerCase()
}

async function resolveWorkspaceId({ supabase, userId, requestedWorkspaceId }) {
  if (!userId) {
    return { error: { status: 401, code: 'UNAUTHENTICATED', message: 'Unauthenticated', retryable: false } }
  }

  if (requestedWorkspaceId !== undefined && requestedWorkspaceId !== null && requestedWorkspaceId !== '') {
    const workspaceId = normalizeWorkspaceId(requestedWorkspaceId)
    if (!workspaceId) {
      return { error: { status: 400, code: 'BAD_REQUEST', message: 'Invalid x-workspace-id', retryable: false } }
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) {
      return { error: supabaseErrorToApiError(error, { action: 'query' }) }
    }
    if (!data?.workspace_id) {
      return { error: { status: 403, code: 'FORBIDDEN', message: 'Not a member of workspace', retryable: false } }
    }

    return { workspaceId }
  }

  const { data: personalWorkspace, error: personalError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('created_by', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (personalError) {
    return { error: supabaseErrorToApiError(personalError, { action: 'query' }) }
  }
  if (personalWorkspace?.id) {
    return { workspaceId: personalWorkspace.id }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    return { error: supabaseErrorToApiError(membershipError, { action: 'query' }) }
  }
  if (membership?.workspace_id) {
    return { workspaceId: membership.workspace_id }
  }

  const { data: createdWorkspaceId, error: createError } = await supabase.rpc('create_workspace', {
    p_name: 'Personal',
  })

  if (createError) {
    return { error: supabaseErrorToApiError(createError, { action: 'rpc' }) }
  }
  if (!createdWorkspaceId) {
    return {
      error: { status: 502, code: 'SUPABASE_ERROR', message: 'Supabase rpc failed: missing workspace id', retryable: false },
    }
  }

  return { workspaceId: createdWorkspaceId }
}

module.exports = { resolveWorkspaceId }

