import Papa from 'papaparse';
import db, { scheduleDbSync } from '../db.js';

/**
 * Normalizes Google Sheet URL into a direct CSV export endpoint
 * Preserves specific tab gid (e.g. gid=1526753041 for WAKA)
 */
export function getExportUrl(sheetUrl) {
  if (!sheetUrl || typeof sheetUrl !== 'string') return '';
  let url = sheetUrl.trim();

  // If already a direct export/pub url
  if (url.includes('output=csv') || url.includes('format=csv')) {
    return url;
  }

  // Handle standard Google Sheets URL: https://docs.google.com/spreadsheets/d/{ID}/edit...#gid={GID}
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    
    // Extract gid from URL path or hash parameter
    let gid = '0';
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return url;
}

/**
 * Process array of parsed rows from Google Sheet or CSV/TSV
 * Handles both 3-column WAKA format [A: Farm ID, B: Farm Name, C: Address]
 * and 7-column DataHub format [A: Farm ID, B: Farm Name, C: Phone, D: Email, E: Address, F: Sites, G: Date]
 */
export function upsertFarmersFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { count: 0, message: 'No rows to process' };
  }

  const findFarmer = db.prepare(`
    SELECT id FROM farmers 
    WHERE (farm_id = ? AND farm_id IS NOT NULL AND farm_id != '') 
       OR (LOWER(farm_name) = LOWER(?) AND farm_name IS NOT NULL AND farm_name != '')
    LIMIT 1
  `);

  const updateFarmer = db.prepare(`
    UPDATE farmers 
    SET farm_id = COALESCE(?, farm_id),
        farm_name = ?,
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        sites = COALESCE(?, sites),
        date_created = COALESCE(?, date_created),
        last_synced_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `);

  const insertFarmer = db.prepare(`
    INSERT INTO farmers (farm_id, farm_name, phone, email, address, sites, date_created, last_synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let added = 0;
  let updated = 0;

  const transaction = db.transaction((parsedRows) => {
    for (const row of parsedRows) {
      let farmId = '';
      let farmName = '';
      let phone = '';
      let email = '';
      let address = '';
      let sites = '';
      let dateCreated = '';

      if (Array.isArray(row)) {
        if (row.length <= 4) {
          // 3-Column WAKA Format: [Col 0: Farm ID, Col 1: Farm Name, Col 2: Address]
          farmId = (row[0] || '').toString().trim();
          farmName = (row[1] || '').toString().trim();
          address = (row[2] || '').toString().trim();
        } else {
          // 7-Column Format: [0: ID, 1: Name, 2: Phone, 3: Email, 4: Address, 5: Sites, 6: Date]
          farmId = (row[0] || '').toString().trim();
          farmName = (row[1] || '').toString().trim();
          phone = (row[2] || '').toString().trim();
          email = (row[3] || '').toString().trim();
          address = (row[4] || '').toString().trim();
          sites = (row[5] || '').toString().trim();
          dateCreated = (row[6] || '').toString().trim();
        }
      } else if (typeof row === 'object' && row !== null) {
        const keys = Object.keys(row);
        
        const findVal = (patterns) => {
          const matchedKey = keys.find(k => patterns.some(p => k.toLowerCase().includes(p.toLowerCase())));
          return matchedKey ? (row[matchedKey] || '').toString().trim() : '';
        };

        farmId = findVal(['farm id', 'customer id', 'code', 'id']) || (keys[0] ? (row[keys[0]] || '').toString().trim() : '');
        farmName = findVal(['farm name', 'name', 'customer']) || (keys[1] ? (row[keys[1]] || '').toString().trim() : '');
        address = findVal(['address', 'location', 'street']) || (keys[2] ? (row[keys[2]] || '').toString().trim() : '');
        phone = findVal(['phone', 'mobile', 'cell', 'tel']);
        email = findVal(['email', 'mail']);
        sites = findVal(['sites', 'site', 'barns']);
        dateCreated = findVal(['date created', 'created', 'date']);
      }

      // Skip header rows or empty rows
      if (!farmName || farmName.toLowerCase() === 'farm name' || farmName.toLowerCase() === 'name') {
        continue;
      }

      const existing = findFarmer.get(farmId, farmName);
      if (existing) {
        updateFarmer.run(farmId || null, farmName, phone || null, email || null, address || null, sites || null, dateCreated || null, existing.id);
        updated++;
      } else {
        insertFarmer.run(farmId || null, farmName, phone || null, email || null, address || null, sites || null, dateCreated || null);
        added++;
      }
    }
  });

  transaction(rows);

  const totalCount = db.prepare('SELECT COUNT(*) as count FROM farmers').get().count;

  db.prepare(`
    UPDATE sync_config 
    SET last_sync_timestamp = datetime('now'),
        last_synced_count = ?,
        sync_status = 'SUCCESS',
        error_message = NULL
    WHERE id = 1
  `).run(totalCount);

  scheduleDbSync();

  return { added, updated, total: totalCount };
}

/**
 * Fetch and sync directly from Google Sheet CSV URL
 */
export async function syncFromGoogleSheet(customUrl = null) {
  let sheetUrl = customUrl;
  if (!sheetUrl) {
    const config = db.prepare('SELECT sheet_url FROM sync_config WHERE id = 1').get();
    sheetUrl = config ? config.sheet_url : '';
  }

  if (!sheetUrl) {
    throw new Error('No Google Sheet URL configured.');
  }

  const exportUrl = getExportUrl(sheetUrl);

  try {
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Google Sheet is private or requires login (${response.status}). In Google Sheets, click "Share" -> "Anyone with the link can view", or use the Direct Paste tab.`);
      }
      throw new Error(`Google Sheet returned HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    const result = upsertFarmersFromRows(parsed.data);
    return {
      success: true,
      ...result,
      source: 'live_google_sheet',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    db.prepare(`
      UPDATE sync_config 
      SET sync_status = 'ERROR',
          error_message = ?
      WHERE id = 1
    `).run(error.message);
    scheduleDbSync();
    throw error;
  }
}

/**
 * Parse pasted text directly (tab-separated from Google Sheets copy-paste or CSV)
 */
export function importPastedText(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Pasted content is empty.');
  }

  const parsed = Papa.parse(rawText.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const result = upsertFarmersFromRows(parsed.data);
  return {
    success: true,
    ...result,
    source: 'pasted_import',
    timestamp: new Date().toISOString()
  };
}
