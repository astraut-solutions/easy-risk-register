// api/audit/index.js - Audit logging API for Vercel serverless functions
import { authenticateToken } from '../../utils/auth.js';
import { logAuditEvent } from '../../utils/logger.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apply authentication middleware
  await new Promise((resolve, reject) => {
    authenticateToken(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  switch (req.method) {
    case 'GET':
      // Get audit logs - only admin can access
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // In a real application, fetch audit logs from database or log files
      // For now, return mock data
      res.status(200).json({
        logs: [
          {
            id: 1,
            userId: req.user.userId,
            username: req.user.username,
            action: 'login',
            resource: 'auth',
            timestamp: new Date().toISOString(),
            details: { ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress }
          }
        ]
      });
      break;

    case 'POST':
      // Log an audit event
      const { action, resource, details } = req.body;
      
      if (!action || !resource) {
        return res.status(400).json({ error: 'Action and resource are required' });
      }
      
      // Log the audit event
      logAuditEvent(req.user, action, resource, details);
      
      res.status(200).json({ message: 'Audit event logged successfully' });
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
      break;
  }
}