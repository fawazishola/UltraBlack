/*
 * Basic authentication middleware for admin endpoints
 */

/**
 * Middleware to protect admin endpoints with a simple API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function adminAuth(req, res, next) {
  const apiKey = req.header('X-API-Key');
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

module.exports = { adminAuth };
