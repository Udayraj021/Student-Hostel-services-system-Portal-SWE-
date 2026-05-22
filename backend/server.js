require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Ensure uploads dir exists
const UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Student Portal API', time: new Date().toISOString() });
});

// Route modules
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/academic', require('./routes/academic'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/events', require('./routes/events'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/gate', require('./routes/gate'));
app.use('/api/cab', require('./routes/cab'));
app.use('/api/hostel', require('./routes/hostel'));
app.use('/api/mess', require('./routes/mess'));
app.use('/api/services', require('./routes/services'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/tests', require('./routes/tests'));

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🎓 Student Portal API listening on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use (another app or an old nodemon).`);
    console.error('  Free it:  lsof -nP -iTCP:' + PORT + ' | grep LISTEN');
    console.error('  Then:     kill <PID>     (or killall node)');
    console.error('  Or use another port: set PORT=5001 in backend/.env and restart.\n');
  } else {
    console.error('\nServer failed to start:', err.message || err);
  }
  process.exit(1);
});
