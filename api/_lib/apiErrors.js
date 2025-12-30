function getRequestId(req) {
  const requestId = req?.requestId
  return typeof requestId === 'string' && requestId.trim() ? requestId.trim() : null
}

function toErrorResponse({ requestId, code, message, retryable, details }) {
  const body = {
    error: message,
    code,
    requestId: requestId || undefined,
    retryable: Boolean(retryable),
  }

  if (details !== undefined) body.details = details
  return body
}

function sendApiError(req, res, { status, code, message, retryable = false, details }) {
  const requestId = getRequestId(req)
  return res.status(status).json(
    toErrorResponse({
      requestId,
      code,
      message,
      retryable,
      details,
    }),
  )
}

function isKnownNetworkCode(value) {
  return (
    value === 'ENOTFOUND' ||
    value === 'ECONNREFUSED' ||
    value === 'ECONNRESET' ||
    value === 'EAI_AGAIN' ||
    value === 'ETIMEDOUT' ||
    value === 'UND_ERR_CONNECT_TIMEOUT' ||
    value === 'UND_ERR_SOCKET'
  )
}

function getErrorCode(error) {
  if (!error || typeof error !== 'object') return null
  const direct = error.code
  if (typeof direct === 'string') return direct
  const cause = error.cause
  if (cause && typeof cause === 'object' && typeof cause.code === 'string') return cause.code
  return null
}

function getErrorMessage(error) {
  if (!error || typeof error !== 'object') return String(error)
  return typeof error.message === 'string' ? error.message : String(error)
}

function isNetworkOrUnreachableError(error) {
  const code = getErrorCode(error)
  if (code && isKnownNetworkCode(code)) return true

  const message = getErrorMessage(error).toLowerCase()
  if (!message) return false

  return (
    message.includes('fetch failed') ||
    message.includes('network error') ||
    message.includes('socket hang up') ||
    message.includes('connect timeout') ||
    message.includes('getaddrinfo') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout')
  )
}

function supabaseErrorToApiError(error, { action } = {}) {
  const safeAction = typeof action === 'string' && action.trim() ? action.trim() : 'request'

  if (isNetworkOrUnreachableError(error) || error?.status === 0) {
    return {
      status: 503,
      code: 'SUPABASE_UNREACHABLE',
      message: 'Database temporarily unavailable',
      retryable: true,
      details: { action: safeAction },
    }
  }

  const upstreamMessage = getErrorMessage(error)
  return {
    status: 502,
    code: 'SUPABASE_ERROR',
    message: `Supabase ${safeAction} failed: ${upstreamMessage}`,
    retryable: false,
    details: { action: safeAction },
  }
}

function unexpectedErrorToApiError(error) {
  if (error && typeof error === 'object' && Number.isFinite(error.statusCode)) {
    const statusCode = Number(error.statusCode)

    if (statusCode === 413) {
      return {
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
        retryable: false,
      }
    }

    if (statusCode === 400 && error.code === 'INVALID_JSON') {
      return {
        status: 400,
        code: 'INVALID_JSON',
        message: 'Invalid JSON body',
        retryable: false,
      }
    }
  }

  if (error && typeof error === 'object' && error.code === 'MISSING_ENV') {
    return {
      status: 500,
      code: 'SERVER_MISCONFIGURED',
      message: 'Server misconfigured',
      retryable: false,
    }
  }

  if (isNetworkOrUnreachableError(error)) {
    return {
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
      retryable: true,
    }
  }

  return {
    status: 500,
    code: 'UNEXPECTED_ERROR',
    message: 'Unexpected API error',
    retryable: false,
  }
}

module.exports = {
  sendApiError,
  supabaseErrorToApiError,
  unexpectedErrorToApiError,
}
