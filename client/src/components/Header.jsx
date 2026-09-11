import React from 'react';
import { Database, RefreshCw, Settings, Building2, Plus, Sparkles, CheckCircle2, AlertCircle, Users } from 'lucide-react';

export function Header({
  syncStatus,
  onOpenSyncModal,
  onOpenVendorModal,
  onOpenTechModal,
  onOpenNewRepairModal,
  onOpenMysteryLookup,
  onQuickSync
}) {
  const isSyncSuccess = syncStatus?.sync_status === 'SUCCESS';
  const isSyncError = syncStatus?.sync_status === 'ERROR';

  return (
    <header className="border-b border-[#1E293B] bg-[#0E131F]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title and Icon matching reference screenshot */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                KAEBS Wakarusa Orders
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time order insights & lookup
            </p>
          </div>
        </div>

        {/* Action Controls & Top Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Mystery Part Lookup Button */}
          <button
            onClick={onOpenMysteryLookup}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-all shadow-sm cursor-pointer"
            title="Identify returned board without box/tags"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mystery Lookup</span>
          </button>

          {/* Farmer Google Sheet Sync Status Pill */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              isSyncError
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                : 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
            title="Google Sheets WAKA Farm Sync & Settings"
          >
            {isSyncError ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              WAKA Farms: {syncStatus?.total_farmers ?? 0}
            </span>
          </button>

          {/* Technicians Manager */}
          <button
            onClick={onOpenTechModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg transition-all cursor-pointer"
            title="Add or edit shop technicians"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Techs</span>
          </button>

          {/* Vendors Manager */}
          <button
            onClick={onOpenVendorModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg transition-all cursor-pointer"
            title="Add or edit vendors"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Vendors</span>
          </button>

          {/* Log New Repair Button */}
          <button
            onClick={onOpenNewRepairModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Part</span>
          </button>
        </div>

      </div>
    </header>
  );
}
