const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 11: FeePaymentService (simulated gateway)
router.post('/initiate', asyncHandler(async (req, res) => {
  const { amount, purpose, reference_id } = req.body;
  if (!amount || !purpose) return res.status(400).json({ error: 'amount & purpose required' });
  const paymentId = 'PAY-' + uuidv4().slice(0, 12);
  await query(
    'INSERT INTO payments (payment_id, user_id, amount, purpose, reference_id) VALUES (?, ?, ?, ?, ?)',
    [paymentId, req.user.loginId, amount, purpose, reference_id || null]
  );
  res.json({
    payment_id: paymentId,
    payment_link: `/payments/${paymentId}/pay`,
    amount, purpose
  });
}));

router.post('/:id/confirm', asyncHandler(async (req, res) => {
  const p = await queryOne('SELECT * FROM payments WHERE payment_id=?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const txn = 'TXN-' + uuidv4().slice(0, 10).toUpperCase();
  await query('UPDATE payments SET status="Paid", transaction_id=?, paid_at=NOW() WHERE payment_id=?', [txn, req.params.id]);
  // Apply to reference (ID card / event)
  if (p.purpose === 'idcard' && p.reference_id) {
    await query('UPDATE id_card_requests SET payment_status="Paid", transaction_id=? WHERE request_id=?', [txn, p.reference_id]);
  } else if (p.purpose === 'event' && p.reference_id) {
    await query('UPDATE event_registrations SET payment_status="Paid", transaction_id=? WHERE registration_id=?', [txn, p.reference_id]);
  }
  res.json({ success: true, transaction_id: txn });
}));

router.get('/history', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC', [req.user.loginId]);
  res.json(rows);
}));

module.exports = router;
