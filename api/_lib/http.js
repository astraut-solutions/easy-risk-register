function setCors(req, res) {
  const origin = req.headers?.origin
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Workspace-Id, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  )
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

module.exports = { handleOptions, setCors }
