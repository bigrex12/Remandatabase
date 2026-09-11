import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup Multer for Board Photos
const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `board-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// Helper to generate sequential Ticket Number: RMN-YYYY-XXXX
function generateTicketNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `RMN-${currentYear}-`;
  
  const lastRepair = db.prepare(`
    SELECT ticket_number FROM repairs 
    WHERE ticket_number LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextSeq = 1;
  if (lastRepair && lastRepair.ticket_number) {
    const parts = lastRepair.ticket_number.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        nextSeq = num + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// Log Event Helper
function logEvent(repairId, eventType, description, performedBy = 'System') {
  db.prepare(`
    INSERT INTO repair_events (repair_id, event_type, description, performed_by, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(repairId, eventType, description, performedBy);
}

// GET /api/stats - Metric cards
router.get('/stats/summary', (req, res) => {
  try {
    const totalRepairs = db.prepare('SELECT COUNT(*) as count FROM repairs').get().count;
    
    const atVendor = db.prepare(`
      SELECT COUNT(*) as count FROM repairs 
      WHERE status IN ('SHIPPED_TO_VENDOR', 'AT_VENDOR_REPAIRING')
    `).get().count;

    const inFloatStock = db.prepare(`
      SELECT COUNT(*) as count FROM repairs 
      WHERE status = 'IN_FLOAT_STOCK'
    `).get().count;

    const readyToBill = db.prepare(`
      SELECT COUNT(*) as count FROM repairs 
      WHERE billing_status = 'READY_TO_BILL' 
         OR (status IN ('RETURNED_TO_SHOP', 'IN_FLOAT_STOCK', 'INSTALLED_ORIGINAL_FARMER', 'REASSIGNED_NEW_FARMER', 'DEPLOYED_FROM_FLOAT') AND billing_status = 'PENDING')
    `).get().count;

    const completedRepairs = db.prepare(`
      SELECT COUNT(*) as count FROM repairs 
      WHERE status IN ('INSTALLED_ORIGINAL_FARMER', 'REASSIGNED_NEW_FARMER', 'DEPLOYED_FROM_FLOAT')
    `).get().count;

    res.json({
      totalRepairs,
      atVendor,
      inFloatStock,
      readyToBill,
      completedRepairs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repairs - Filtered list
router.get('/', (req, res) => {
  try {
    const {
      tab = 'all',
      search = '',
      vendor_id = '',
      farmer_id = '',
      technician = '',
      billing_status = '',
      date_from = '',
      date_to = '',
      limit = 200
    } = req.query;

    let query = `
      SELECT 
        r.*,
        v.name as vendor_name,
        v.rma_portal_url as vendor_rma_portal,
        f_orig.farm_name as original_farmer_name,
        f_orig.farm_id as original_farmer_code,
        f_curr.farm_name as current_farmer_name,
        f_curr.farm_id as current_farmer_code,
        f_desig.farm_name as designated_farmer_name,
        f_desig.farm_id as designated_farmer_code,
        (SELECT COUNT(*) FROM repair_photos WHERE repair_id = r.id) as photo_count
      FROM repairs r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN farmers f_orig ON r.original_farmer_id = f_orig.id
      LEFT JOIN farmers f_curr ON r.current_farmer_id = f_curr.id
      LEFT JOIN farmers f_desig ON r.designated_farmer_id = f_desig.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by Tab
    if (tab === 'active') {
      query += ` AND r.status IN ('SHIPPED_TO_VENDOR', 'AT_VENDOR_REPAIRING', 'RETURNED_TO_SHOP', 'IN_FLOAT_STOCK')`;
    } else if (tab === 'vendor_out') {
      query += ` AND r.status IN ('SHIPPED_TO_VENDOR', 'AT_VENDOR_REPAIRING')`;
    } else if (tab === 'float_stock') {
      query += ` AND r.status = 'IN_FLOAT_STOCK'`;
    } else if (tab === 'ready_bill') {
      query += ` AND (r.billing_status = 'READY_TO_BILL' OR (r.status IN ('RETURNED_TO_SHOP', 'IN_FLOAT_STOCK', 'INSTALLED_ORIGINAL_FARMER', 'REASSIGNED_NEW_FARMER', 'DEPLOYED_FROM_FLOAT') AND r.billing_status = 'PENDING'))`;
    } else if (tab === 'completed') {
      query += ` AND r.status IN ('INSTALLED_ORIGINAL_FARMER', 'REASSIGNED_NEW_FARMER', 'DEPLOYED_FROM_FLOAT', 'SCRAPPED_UNREPAIRABLE')`;
    }

    // Filter by Search Query
    if (search.trim()) {
      query += ` AND (
        r.ticket_number LIKE ? OR
        r.part_name LIKE ? OR
        r.part_number LIKE ? OR
        r.serial_number LIKE ? OR
        r.pcb_revision LIKE ? OR
        r.physical_markings LIKE ? OR
        r.vendor_rma_number LIKE ? OR
        r.tracking_outbound LIKE ? OR
        r.customer_po_wo LIKE ? OR
        r.initial_symptom LIKE ? OR
        r.technician_name LIKE ? OR
        r.internal_notes LIKE ? OR
        f_orig.farm_name LIKE ? OR
        f_orig.farm_id LIKE ? OR
        f_curr.farm_name LIKE ? OR
        v.name LIKE ?
      )`;
      const term = `%${search.trim()}%`;
      for (let i = 0; i < 16; i++) {
        params.push(term);
      }
    }

    if (vendor_id) {
      query += ` AND r.vendor_id = ?`;
      params.push(vendor_id);
    }

    if (farmer_id) {
      query += ` AND (r.original_farmer_id = ? OR r.current_farmer_id = ?)`;
      params.push(farmer_id, farmer_id);
    }

    if (technician) {
      query += ` AND r.technician_name = ?`;
      params.push(technician);
    }

    if (billing_status) {
      query += ` AND r.billing_status = ?`;
      params.push(billing_status);
    }

    if (date_from) {
      query += ` AND (r.date_removed >= ? OR r.date_shipped >= ? OR r.created_at >= ?)`;
      params.push(date_from, date_from, date_from);
    }

    if (date_to) {
      query += ` AND (r.date_removed <= ? OR r.date_shipped <= ? OR r.created_at <= ?)`;
      params.push(date_to, date_to, date_to + ' 23:59:59');
    }

    query += ` ORDER BY r.id DESC LIMIT ?`;
    params.push(Number(limit));

    const repairs = db.prepare(query).all(...params);
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repairs/lookup/mystery - Reverse Identification Assistant
router.get('/lookup/mystery', (req, res) => {
  try {
    const { query = '', vendor_id = '', status = '' } = req.query;
    
    let sql = `
      SELECT 
        r.*,
        v.name as vendor_name,
        f_orig.farm_name as original_farmer_name,
        f_orig.farm_id as original_farmer_code,
        f_curr.farm_name as current_farmer_name,
        f_desig.farm_name as designated_farmer_name,
        (SELECT COUNT(*) FROM repair_photos WHERE repair_id = r.id) as photo_count,
        (SELECT file_path FROM repair_photos WHERE repair_id = r.id ORDER BY id ASC LIMIT 1) as thumbnail_path
      FROM repairs r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN farmers f_orig ON r.original_farmer_id = f_orig.id
      LEFT JOIN farmers f_curr ON r.current_farmer_id = f_curr.id
      LEFT JOIN farmers f_desig ON r.designated_farmer_id = f_desig.id
      WHERE 1=1
    `;
    const params = [];

    if (vendor_id) {
      sql += ` AND r.vendor_id = ?`;
      params.push(vendor_id);
    }

    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (query.trim()) {
      const term = `%${query.trim()}%`;
      sql += ` AND (
        r.vendor_rma_number LIKE ? OR
        r.tracking_outbound LIKE ? OR
        r.tracking_inbound LIKE ? OR
        r.serial_number LIKE ? OR
        r.pcb_revision LIKE ? OR
        r.ticket_number LIKE ? OR
        r.part_name LIKE ? OR
        r.part_number LIKE ? OR
        r.physical_markings LIKE ? OR
        r.customer_po_wo LIKE ? OR
        r.initial_symptom LIKE ?
      )`;
      for (let i = 0; i < 11; i++) {
        params.push(term);
      }
    }

    sql += ` ORDER BY 
      CASE WHEN r.status IN ('SHIPPED_TO_VENDOR', 'AT_VENDOR_REPAIRING') THEN 1 ELSE 2 END,
      r.date_shipped DESC,
      r.id DESC 
      LIMIT 50`;

    const results = db.prepare(sql).all(...params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repairs/:id - Single repair detail with events and photos
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const repair = db.prepare(`
      SELECT 
        r.*,
        v.name as vendor_name,
        v.contact_name as vendor_contact,
        v.contact_phone as vendor_phone,
        v.contact_email as vendor_email,
        v.rma_portal_url as vendor_rma_portal,
        f_orig.farm_name as original_farmer_name,
        f_orig.farm_id as original_farmer_code,
        f_orig.phone as original_farmer_phone,
        f_orig.address as original_farmer_address,
        f_curr.farm_name as current_farmer_name,
        f_curr.farm_id as current_farmer_code,
        f_desig.farm_name as designated_farmer_name,
        f_desig.farm_id as designated_farmer_code
      FROM repairs r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN farmers f_orig ON r.original_farmer_id = f_orig.id
      LEFT JOIN farmers f_curr ON r.current_farmer_id = f_curr.id
      LEFT JOIN farmers f_desig ON r.designated_farmer_id = f_desig.id
      WHERE r.id = ?
    `).get(id);

    if (!repair) {
      return res.status(404).json({ error: 'Repair ticket not found' });
    }

    const events = db.prepare(`
      SELECT * FROM repair_events 
      WHERE repair_id = ? 
      ORDER BY created_at ASC, id ASC
    `).all(id);

    const photos = db.prepare(`
      SELECT * FROM repair_photos 
      WHERE repair_id = ? 
      ORDER BY created_at ASC
    `).all(id);

    res.json({ ...repair, events, photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/repairs - Create new repair entry
router.post('/', (req, res) => {
  try {
    const {
      part_name,
      part_number,
      serial_number,
      pcb_revision,
      physical_markings,
      quantity = 1,
      original_farmer_id,
      intended_return_route = 'ORIGINAL_FARMER',
      designated_farmer_id,
      vendor_id,
      technician_name,
      status = 'SHIPPED_TO_VENDOR',
      current_location,
      date_removed,
      date_shipped,
      vendor_rma_number,
      tracking_outbound,
      customer_po_wo,
      initial_symptom,
      internal_notes
    } = req.body;

    if (!part_name || !part_name.trim()) {
      return res.status(400).json({ error: 'Part name is required' });
    }
    if (!technician_name || !technician_name.trim()) {
      return res.status(400).json({ error: 'Technician name is required' });
    }

    const ticket_number = generateTicketNumber();

    // Default location string based on status/vendor
    let location = current_location;
    if (!location) {
      if (vendor_id) {
        const v = db.prepare('SELECT name FROM vendors WHERE id = ?').get(vendor_id);
        location = v ? `Vendor: ${v.name}` : 'Out for Repair';
      } else {
        location = 'Parts Department';
      }
    }

    const stmt = db.prepare(`
      INSERT INTO repairs (
        ticket_number, part_name, part_number, serial_number, pcb_revision, physical_markings,
        quantity, original_farmer_id, intended_return_route, designated_farmer_id,
        vendor_id, technician_name, status, current_location,
        date_removed, date_shipped, vendor_rma_number, tracking_outbound,
        customer_po_wo, initial_symptom, internal_notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    const info = stmt.run(
      ticket_number,
      part_name.trim(),
      part_number || null,
      serial_number || null,
      pcb_revision || null,
      physical_markings || null,
      Number(quantity) || 1,
      original_farmer_id || null,
      intended_return_route || 'ORIGINAL_FARMER',
      designated_farmer_id || null,
      vendor_id || null,
      technician_name.trim(),
      status,
      location,
      date_removed || new Date().toISOString().split('T')[0],
      date_shipped || new Date().toISOString().split('T')[0],
      vendor_rma_number || null,
      tracking_outbound || null,
      customer_po_wo || null,
      initial_symptom || null,
      internal_notes || null
    );

    const repairId = info.lastInsertRowid;

    // Log creation event with intended route
    let routeDesc = 'Return to Original Customer';
    if (intended_return_route === 'FLOAT_STOCK') routeDesc = 'Hold in Float / Reman Stock';
    if (intended_return_route === 'DESIGNATED_FARMER') routeDesc = 'Designated for another customer';

    logEvent(
      repairId,
      'CREATED',
      `Logged repair ticket ${ticket_number} by ${technician_name}. Intended return route pre-tagged as: ${routeDesc}.`,
      technician_name
    );

    if (date_shipped && tracking_outbound) {
      logEvent(
        repairId,
        'SHIPPED',
        `Dispatched to vendor via tracking #${tracking_outbound}`,
        technician_name
      );
    }

    const createdRepair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(repairId);
    res.status(201).json(createdRepair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/repairs/:id/return-checkin - 3-Way Check-in Wizard upon Return
router.post('/:id/return-checkin', (req, res) => {
  try {
    const { id } = req.params;
    const {
      routing_choice, // 'ORIGINAL_FARMER' | 'FLOAT_STOCK' | 'REASSIGN_FARMER'
      shelf_bin_location,
      reassign_farmer_id,
      date_returned,
      vendor_cost,
      vendor_invoice_number,
      billed_amount,
      customer_po_wo,
      vendor_repair_notes,
      checked_in_by = 'Parts Desk'
    } = req.body;

    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(id);
    if (!repair) {
      return res.status(404).json({ error: 'Repair ticket not found' });
    }

    let newStatus = 'RETURNED_TO_SHOP';
    let newLocation = 'Parts Department';
    let currentFarmerId = repair.current_farmer_id;
    let billingStatus = 'READY_TO_BILL';

    if (routing_choice === 'ORIGINAL_FARMER') {
      newStatus = 'INSTALLED_ORIGINAL_FARMER';
      currentFarmerId = repair.original_farmer_id;
      const origFarmer = repair.original_farmer_id ? db.prepare('SELECT farm_name FROM farmers WHERE id = ?').get(repair.original_farmer_id) : null;
      newLocation = origFarmer ? `Customer: ${origFarmer.farm_name}` : 'Returned to Original Customer';
    } else if (routing_choice === 'FLOAT_STOCK') {
      newStatus = 'IN_FLOAT_STOCK';
      newLocation = shelf_bin_location ? `Shop Shelf: ${shelf_bin_location}` : 'Shop Float Stock (Non-Inventoried)';
      // Keep billing pending until deployed or billed as core
    } else if (routing_choice === 'REASSIGN_FARMER') {
      newStatus = 'REASSIGNED_NEW_FARMER';
      currentFarmerId = reassign_farmer_id;
      const newFarmer = reassign_farmer_id ? db.prepare('SELECT farm_name FROM farmers WHERE id = ?').get(reassign_farmer_id) : null;
      newLocation = newFarmer ? `Reassigned to Farm: ${newFarmer.farm_name}` : 'Reassigned Customer';
    }

    db.prepare(`
      UPDATE repairs
      SET status = ?,
          current_location = ?,
          shelf_bin_location = ?,
          current_farmer_id = ?,
          date_returned = ?,
          vendor_cost = COALESCE(?, vendor_cost),
          vendor_invoice_number = COALESCE(?, vendor_invoice_number),
          billed_amount = COALESCE(?, billed_amount),
          customer_po_wo = COALESCE(?, customer_po_wo),
          billing_status = ?,
          vendor_repair_notes = COALESCE(?, vendor_repair_notes),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      newStatus,
      newLocation,
      shelf_bin_location || null,
      currentFarmerId || null,
      date_returned || new Date().toISOString().split('T')[0],
      vendor_cost !== undefined ? Number(vendor_cost) : null,
      vendor_invoice_number || null,
      billed_amount !== undefined ? Number(billed_amount) : null,
      customer_po_wo || null,
      billingStatus,
      vendor_repair_notes || null,
      id
    );

    let eventSummary = `Checked in from vendor by ${checked_in_by}. `;
    if (routing_choice === 'ORIGINAL_FARMER') {
      eventSummary += `Routed to Original Farmer.`;
    } else if (routing_choice === 'FLOAT_STOCK') {
      eventSummary += `Stored in Non-Inventoried Float Stock at ${shelf_bin_location || 'Shop Shelf'}.`;
    } else if (routing_choice === 'REASSIGN_FARMER') {
      eventSummary += `Reassigned to new customer (Farmer ID #${reassign_farmer_id}).`;
    }

    if (vendor_cost) eventSummary += ` Vendor cost: $${vendor_cost}.`;
    if (vendor_invoice_number) eventSummary += ` Vendor Inv: ${vendor_invoice_number}.`;

    logEvent(id, 'RETURNED_CHECKIN', eventSummary, checked_in_by);

    const updated = db.prepare('SELECT * FROM repairs WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/repairs/:id/deploy-from-float - Route 4: Deploy from Float Stock to Farmer
router.post('/:id/deploy-from-float', (req, res) => {
  try {
    const { id } = req.params;
    const {
      destination_farmer_id,
      technician_name,
      date_reinstalled,
      customer_po_wo,
      billed_amount,
      notes
    } = req.body;

    const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(id);
    if (!repair) {
      return res.status(404).json({ error: 'Repair ticket not found' });
    }

    const farmer = db.prepare('SELECT farm_name, farm_id FROM farmers WHERE id = ?').get(destination_farmer_id);
    const farmerLabel = farmer ? `${farmer.farm_name} (${farmer.farm_id || 'ID: ' + destination_farmer_id})` : 'Assigned Customer';

    db.prepare(`
      UPDATE repairs 
      SET status = 'DEPLOYED_FROM_FLOAT',
          current_farmer_id = ?,
          current_location = ?,
          date_reinstalled = ?,
          customer_po_wo = COALESCE(?, customer_po_wo),
          billed_amount = COALESCE(?, billed_amount),
          billing_status = 'READY_TO_BILL',
          internal_notes = CASE WHEN ? IS NOT NULL THEN internal_notes || '\n[Deploy Note]: ' || ? ELSE internal_notes END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      destination_farmer_id,
      `Installed on Farm: ${farmer ? farmer.farm_name : 'Customer'}`,
      date_reinstalled || new Date().toISOString().split('T')[0],
      customer_po_wo || null,
      billed_amount !== undefined ? Number(billed_amount) : null,
      notes || null,
      notes || null,
      id
    );

    logEvent(
      id,
      'DEPLOYED_FROM_FLOAT',
      `Deployed & installed from Floating Stock onto ${farmerLabel} by ${technician_name || 'Technician'}. Work Order/PO: ${customer_po_wo || 'Pending'}. Billed: $${billed_amount || 0}.`,
      technician_name || 'Technician'
    );

    const updated = db.prepare('SELECT * FROM repairs WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/repairs/:id/bill - Update Billing & PO
router.post('/:id/bill', (req, res) => {
  try {
    const { id } = req.params;
    const { billing_status, billed_amount, customer_po_wo, notes, user = 'Billing Desk' } = req.body;

    db.prepare(`
      UPDATE repairs
      SET billing_status = ?,
          billed_amount = COALESCE(?, billed_amount),
          customer_po_wo = COALESCE(?, customer_po_wo),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      billing_status || 'BILLED',
      billed_amount !== undefined ? Number(billed_amount) : null,
      customer_po_wo || null,
      id
    );

    logEvent(
      id,
      'BILLING_UPDATE',
      `Billing status updated to "${billing_status}". Customer PO/WO: ${customer_po_wo || 'N/A'}. Billed Amount: $${billed_amount || 0}. ${notes || ''}`,
      user
    );

    const updated = db.prepare('SELECT * FROM repairs WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/repairs/:id - General Edit
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const allowed = [
      'part_name', 'part_number', 'serial_number', 'pcb_revision', 'physical_markings',
      'quantity', 'original_farmer_id', 'current_farmer_id', 'intended_return_route',
      'designated_farmer_id', 'vendor_id', 'technician_name', 'status', 'current_location',
      'shelf_bin_location', 'date_removed', 'date_shipped', 'date_returned', 'date_reinstalled',
      'vendor_rma_number', 'tracking_outbound', 'tracking_inbound', 'vendor_cost',
      'vendor_invoice_number', 'billing_status', 'billed_amount', 'customer_po_wo',
      'initial_symptom', 'vendor_repair_notes', 'internal_notes'
    ];

    const updates = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length === 0) {
      return res.json({ message: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    const sql = `UPDATE repairs SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    logEvent(id, 'EDITED', `Updated record details.`, fields.technician_name || 'User');

    const updated = db.prepare('SELECT * FROM repairs WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/repairs/:id/photos - Upload Board Photos
router.post('/:id/photos', upload.array('photos', 5), (req, res) => {
  try {
    const { id } = req.params;
    const { caption, uploaded_by = 'Technician' } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const insertedPhotos = [];
    for (const file of req.files) {
      const relPath = `/uploads/${file.filename}`;
      const info = db.prepare(`
        INSERT INTO repair_photos (repair_id, file_name, file_path, caption)
        VALUES (?, ?, ?, ?)
      `).run(id, file.originalname, relPath, caption || null);

      insertedPhotos.push({
        id: info.lastInsertRowid,
        file_name: file.originalname,
        file_path: relPath,
        caption
      });
    }

    logEvent(id, 'PHOTO_UPLOADED', `Uploaded ${req.files.length} photo(s) for visual identification.`, uploaded_by);

    res.status(201).json(insertedPhotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/repairs/export/csv - Export CSV
router.get('/export/csv', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        r.ticket_number as "Ticket #",
        r.part_name as "Part Details",
        r.part_number as "OEM Part #",
        r.serial_number as "Serial / Core ID",
        r.pcb_revision as "PCB Rev",
        r.physical_markings as "Physical Marks",
        r.quantity as "Qty",
        r.technician_name as "Who Removed/Tech",
        v.name as "Vendor",
        r.vendor_rma_number as "Vendor RMA / PO",
        r.intended_return_route as "Intended Route",
        f_orig.farm_name as "Original Farmer",
        f_orig.farm_id as "Orig Farmer Code",
        f_curr.farm_name as "Current / Deployed Farmer",
        r.status as "Current Status",
        r.current_location as "Location / Shelf",
        r.date_removed as "Date Removed",
        r.date_shipped as "Date Shipped",
        r.date_returned as "Date Returned",
        r.date_reinstalled as "Date Deployed",
        r.vendor_cost as "Vendor Cost ($)",
        r.vendor_invoice_number as "Vendor Inv #",
        r.billed_amount as "Billed Amount ($)",
        r.customer_po_wo as "Customer PO / Work Order",
        r.billing_status as "Billing Status",
        r.initial_symptom as "Initial Issue",
        r.internal_notes as "Internal Notes"
      FROM repairs r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      LEFT JOIN farmers f_orig ON r.original_farmer_id = f_orig.id
      LEFT JOIN farmers f_curr ON r.current_farmer_id = f_curr.id
      ORDER BY r.id DESC
    `).all();

    if (rows.length === 0) {
      return res.send('No data available for export');
    }

    // Convert to CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
    ];

    for (const row of rows) {
      const line = headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
      csvLines.push(line);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="kaebs-reman-repairs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvLines.join('\r\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
