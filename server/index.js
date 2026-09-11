import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './db.js';
import repairsRouter from './routes/repairs.js';
import farmersRouter from './routes/farmers.js';
import vendorsRouter from './routes/vendors.js';
import techniciansRouter from './routes/technicians.js';
import { syncFromGoogleSheet } from './services/googleSheetsSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed data
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Disable caching for all API responses to prevent stale data in browsers/proxies
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Static uploads folder for board photos
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/repairs', repairsRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/technicians', techniciansRouter);

// Root stats convenience alias
app.get('/api/stats', (req, res) => {
  res.redirect('/api/repairs/stats/summary');
});

// Health check & Storage Diagnostics
app.get('/api/health', (req, res) => {
  let isWritable = false;
  let journalMode = 'unknown';
  let writeError = null;

  try {
    const row = db.pragma('journal_mode', { simple: true });
    journalMode = row;
    
    // Quick probe write test
    db.prepare(`
      CREATE TABLE IF NOT EXISTS _health_check (
        id INTEGER PRIMARY KEY,
        checked_at TEXT
      )
    `).run();
    db.prepare('INSERT OR REPLACE INTO _health_check (id, checked_at) VALUES (1, datetime("now"))').run();
    isWritable = true;
  } catch (err) {
    writeError = err.message;
  }

  res.json({
    status: isWritable ? 'ok' : 'readonly_error',
    time: new Date().toISOString(),
    data_dir: process.env.DATA_DIR || 'default',
    uploads_dir: process.env.UPLOADS_DIR || 'default',
    journal_mode: journalMode,
    is_writable: isWritable,
    write_error: writeError
  });
});

// Serve frontend build if client/dist exists
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Attempt to sync Google Sheet on app startup (non-blocking)
async function startupSync() {
  try {
    const config = db.prepare('SELECT sheet_url FROM sync_config WHERE id = 1').get();
    if (config && config.sheet_url) {
      console.log('🔄 Attempting on-load Google Sheets customer sync...');
      const res = await syncFromGoogleSheet(config.sheet_url);
      console.log(`✅ Google Sheet synced on load: ${res.total} total farmers (Added: ${res.added}, Updated: ${res.updated})`);
    }
  } catch (err) {
    console.log(`ℹ️ Google Sheet sync on startup: ${err.message}`);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 KAEBS Reman Tracker Server listening on http://localhost:${PORT}`);
  startupSync();
});
