const { logAction } = require('../services/audit');

function deriveDevice(req) {
  return req.headers['user-agent'] || 'unknown';
}

function deriveIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function auditRequest(actionResolver) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      try {
        const ctx = typeof actionResolver === 'function' ? actionResolver(req, res) : {};
        await logAction(
          req.user?.sub || null,
          ctx.action || `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
          ctx.targetType || 'api_request',
          ctx.targetId || null,
          {
            timestamp: new Date().toISOString(),
            ip: deriveIp(req),
            device: deriveDevice(req),
            status_code: res.statusCode,
            ...ctx.metadata
          }
        );
      } catch (error) {
        // no-op to avoid breaking request lifecycle
      }
    });
    next();
  };
}

module.exports = { auditRequest };
