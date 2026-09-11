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

  // Seed sample repairs matching reference screenshot
  const repairCount = db.prepare('SELECT COUNT(*) as count FROM repairs').get().count;
  if (repairCount === 0) {
    const farmers = db.prepare('SELECT id, farm_name, farm_id FROM farmers').all();
    const vendors = db.prepare('SELECT id, name FROM vendors').all();

    const fT118 = farmers.find(f => f.farm_id === 'T-118' || f.farm_id === 'MARART') || farmers[0];
    const fZim = farmers.find(f => f.farm_id === 'ZIMARN') || farmers[1];
    const fAut = farmers.find(f => f.farm_id === 'AUTDAI') || farmers[2];

    const vLely = vendors.find(v => v.name.includes('Lely')) || vendors[0];
    const vAg = vendors.find(v => v.name.includes('Ag Express')) || vendors[1];

    const seedRepairs = [
      {
        ticket: 'RMN-2026-0001',
        partName: 'Parasalic pump tube',
        partNumber: '9.1185.0108.0',
        serial: 'SN-PUMP-8841',
        pcbRev: 'Rev B',
        markings: '',
        qty: 10,
        origFarmerId: null,
        currFarmerId: null,
        intendedRoute: 'FLOAT_STOCK',
        vendorId: vLely.id,
        tech: 'Matt A',
        status: 'SHIPPED_TO_VENDOR',
        location: 'Stock Inventory',
        shelfBin: '',
        dateRemoved: '2026-08-17',
        dateShipped: '2026-08-17',
        dateReturned: null,
        dateReinstalled: null,
        rma: '',
        trackOut: '1Z9999999999999991',
        vendorCost: 0,
        vendorInvoiceNumber: null,
        billingStatus: 'PENDING',
        billedAmount: 0,
        customerPo: '',
        symptom: 'Routine rebuild order',
        notes: ''
      },
      {
        ticket: 'RMN-2026-0002',
        partName: 'M12 cable',
        partNumber: '6.2001.1017.0',
        serial: 'M12-10492',
        pcbRev: '',
        markings: '',
        qty: 2,
        origFarmerId: null,
        currFarmerId: null,
        intendedRoute: 'FLOAT_STOCK',
        vendorId: vAg.id,
        tech: 'Matt A',
        status: 'SHIPPED_TO_VENDOR',
        location: 'Stock Inventory',
        shelfBin: '',
        dateRemoved: '2026-08-14',
        dateShipped: '2026-08-14',
        dateReturned: null,
        dateReinstalled: null,
        rma: 'PO 13441',
        trackOut: '',
        vendorCost: 0,
        vendorInvoiceNumber: null,
        billingStatus: 'PENDING',
        billedAmount: 0,
        customerPo: 'PO 13441',
        symptom: 'Connector pin rebuild',
        notes: ''
      },
      {
        ticket: 'RMN-2026-0003',
        partName: 'MQC Sensor',
        partNumber: '5.1005.4120.0',
        serial: 'MQC-4120',
        pcbRev: 'v3.1',
        markings: '',
        qty: 3,
        origFarmerId: null,
        currFarmerId: null,
        intendedRoute: 'FLOAT_STOCK',
        vendorId: vLely.id,
        tech: 'Keaton',
        status: 'SHIPPED_TO_VENDOR',
        location: 'Stock Inventory',
        shelfBin: '',
        dateRemoved: '2026-08-14',
        dateShipped: '2026-08-14',
        dateReturned: null,
        dateReinstalled: null,
        rma: 'PO 13441',
        trackOut: '',
        vendorCost: 0,
        vendorInvoiceNumber: null,
        billingStatus: 'PENDING',
        billedAmount: 0,
        customerPo: 'PO 13441',
        symptom: 'Calibration calibration error',
        notes: ''
      },
      {
        ticket: 'RMN-2026-0004',
        partName: 'A5 Cables',
        partNumber: '6.2001.1020.0',
        serial: 'A5-CB-991',
        pcbRev: '',
        markings: 'Yellow tape',
        qty: 1,
        origFarmerId: fT118.id,
        currFarmerId: null,
        intendedRoute: 'ORIGINAL_FARMER',
        vendorId: vAg.id,
        tech: 'Jonathan',
        status: 'SHIPPED_TO_VENDOR',
        location: 'Farmer: T-118',
        shelfBin: '',
        dateRemoved: '2026-08-14',
        dateShipped: '2026-08-14',
        dateReturned: null,
        dateReinstalled: null,
        rma: '',
        trackOut: '',
        vendorCost: 0,
        vendorInvoiceNumber: null,
        billingStatus: 'PENDING',
        billedAmount: 0,
        customerPo: '',
        symptom: 'Intermittent signal loss',
        notes: ''
      },
      {
        ticket: 'RMN-2026-0005',
        partName: 'A5 Cables',
        partNumber: '6.2001.1034.0',
        serial: 'A5-CB-992',
        pcbRev: '',
        markings: '',
        qty: 1,
        origFarmerId: fT118.id,
        currFarmerId: null,
        intendedRoute: 'ORIGINAL_FARMER',
        vendorId: vAg.id,
        tech: 'Jonathan',
        status: 'SHIPPED_TO_VENDOR',
        location: 'Farmer: T-118',
        shelfBin: '',
        dateRemoved: '2026-08-14',
        dateShipped: '2026-08-14',
        dateReturned: null,
        dateReinstalled: null,
        rma: '',
        trackOut: '',
        vendorCost: 0,
        vendorInvoiceNumber: null,
        billingStatus: 'PENDING',
        billedAmount: 0,
        customerPo: '',
        symptom: 'Harness wire damage',
        notes: ''
      }
    ];

    const insertRepair = db.prepare(`
      INSERT INTO repairs (
        ticket_number, part_name, part_number, serial_number, pcb_revision, physical_markings,
        quantity, original_farmer_id, current_farmer_id, intended_return_route,
        vendor_id, technician_name, status, current_location, shelf_bin_location,
        date_removed, date_shipped, date_returned, date_reinstalled,
        vendor_rma_number, tracking_outbound, vendor_cost, vendor_invoice_number,
        billing_status, billed_amount, customer_po_wo, initial_symptom, internal_notes
      ) VALUES (
        @ticket, @partName, @partNumber, @serial, @pcbRev, @markings,
        @qty, @origFarmerId, @currFarmerId, @intendedRoute,
        @vendorId, @tech, @status, @location, @shelfBin,
        @dateRemoved, @dateShipped, @dateReturned, @dateReinstalled,
        @rma, @trackOut, @vendorCost, @vendorInvoiceNumber,
        @billingStatus, @billedAmount, @customerPo, @symptom, @notes
      )
    `);

    const insertEvent = db.prepare(`
      INSERT INTO repair_events (repair_id, event_type, description, performed_by, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const r of seedRepairs) {
      const info = insertRepair.run(r);
      const repairId = info.lastInsertRowid;
      insertEvent.run(repairId, 'CREATED', `Logged repair ticket ${r.ticket} by ${r.tech}`, r.tech, r.dateRemoved);
    }
  }
}

export default db;
