const { handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const ctx = await requireApiContext(req, res)
  if (!ctx) return

  switch (req.method) {
    case 'GET': {
      let workspaceName = null
      try {
        const { data } = await ctx.supabase
          .from('workspaces')
          .select('name')
          .eq('id', ctx.workspaceId)
          .maybeSingle()
        if (data?.name) workspaceName = data.name
      } catch {
        // ignore
      }

      return res.status(200).json({
        user: { id: ctx.user.id, email: ctx.user.email ?? null },
        workspaceId: ctx.workspaceId,
        workspaceName,
      })
    }

    case 'POST': {
      return res.status(501).json({ error: 'Not implemented' })
    }

    default:
      res.setHeader('allow', 'GET,POST,OPTIONS')
      return res.status(405).json({ error: 'Method not allowed' })
  }
}
