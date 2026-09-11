import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/technicians - List technicians
router.get('/', (req, res) => {
  try {
    const techs = db.prepare('SELECT * FROM technicians WHERE is_active = 1 ORDER BY name ASC').all();
    res.json(techs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/technicians/all - List all (including inactive)
router.get('/all', (req, res) => {
  try {
    const techs = db.prepare('SELECT * FROM technicians ORDER BY name ASC').all();
    res.json(techs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/technicians - Add technician
router.post('/', (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Technician name is required' });
    }

    const info = db.prepare(`
      INSERT INTO technicians (name, email, phone, is_active)
      VALUES (?, ?, ?, 1)
    `).run(name.trim(), email || null, phone || null);

    const newTech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newTech);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/technicians/:id - Update technician
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Technician name is required' });
    }

    db.prepare(`
      UPDATE technicians 
      SET name = ?, email = ?, phone = ?, is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name.trim(), email || null, phone || null, is_active !== undefined ? Number(is_active) : null, id);

    const updated = db.prepare('SELECT * FROM technicians WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/technicians/:id - Delete technician
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM technicians WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
