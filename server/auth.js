import crypto from 'crypto';

// Hash seguro com PBKDF2 nativo do Node.js
export function hashPassword(password, salt = null) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512')
    .toString('hex');
  return {
    salt: generatedSalt,
    hash: hash,
  };
}

export function verifyPassword(password, storedHash, storedSalt) {
  const { hash } = hashPassword(password, storedSalt);
  return hash === storedHash;
}

// Chave de assinatura para tokens persistentes (sobrevive a reinicializações do servidor)
const TOKEN_SECRET = process.env.SESSION_SECRET || 'planner-auth-signature-key-2026-equipe';

export function generateToken(user) {
  // Token válido por 30 dias
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${user.id}.${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');

  return `tok.${payload}.${signature}`;
}

export function getUserIdFromToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  // Formato esperado: 'tok.<userId>.<expiresAt>.<signature>'
  if (parts.length !== 4 || parts[0] !== 'tok') return null;

  const [, userId, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return null; // Token expirado
  }

  const payload = `${userId}.${expiresAtStr}`;
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');

  // Comparação em tempo constante para evitar timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return userId;
  }

  return null;
}

export function removeToken(token) {
  // Stateless tokens expiram pelo tempo ou troca de credencial
  return true;
}
