// api/users/index.js - User management API for Vercel serverless functions
import { authenticateToken, requireRole } from '../../utils/auth.js';

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
      // Get users - only admin can access
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // In a real application, fetch users from database
      // For now, return mock data
      res.status(200).json({
        users: [
          { id: 1, username: 'admin', role: 'admin' },
          { id: 2, username: 'user', role: 'user' }
        ]
      });
      break;

    case 'POST':
      // Create user - only admin can access
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // In a real application, create user in database
      const { username, password, role } = req.body;
      
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
      }
      
      res.status(201).json({ 
        message: 'User created successfully',
        user: { id: 3, username, role }
      });
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
      break;
  }
}