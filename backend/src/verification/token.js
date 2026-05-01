const jwt = require('jsonwebtoken');

const TOKEN_TTL_SECONDS = 120;

function signSessionToken(sessionId) {
  return jwt.sign(
    { sid: sessionId, typ: 'checkin' },
    process.env.SESSION_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

function verifySessionToken(token, sessionId) {
  try {
    const payload = jwt.verify(token, process.env.SESSION_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret');
    if (payload.sid !== sessionId || payload.typ !== 'checkin') {
      return { ok: false, reasonCode: 'token_mismatch' };
    }
    return { ok: true, payload };
  } catch (error) {
    if (error.name === 'TokenExpiredError') return { ok: false, reasonCode: 'token_expired' };
    return { ok: false, reasonCode: 'invalid_token' };
  }
}

module.exports = { TOKEN_TTL_SECONDS, signSessionToken, verifySessionToken };
