import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Clipboard, CheckCircle2, AlertCircle, Search, Database, Trash2 } from 'lucide-react';
import { fetchSyncStatus, triggerFarmerSync, importPastedFarmers, fetchFarmers, clearAllRepairs } from '../utils/api';
import { formatDate } from '../utils/formatters';

export function FarmerSyncModal({ isOpen, onClose, onSyncComplete }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('sheet');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1h_0k2-3TtGVCl514Bh_ZtHVVdqZN7N1oKBt9FtrzFdw/edit?gid=1526753041#gid=1526753041');
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [pasteContent, setPasteContent] = useState('');
  const [pasting, setPasting] = useState(false);

  const [farmersList, setFarmersList] = useState([]);
  const [listSearch, setListSearch] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [clearingOrders, setClearingOrders] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await fetchSyncStatus();
      setSyncStatus(data);
      if (data.sheet_url) setSheetUrl(data.sheet_url);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFarmersList = async () => {
    setLoadingList(true);
    try {
      const list = await fetchFarmers(listSearch);
      setFarmersList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      loadFarmersList();
    }
  }, [activeTab, listSearch]);

  const handleSyncNow = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await triggerFarmerSync(sheetUrl);
      setSuccessMsg(`Successfully synced! Total ${res.total} farms (Added: ${res.added}, Updated: ${res.updated}).`);
      await loadStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setError(err.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPaste = async () => {
    if (!pasteContent.trim()) {
      setError('Please paste rows from your WAKA Google Sheet first.');
      return;
    }
    setPasting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await importPastedFarmers(pasteContent);
      setSuccessMsg(`Imported successfully! Total ${res.total} farms (Added: ${res.added}, Updated: ${res.updated}).`);
      setPasteContent('');
      await loadStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setPasting(false);
    }
  };

  const handleClearAllRepairs = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all repair orders? This gives you a 100% clean slate. Registered farms, vendors, and technicians will remain safe.')) {
      return;
    }
    setClearingOrders(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await clearAllRepairs();
      setSuccessMsg('All repair orders cleared successfully! Database is now a clean slate.');
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setError(err.message || 'Failed to clear repairs');
    } finally {
      setClearingOrders(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0F1829]">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                WAKA Farm List & Data Maintenance
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Syncs with your Google Sheet WAKA tab (Col A: Farm ID, Col B: Farm Name, Col C: Address)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A3B5A] bg-[#0D1524] px-6">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Google Sheet (WAKA Tab)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Direct Copy-Paste Import
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            View Cached Farms ({syncStatus?.total_farmers ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'maintenance'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Clean Slate / Purge
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Notice</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Live Google Sheet URL */}
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0C1322] border border-[#2A3B5A] space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Current Cached Farms:</span>
                  <span className="font-bold text-white font-mono">{syncStatus?.total_farmers ?? 0} Farms</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/80">
                  <span className="text-slate-300 font-medium">Last Sync:</span>
                  <span className="font-mono text-indigo-300 font-semibold">
                    {syncStatus?.last_sync_timestamp ? formatDate(syncStatus.last_sync_timestamp) : 'On load'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  WAKA Sheet URL (includes gid=1526753041):
                </label>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#0C1322] border border-[#2A3B5A] text-xs text-slate-200 space-y-1.5">
                <div className="font-bold text-indigo-300">📋 WAKA Sheet Layout:</div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-300">
                  <div>Col A: Farm ID (e.g. ZIMARN)</div>
                  <div>Col B: Farm Name</div>
                  <div>Col C: Address</div>
                </div>
                <div className="text-xs text-slate-400 pt-1">
                  💡 Note: If your Google Sheet is restricted inside your organization, click <strong>Share ➔ "Anyone with link can view"</strong> to enable automatic web sync, or use the <strong>Direct Copy-Paste Import</strong> tab anytime.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSyncNow}
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Syncing...' : 'Sync Now from WAKA Sheet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Copy-Paste Import */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0C1322] border border-[#2A3B5A] text-xs text-slate-200">
                <div className="font-bold text-indigo-300 mb-1">📋 Copy & Paste from WAKA Sheet:</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  1. Open the WAKA tab in your Google Sheet.<br />
                  2. Select all rows (columns A through C), copy (`Ctrl+C`).<br />
                  3. Paste (`Ctrl+V`) into the box below and click <strong className="text-white">"Import WAKA Farms"</strong>!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Paste WAKA Sheet Rows:
                </label>
                <textarea
                  rows="8"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`ZIMARN\tArnold Zimmerman\t67738 CR 13 NAPPANEE, IN 46551\nZIMART\tArt Zimmerman\t67738 CR 13 NAPPANEE, IN 46550\nMARART\tArthur Martin\t66233 COUNTY RD 7 WAKARUSA, IN 46573\nAUTDAI\tAutomated Dairy Systems\t1575 SOUTH LINCOLN PO BOX 170 JEROME, ID 83338`}
                  className="w-full p-3.5 text-xs bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImportPaste}
                  disabled={pasting || !pasteContent.trim()}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>{pasting ? 'Importing...' : 'Import WAKA Farms'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: List View */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search farms by name, ID (e.g. ZIMARN), or address..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-xl border border-[#2A3B5A] divide-y divide-[#1E2D47]">
                {farmersList.map((f) => (
                  <div key={f.id} className="p-3.5 text-sm flex items-center justify-between bg-[#0C1322] hover:bg-[#18243C] transition-colors">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{f.farm_name}</span>
                        {f.farm_id && (
                          <span className="text-xs font-mono font-bold bg-indigo-950/90 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/50">
                            {f.farm_id}
                          </span>
                        )}
                      </div>
                      {f.address && (
                        <div className="text-xs text-slate-300 font-medium mt-0.5">
                          📍 {f.address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Clean Slate / Purge */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/70 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span>Purge All Sample / Test Repairs</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">
                  Use this option to remove all logged repair orders, timeline events, and uploaded photos from the system.
                </p>
                <p className="text-rose-200 text-xs font-semibold">
                  ✓ Preserved Data: All WAKA Farms, Technicians, and Vendors are completely preserved and will NOT be deleted.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0C1322] border border-[#2A3B5A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Clear All Orders (Clean Slate)</div>
                  <div className="text-xs text-slate-300 font-medium">Permanently reset the repairs table to 0 entries.</div>
                </div>
                <button
                  onClick={handleClearAllRepairs}
                  disabled={clearingOrders}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{clearingOrders ? 'Clearing...' : 'Purge All Repair Orders'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
