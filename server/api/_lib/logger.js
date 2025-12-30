function logAuditEvent(user, action, resource, details = {}) {
  console.info('AUDIT_EVENT', {
    userId: user?.id,
    action,
    resource,
    details,
    timestamp: new Date().toISOString(),
  })
}

function logSecurityEvent(type, details = {}) {
  console.warn('SECURITY_EVENT', {
    type,
    details,
    timestamp: new Date().toISOString(),
  })
}

function normalizeError(error) {
  if (!error || typeof error !== 'object') {
    return { name: 'Error', message: String(error) }
  }

  const err = error
  return {
    name: typeof err.name === 'string' ? err.name : 'Error',
    message: typeof err.message === 'string' ? err.message : String(err),
    code: typeof err.code === 'string' ? err.code : undefined,
    statusCode: Number.isFinite(err.statusCode) ? err.statusCode : undefined,
    stack: typeof err.stack === 'string' ? err.stack : undefined,
  }
}

function logApiRequest({ requestId, method, path, origin }) {
  console.info('API_REQUEST', {
    requestId,
    method,
    path,
    origin: origin || undefined,
    timestamp: new Date().toISOString(),
  })
}

function logApiResponse({ requestId, method, path, status, durationMs }) {
  console.info('API_RESPONSE', {
    requestId,
    method,
    path,
    status,
    durationMs,
    timestamp: new Date().toISOString(),
  })
}

function logApiWarn(type, details = {}) {
  console.warn('API_WARN', {
    type,
    details,
    timestamp: new Date().toISOString(),
  })
}

function logApiError({ requestId, method, path, userId, workspaceId, error }) {
  console.error('API_ERROR', {
    requestId,
    method,
    path,
    userId: userId || undefined,
    workspaceId: workspaceId || undefined,
    error: normalizeError(error),
    timestamp: new Date().toISOString(),
  })
}

module.exports = {
  logApiError,
  logApiRequest,
  logApiResponse,
  logApiWarn,
  logAuditEvent,
  logSecurityEvent,
}
