const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, queryOne } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname.replace(/[^\w.-]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Service 19: MarketplaceService
router.get('/', asyncHandler(async (req, res) => {
  const { ad_type, status } = req.query;
  let sql = `SELECT l.*, u.name AS seller_name, u.email AS seller_email,
             (SELECT image_url FROM item_images WHERE listing_id=l.listing_id AND is_primary=TRUE LIMIT 1) AS primary_image
             FROM marketplace_listings l JOIN users u ON u.login_id = l.seller_id WHERE 1=1`;
  const params = [];
  if (ad_type) { sql += ' AND l.ad_type=?'; params.push(ad_type); }
  sql += status ? ' AND l.status=?' : ' AND l.status="Active"';
  if (status) params.push(status);
  sql += ' ORDER BY l.created_at DESC LIMIT 200';
  res.json(await query(sql, params));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const listing = await queryOne(
    `SELECT l.*, u.name AS seller_name, u.email AS seller_email FROM marketplace_listings l JOIN users u ON u.login_id=l.seller_id WHERE l.listing_id=?`,
    [req.params.id]
  );
  if (!listing) return res.status(404).json({ error: 'Not found' });
  const images = await query('SELECT * FROM item_images WHERE listing_id=?', [req.params.id]);
  res.json({ listing, images });
}));

router.post('/', upload.array('images', 5), asyncHandler(async (req, res) => {
  const { ad_type, title, description, asking_price, category, contact_email, contact_phone } = req.body;
  if (!ad_type || !title) return res.status(400).json({ error: 'ad_type & title required' });
  const r = await query(
    'INSERT INTO marketplace_listings (seller_id, ad_type, title, description, asking_price, category, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.loginId, ad_type, title, description || '', asking_price || 0, category || null, contact_email || req.user.email, contact_phone || null]
  );
  const listingId = r.insertId;
  if (req.files && req.files.length) {
    for (let i = 0; i < req.files.length; i++) {
      await query('INSERT INTO item_images (listing_id, image_url, is_primary) VALUES (?, ?, ?)',
        [listingId, '/uploads/' + req.files[i].filename, i === 0]);
    }
  }
  res.json({ success: true, listing_id: listingId });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const listing = await queryOne('SELECT * FROM marketplace_listings WHERE listing_id=?', [req.params.id]);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.seller_id !== req.user.loginId && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await query('UPDATE marketplace_listings SET status=? WHERE listing_id=?', [req.body.status, req.params.id]);
  res.json({ success: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const listing = await queryOne('SELECT * FROM marketplace_listings WHERE listing_id=?', [req.params.id]);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.seller_id !== req.user.loginId && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await query('DELETE FROM marketplace_listings WHERE listing_id=?', [req.params.id]);
  res.json({ success: true });
}));

router.get('/me/my-listings', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT l.*, (SELECT image_url FROM item_images WHERE listing_id=l.listing_id AND is_primary=TRUE LIMIT 1) AS primary_image
     FROM marketplace_listings l WHERE l.seller_id=? ORDER BY l.created_at DESC`,
    [req.user.loginId]
  );
  res.json(rows);
}));

module.exports = router;
