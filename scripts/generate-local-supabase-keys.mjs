import crypto from 'node:crypto';

function base64url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwtHs256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest();
  return `${signingInput}.${base64url(signature)}`;
}

function secondsSinceEpoch() {
  return Math.floor(Date.now() / 1000);
}

const jwtSecret = crypto.randomBytes(32).toString('hex');
const issuedAt = secondsSinceEpoch();
const expiresAt = issuedAt + 60 * 60 * 24 * 365 * 10;

const anonKey = signJwtHs256(
  { iss: 'supabase', iat: issuedAt, exp: expiresAt, role: 'anon' },
  jwtSecret,
);
const serviceKey = signJwtHs256(
  { iss: 'supabase', iat: issuedAt, exp: expiresAt, role: 'service_role' },
  jwtSecret,
);

process.stdout.write(`SUPABASE_JWT_SECRET=${jwtSecret}\n`);
process.stdout.write(`SUPABASE_ANON_KEY=${anonKey}\n`);
process.stdout.write(`SUPABASE_SERVICE_KEY=${serviceKey}\n`);

