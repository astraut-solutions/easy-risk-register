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

module.exports = { logAuditEvent, logSecurityEvent }
