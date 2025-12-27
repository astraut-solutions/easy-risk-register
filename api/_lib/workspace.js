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
    return { error: { status: 401, message: 'Unauthenticated' } }
  }

  if (requestedWorkspaceId !== undefined && requestedWorkspaceId !== null && requestedWorkspaceId !== '') {
    const workspaceId = normalizeWorkspaceId(requestedWorkspaceId)
    if (!workspaceId) {
      return { error: { status: 400, message: 'Invalid x-workspace-id' } }
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) {
      return { error: { status: 502, message: `Supabase query failed: ${error.message}` } }
    }
    if (!data?.workspace_id) {
      return { error: { status: 403, message: 'Not a member of workspace' } }
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
    return { error: { status: 502, message: `Supabase query failed: ${personalError.message}` } }
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
    return { error: { status: 502, message: `Supabase query failed: ${membershipError.message}` } }
  }
  if (membership?.workspace_id) {
    return { workspaceId: membership.workspace_id }
  }

  const { data: createdWorkspaceId, error: createError } = await supabase.rpc('create_workspace', {
    p_name: 'Personal',
  })

  if (createError) {
    return { error: { status: 502, message: `Supabase RPC failed: ${createError.message}` } }
  }
  if (!createdWorkspaceId) {
    return { error: { status: 502, message: 'Supabase RPC failed: missing workspace id' } }
  }

  return { workspaceId: createdWorkspaceId }
}

module.exports = { resolveWorkspaceId }

