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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                WAKA Farm List & Data Maintenance
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Syncs with your Google Sheet WAKA tab (Col A: Farm ID, Col B: Farm Name, Col C: Address)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E293B] bg-[#0C101A] px-6">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Sheet (WAKA Tab)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Direct Copy-Paste Import
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            View Cached Farms ({syncStatus?.total_farmers ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'maintenance'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Clean Slate / Purge
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Notice</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Live Google Sheet URL */}
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Cached Farms:</span>
                  <span className="font-bold text-white font-mono">{syncStatus?.total_farmers ?? 0} Farms</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Last Sync:</span>
                  <span className="font-mono text-slate-300">
                    {syncStatus?.last_sync_timestamp ? formatDate(syncStatus.last_sync_timestamp) : 'On load'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WAKA Sheet URL (includes gid=1526753041):
                </label>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-indigo-300">📋 WAKA Sheet Layout:</div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                  <div>Col A: Farm ID (e.g. ZIMARN)</div>
                  <div>Col B: Farm Name</div>
                  <div>Col C: Address</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 Note: If your Google Sheet is restricted inside your organization, click <strong>Share ➔ "Anyone with link can view"</strong> to enable automatic web sync, or use the <strong>Direct Copy-Paste Import</strong> tab anytime.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSyncNow}
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
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
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <div className="font-semibold text-indigo-300 mb-1">📋 Copy & Paste from WAKA Sheet:</div>
                <p className="text-slate-400 text-xs">
                  1. Open the WAKA tab in your Google Sheet.<br />
                  2. Select all rows (columns A through C), copy (`Ctrl+C`).<br />
                  3. Paste (`Ctrl+V`) into the box below and click <strong>"Import WAKA Farms"</strong>!
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Paste WAKA Sheet Rows:
                </label>
                <textarea
                  rows="8"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`ZIMARN\tArnold Zimmerman\t67738 CR 13 NAPPANEE, IN 46551\nZIMART\tArt Zimmerman\t67738 CR 13 NAPPANEE, IN 46550\nMARART\tArthur Martin\t66233 COUNTY RD 7 WAKARUSA, IN 46573\nAUTDAI\tAutomated Dairy Systems\t1575 SOUTH LINCOLN PO BOX 170 JEROME, ID 83338`}
                  className="w-full p-3 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImportPaste}
                  disabled={pasting || !pasteContent.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
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
                  className="w-full pl-10 pr-4 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-xl border border-[#1E293B] divide-y divide-[#182133]">
                {farmersList.map((f) => (
                  <div key={f.id} className="p-3 text-xs flex items-center justify-between bg-[#0B0F17] hover:bg-[#131B2C]">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{f.farm_name}</span>
                        {f.farm_id && (
                          <span className="text-[10px] font-mono font-semibold bg-indigo-950/80 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800/40">
                            {f.farm_id}
                          </span>
                        )}
                      </div>
                      {f.address && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
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
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/60 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span>Purge All Sample / Test Repairs</span>
                </div>
                <p className="text-slate-300">
                  Use this option to remove all logged repair orders, timeline events, and uploaded photos from the system.
                </p>
                <p className="text-slate-400 text-[11px]">
                  ✓ <strong>Preserved Data:</strong> All WAKA Farms, Technicians, and Vendors are completely preserved and will NOT be deleted.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Clear All Orders (Clean Slate)</div>
                  <div className="text-[11px] text-slate-400">Permanently reset the repairs table to 0 entries.</div>
                </div>
                <button
                  onClick={handleClearAllRepairs}
                  disabled={clearingOrders}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
