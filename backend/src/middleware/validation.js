function requireFields(fields = []) {
  return (req, res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    if (missing.length) return res.status(400).json({ error: 'Validation error', missing });
    return next();
  };
}

function sanitizeStringFields(fields = []) {
  return (req, res, next) => {
    fields.forEach((field) => {
      if (typeof req.body[field] === 'string') req.body[field] = req.body[field].trim();
    });
    return next();
  };
}

module.exports = { requireFields, sanitizeStringFields };
