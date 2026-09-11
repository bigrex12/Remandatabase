import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'reman_tracker.db');
const db = new Database(dbPath);

const journalMode = process.env.SQLITE_JOURNAL_MODE || 'WAL';
try {
  db.pragma(`journal_mode = ${journalMode}`);
} catch (e) {
  console.log(`Fallback to DELETE journal mode for FUSE compatibility: ${e.message}`);
  db.pragma('journal_mode = DELETE');
}
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Farmers table (Matching WAKA Sheet: Farm ID, Farm Name, Address)
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id TEXT,
      farm_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      sites TEXT,
      date_created TEXT,
      notes TEXT,
      last_synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_farmers_name ON farmers(farm_name);
    CREATE INDEX IF NOT EXISTS idx_farmers_farm_id ON farmers(farm_id);
  `);

  // 2. Technicians table
  db.exec(`
    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 3. Vendors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      rma_portal_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 4. Sync Configuration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_url TEXT,
      last_sync_timestamp TEXT,
      last_synced_count INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'IDLE',
      error_message TEXT
    );
  `);

  const wakaSheetUrl = 'https://docs.google.com/spreadsheets/d/1h_0k2-3TtGVCl514Bh_ZtHVVdqZN7N1oKBt9FtrzFdw/edit?gid=1526753041#gid=1526753041';

  const existingConfig = db.prepare('SELECT id FROM sync_config LIMIT 1').get();
  if (!existingConfig) {
    db.prepare(`
      INSERT INTO sync_config (sheet_url, sync_status)
      VALUES (?, 'IDLE')
    `).run(wakaSheetUrl);
  } else {
    // Update to new WAKA URL if it was on the old sheet
    db.prepare(`UPDATE sync_config SET sheet_url = ? WHERE id = 1`).run(wakaSheetUrl);
  }

  // 5. Repairs / Reman tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      part_name TEXT NOT NULL,
      part_number TEXT,
      serial_number TEXT,
      pcb_revision TEXT,
      physical_markings TEXT,
      quantity INTEGER DEFAULT 1,
      
      original_farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
      current_farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
      intended_return_route TEXT DEFAULT 'ORIGINAL_FARMER',
      designated_farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
      
      vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      technician_name TEXT NOT NULL,
      status TEXT DEFAULT 'SHIPPED_TO_VENDOR',
      current_location TEXT,
      shelf_bin_location TEXT,
      
      date_removed TEXT,
      date_shipped TEXT,
      date_returned TEXT,
      date_reinstalled TEXT,
      
      vendor_rma_number TEXT,
      tracking_outbound TEXT,
      tracking_inbound TEXT,
      
      vendor_cost REAL DEFAULT 0.0,
      vendor_invoice_number TEXT,
      billing_status TEXT DEFAULT 'PENDING',
      billed_amount REAL DEFAULT 0.0,
      customer_po_wo TEXT,
      
      initial_symptom TEXT,
      vendor_repair_notes TEXT,
      internal_notes TEXT,
      
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
    CREATE INDEX IF NOT EXISTS idx_repairs_ticket ON repairs(ticket_number);
    CREATE INDEX IF NOT EXISTS idx_repairs_serial ON repairs(serial_number);
    CREATE INDEX IF NOT EXISTS idx_repairs_rma ON repairs(vendor_rma_number);
    CREATE INDEX IF NOT EXISTS idx_repairs_orig_farmer ON repairs(original_farmer_id);
    CREATE INDEX IF NOT EXISTS idx_repairs_curr_farmer ON repairs(current_farmer_id);
  `);

  // 6. Repair Events / Full Provenance Audit Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS repair_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      performed_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_repair_events_repair_id ON repair_events(repair_id);
  `);

  // 7. Repair Photos
  db.exec(`
    CREATE TABLE IF NOT EXISTS repair_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_id INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      caption TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_repair_photos_repair_id ON repair_photos(repair_id);
  `);

  // Automatically purge legacy sample repair tickets from persistent cloud storage bucket
  try {
    db.prepare(`
      DELETE FROM repairs 
      WHERE ticket_number IN ('RMN-2026-0001', 'RMN-2026-0002', 'RMN-2026-0003', 'RMN-2026-0004', 'RMN-2026-0005')
    `).run();
  } catch (e) {
    console.log('Purge check:', e.message);
  }

  seedInitialData();
}

function seedInitialData() {
  // Seed Technicians
  const techCount = db.prepare('SELECT COUNT(*) as count FROM technicians').get().count;
  if (techCount === 0) {
    const insertTech = db.prepare('INSERT INTO technicians (name) VALUES (?)');
    insertTech.run('Jonathan');
    insertTech.run('Matt A');
    insertTech.run('Keaton');
    insertTech.run('Dave M');
  }

  // Seed Vendors
  const vendorCount = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
  if (vendorCount === 0) {
    const insertVendor = db.prepare(`
      INSERT INTO vendors (name, contact_name, contact_email, contact_phone, rma_portal_url, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertVendor.run('Ag Express Electronics', 'Dave Miller', 'repairs@agexpress.com', '515-289-2746', 'https://agexpress.com/rma', 'Specializes in sprayers, rate controllers, GPS monitors, and custom harness boards.');
    insertVendor.run('Flight Systems Industrial Products', 'Tech Support', 'info@fsip.biz', '800-333-1194', 'https://fsip.biz/support', 'Industrial motor controllers, board rebuilds, servo drivers.');
    insertVendor.run('Lely Reman / Factory Direct', 'Warranty Desk', 'service.na@lely.com', '888-245-4684', 'https://yourlely.com', 'Astronaut A4/A5 robot arm controllers, MQC sensors, CRS boards.');
    insertVendor.run('CoreTech Electronics', 'Mark Jenkins', 'rma@coretechelec.com', '574-555-0199', 'https://coretechelec.com/portal', 'Fast turnaround for general agricultural PCBs, power supplies, and inverter modules.');
    insertVendor.run('Schulte Hardware & Board Repair', 'Service Team', 'repairs@schultepcb.com', '800-555-0142', '', 'Specialized sensor calibrations and legacy circuit boards.');
  }

  // Seed Farmers from WAKA Sheet screenshot
  const farmerCount = db.prepare('SELECT COUNT(*) as count FROM farmers').get().count;
  if (farmerCount === 0) {
    const insertFarmer = db.prepare(`
      INSERT INTO farmers (farm_id, farm_name, address, notes)
      VALUES (?, ?, ?, ?)
    `);

    const wakaSeedFarms = [
      { id: 'ZIMARN', name: 'Arnold Zimmerman', address: '67738 CR 13, Nappanee, IN 46551' },
      { id: 'ZIMART', name: 'Art Zimmerman', address: '67738 CR 13, Nappanee, IN 46550' },
      { id: 'MARART', name: 'Arthur Martin', address: '66233 County Rd 7, Wakarusa, IN 46573' },
      { id: '643c2eab', name: 'Austin Thomas', address: '12259 Co Rd 26, Middlebury, IN 46540, USA' },
      { id: 'b65c4155', name: 'Austyn Nettrour', address: '8311 1st Rd, Bremen, IN 46506, USA' },
      { id: 'AUTDAI', name: 'Automated Dairy Systems', address: '1575 South Lincoln, Jerome, ID 83338' },
      { id: 'AYEFAR', name: 'Ayers Farms Inc', address: '1415 E 400 S, Bringhurst, IN 46913' },
      { id: 'B&DAG', name: 'B & D Ag Service, Inc.', address: '10662 E 550 N, Peru, IN 46970' },
      { id: 'BAHDON', name: 'Bahler Hog & Grain', address: '11297 W 400 S, Wolcott, IN 47995, USA' },
      { id: 'BAHLER', name: 'Bahler Hog & Grain', address: '11297 W. 400 S., Wolcott, IN 47995' },
      { id: 'WILBAI', name: 'Bailey Wiltfang', address: '9183 S 630 W, Rensselaer, IN 47978' },
      { id: 'SEEBAR', name: 'Bart And Lawrence See', address: '419 E 1100 N, Macy, IN 46951' },
      { id: 'BBHTRU', name: 'Bbh Trucking', address: '8985 S. State Rd 17, Kewanna, IN 46939' },
      { id: 'BEEDAI', name: 'Beer Dairy', address: '9194 North Orn Road, Milford, IN 46542' },
      { id: 'CUST002', name: 'Belstra', address: '' },
      { id: 'HOLBEN', name: 'Ben P Holden', address: '114 Westgate Blvd, Wakarusa, IN 46573' },
      { id: '472e85a3', name: 'Ben Sheets', address: '70226 Co Rd 11, Nappanee, IN 46550, USA' },
      { id: 'CUST003', name: 'Ambia Dairy', address: '8444 S 900 W, Ambia, IN 47917, USA' },
      { id: 'CUST051', name: 'Berby', address: '' },
      { id: 'GROBER', name: 'Bernard Grott', address: '5416 E 1000 N, La Porte, IN 46350' },
      { id: 'EGGBUR', name: 'Bert Egging', address: '10379 W 900 N, Etna Green, IN 46524' },
      { id: 'BESCON', name: 'Bespoke Construction, Llc', address: '8575 Zionsville Rd, Indianapolis, IN 46268' },
      { id: 'T-118', name: 'Miller Dairy Farm', address: '24180 CR 38, Goshen, IN 46526' },
      { id: 'C-204', name: 'Sunrise Holsteins', address: '68921 SR 19, Wakarusa, IN 46573' },
      { id: 'M-301', name: 'Elkhart Valley Farms', address: '11400 CR 142, Syracuse, IN 46567' }
    ];

    for (const f of wakaSeedFarms) {
      insertFarmer.run(f.id, f.name, f.address, 'WAKA Farm List');
    }
  }

  // (No sample repairs seeded - production clean slate)
}

export default db;
