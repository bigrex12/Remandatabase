import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/vendors - List all vendors
router.get('/', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vendors - Add vendor
router.post('/', (req, res) => {
  try {
    const { name, contact_name, contact_email, contact_phone, rma_portal_url, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }

    const info = db.prepare(`
      INSERT INTO vendors (name, contact_name, contact_email, contact_phone, rma_portal_url, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), contact_name || null, contact_email || null, contact_phone || null, rma_portal_url || null, notes || null);

    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newVendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/vendors/:id - Update vendor
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_name, contact_email, contact_phone, rma_portal_url, notes } = req.body;

    db.prepare(`
      UPDATE vendors 
      SET name = ?, contact_name = ?, contact_email = ?, contact_phone = ?, rma_portal_url = ?, notes = ?
      WHERE id = ?
    `).run(name, contact_name || null, contact_email || null, contact_phone || null, rma_portal_url || null, notes || null, id);

    const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vendors/:id - Delete vendor
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
