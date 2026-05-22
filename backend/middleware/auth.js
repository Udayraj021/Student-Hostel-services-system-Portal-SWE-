const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 30);

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing authentication token' });

    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Enforce session not revoked and not idle
    const sessions = await query(
      'SELECT * FROM session_tracking WHERE token = ? AND revoked = FALSE LIMIT 1',
      [token]
    );
    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Session not found or revoked' });
    }
    const s = sessions[0];
    const lastActive = new Date(s.last_activity);
    const idleMs = Date.now() - lastActive.getTime();
    if (idleMs > IDLE_MINUTES * 60 * 1000) {
      await query('UPDATE session_tracking SET revoked=TRUE WHERE session_id=?', [s.session_id]);
      return res.status(401).json({ error: 'Session expired due to inactivity' });
    }
    await query('UPDATE session_tracking SET last_activity=NOW() WHERE session_id=?', [s.session_id]);

    req.user = { loginId: payload.loginId, role: payload.role, name: payload.name, email: payload.email };
    req.sessionId = s.session_id;
    req.token = token;
    next();
  } catch (err) {
    console.error('auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: role not permitted' });
    }
    next();
  };
}

module.exports = { authRequired, requireRole };
