const crypto = require('crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function notify(recipientId, title, message, type = 'info', referenceId = null) {
  const { query } = require('../config/db');
  await query(
    'INSERT INTO notifications (recipient_id, title, message, type, reference_id) VALUES (?, ?, ?, ?, ?)',
    [recipientId, title, message, type, referenceId]
  );
}

async function audit(loginId, action, status, details = '', ip = '') {
  const { query } = require('../config/db');
  await query(
    'INSERT INTO audit_log (login_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
    [loginId, action, ip, status, details]
  );
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { randomToken, addMinutes, notify, audit, asyncHandler };
