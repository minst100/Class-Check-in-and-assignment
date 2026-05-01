const test = require('node:test');
const assert = require('node:assert/strict');
const { authorize, issueTokens } = require('../src/middleware/auth');
const { requireFields } = require('../src/middleware/validation');

test('RBAC middleware denies unauthorized role', () => {
  const req = { user: { role: 'student' } };
  let statusCode;
  const res = { status: (code) => { statusCode = code; return { json: () => ({}) }; } };
  authorize('admin')(req, res, () => {});
  assert.equal(statusCode, 403);
});

test('token rotation issues both access and refresh tokens', () => {
  const tokens = issueTokens({ id: 'u1', role: 'admin', email: 'admin@example.com' });
  assert.ok(tokens.accessToken);
  assert.ok(tokens.refreshToken);
  assert.notEqual(tokens.accessToken, tokens.refreshToken);
});

test('input validation requires fields', () => {
  const middleware = requireFields(['email']);
  let statusCode;
  const req = { body: {} };
  const res = { status: (code) => { statusCode = code; return { json: () => ({}) }; } };
  middleware(req, res, () => {});
  assert.equal(statusCode, 400);
});
