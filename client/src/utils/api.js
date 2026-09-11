const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/repairs/stats/summary`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchRepairs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const res = await fetch(`${API_BASE}/repairs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch repairs');
  return res.json();
}

export async function fetchRepairById(id) {
  const res = await fetch(`${API_BASE}/repairs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch repair details');
  return res.json();
}

export async function createRepair(data) {
  const res = await fetch(`${API_BASE}/repairs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create repair');
  }
  return res.json();
}

export async function updateRepair(id, data) {
  const res = await fetch(`${API_BASE}/repairs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update repair');
  }
  return res.json();
}

export async function deleteRepair(id) {
  const res = await fetch(`${API_BASE}/repairs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete repair');
  return res.json();
}

export async function returnCheckInRepair(id, data) {
  const res = await fetch(`${API_BASE}/repairs/${id}/return-checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to check in returned repair');
  }
  return res.json();
}

export async function deployFromFloat(id, data) {
  const res = await fetch(`${API_BASE}/repairs/${id}/deploy-from-float`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to deploy from float stock');
  }
  return res.json();
}

export async function updateBilling(id, data) {
  const res = await fetch(`${API_BASE}/repairs/${id}/bill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update billing');
  }
  return res.json();
}

export async function mysteryLookup(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const res = await fetch(`${API_BASE}/repairs/lookup/mystery?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to run mystery lookup');
  return res.json();
}

export async function uploadRepairPhotos(id, formData) {
  const res = await fetch(`${API_BASE}/repairs/${id}/photos`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload photos');
  return res.json();
}

export async function fetchFarmers(search = '') {
  const res = await fetch(`${API_BASE}/farmers?search=${encodeURIComponent(search)}&limit=1000`);
  if (!res.ok) throw new Error('Failed to fetch farmers');
  return res.json();
}

export async function fetchSyncStatus() {
  const res = await fetch(`${API_BASE}/farmers/sync/status`);
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
}

export async function triggerFarmerSync(sheetUrl = null) {
  const res = await fetch(`${API_BASE}/farmers/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheet_url: sheetUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to sync with Google Sheet');
  }
  return res.json();
}

export async function importPastedFarmers(rawText) {
  const res = await fetch(`${API_BASE}/farmers/import-paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import pasted data');
  }
  return res.json();
}

export async function fetchVendors() {
  const res = await fetch(`${API_BASE}/vendors`);
  if (!res.ok) throw new Error('Failed to fetch vendors');
  return res.json();
}

export async function createVendor(data) {
  const res = await fetch(`${API_BASE}/vendors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create vendor');
  return res.json();
}

export async function updateVendor(id, data) {
  const res = await fetch(`${API_BASE}/vendors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update vendor');
  return res.json();
}

export async function deleteVendor(id) {
  const res = await fetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete vendor');
  return res.json();
}

// Technicians API
export async function fetchTechnicians() {
  const res = await fetch(`${API_BASE}/technicians`);
  if (!res.ok) throw new Error('Failed to fetch technicians');
  return res.json();
}

export async function createTechnician(data) {
  const res = await fetch(`${API_BASE}/technicians`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create technician');
  return res.json();
}

export async function updateTechnician(id, data) {
  const res = await fetch(`${API_BASE}/technicians/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update technician');
  return res.json();
}

export async function deleteTechnician(id) {
  const res = await fetch(`${API_BASE}/technicians/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete technician');
  return res.json();
}
