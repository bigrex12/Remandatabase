import express from 'express';
import db from '../db.js';
import { syncFromGoogleSheet, importPastedText } from '../services/googleSheetsSync.js';

const router = express.Router();

// GET /api/farmers - Search & list farmers
router.get('/', (req, res) => {
  try {
    const { search = '', limit = 100 } = req.query;
    let query = 'SELECT * FROM farmers';
    const params = [];

    if (search.trim()) {
      query += ` WHERE farm_name LIKE ? OR farm_id LIKE ? OR phone LIKE ? OR address LIKE ?`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY farm_name ASC LIMIT ?';
    params.push(Number(limit));

    const farmers = db.prepare(query).all(...params);
    res.json(farmers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/farmers/sync/status - Get current sync status & config
router.get('/sync/status', (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM sync_config WHERE id = 1').get() || {};
    const count = db.prepare('SELECT COUNT(*) as total FROM farmers').get().total;
    res.json({ ...config, total_farmers: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/farmers/sync - Trigger on-demand sync from Google Sheet
router.post('/sync', async (req, res) => {
  try {
    const { sheet_url } = req.body;
    if (sheet_url) {
      db.prepare('UPDATE sync_config SET sheet_url = ? WHERE id = 1').run(sheet_url);
    }
    const result = await syncFromGoogleSheet(sheet_url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/farmers/sync/config - Update Google Sheet URL
router.post('/sync/config', (req, res) => {
  try {
    const { sheet_url } = req.body;
    db.prepare('UPDATE sync_config SET sheet_url = ? WHERE id = 1').run(sheet_url);
    res.json({ success: true, sheet_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/farmers/import-paste - Paste directly from Google Sheets
router.post('/import-paste', (req, res) => {
  try {
    const { raw_text } = req.body;
    const result = importPastedText(raw_text);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/farmers - Manually add single farmer
router.post('/', (req, res) => {
  try {
    const { farm_id, farm_name, phone, email, address, sites, notes } = req.body;
    if (!farm_name || !farm_name.trim()) {
      return res.status(400).json({ error: 'Farm name is required' });
    }

    const info = db.prepare(`
      INSERT INTO farmers (farm_id, farm_name, phone, email, address, sites, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(farm_id || null, farm_name.trim(), phone || null, email || null, address || null, sites || null, notes || null);

    const newFarmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newFarmer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/farmers/:id - Update farmer
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { farm_id, farm_name, phone, email, address, sites, notes } = req.body;

    db.prepare(`
      UPDATE farmers 
      SET farm_id = ?, farm_name = ?, phone = ?, email = ?, address = ?, sites = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(farm_id || null, farm_name, phone || null, email || null, address || null, sites || null, notes || null, id);

    const updated = db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/farmers/:id - Delete farmer
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM farmers WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
