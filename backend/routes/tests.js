const express = require('express');
const { query } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired, requireRole('admin'));

// Services 36-40: Testing dashboard (metadata + demo triggers)
router.get('/runs', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM test_runs ORDER BY timestamp DESC LIMIT 100'));
}));

router.post('/runs', asyncHandler(async (req, res) => {
  const { test_type, module_name, commit_id, total_tests, passed, failed, notes } = req.body;
  const passRate = total_tests ? ((passed / total_tests) * 100).toFixed(2) : 0;
  const r = await query(
    `INSERT INTO test_runs (test_type, module_name, commit_id, total_tests, passed, failed, pass_rate, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [test_type, module_name || null, commit_id || null, total_tests, passed, failed, passRate, notes || null]
  );
  res.json({ success: true, run_id: r.insertId, pass_rate: passRate });
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const byType = await query(
    `SELECT test_type, COUNT(*) runs, ROUND(AVG(pass_rate),2) avg_pass_rate,
            SUM(total_tests) total_tests, SUM(passed) passed, SUM(failed) failed
     FROM test_runs GROUP BY test_type`
  );
  res.json(byType);
}));

module.exports = router;
