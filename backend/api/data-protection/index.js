// api/data-protection/index.js - Data protection and encryption API for Vercel serverless functions
import { authenticateToken } from '../../utils/auth.js';
import { encrypt, decrypt } from '../../utils/encryption/encrypt.js';

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
    case 'POST':
      const { action, data } = req.body;
      
      if (!action || !data) {
        return res.status(400).json({ error: 'Action and data are required' });
      }
      
      try {
        let result;
        
        if (action === 'encrypt') {
          result = encrypt(data);
          res.status(200).json({ encrypted: result });
        } else if (action === 'decrypt') {
          result = decrypt(data);
          res.status(200).json({ decrypted: result });
        } else {
          return res.status(400).json({ error: 'Invalid action. Use "encrypt" or "decrypt"' });
        }
      } catch (error) {
        console.error('Encryption/Decryption error:', error);
        res.status(500).json({ error: 'Encryption/Decryption failed' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
      break;
  }
}