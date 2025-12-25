// utils/logger.js - Winston logger configuration for audit logging
import winston from 'winston';

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'easy-risk-register' },
  transports: [
    // Write all logs with level 'error' and above to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          return `${timestamp} [${level}] ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
        })
      )
    }),
    // Write all logs with level 'info' and above to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          return `${timestamp} [${level}] ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
        })
      )
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Function to log audit events
export function logAuditEvent(user, action, resource, details = {}) {
  logger.info('AUDIT_EVENT', {
    userId: user.userId,
    username: user.username,
    role: user.role,
    action,
    resource,
    details,
    timestamp: new Date().toISOString()
  });
}

// Function to log security events
export function logSecurityEvent(type, details = {}) {
  logger.warn('SECURITY_EVENT', {
    type,
    details,
    timestamp: new Date().toISOString()
  });
}

export default logger;