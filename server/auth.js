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

// Map simples de tokens de sessão em memória
const sessionTokens = new Map(); // token -> { userId, expiresAt }

export function generateToken(user) {
  const token = `tok_${user.id}_${crypto.randomBytes(24).toString('hex')}`;
  // Token válido por 30 dias
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  sessionTokens.set(token, {
    userId: user.id,
    expiresAt,
  });
  return token;
}

export function getUserIdFromToken(token) {
  if (!token) return null;
  const session = sessionTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionTokens.delete(token);
    return null;
  }
  return session.userId;
}

export function removeToken(token) {
  if (token) {
    sessionTokens.delete(token);
  }
}
