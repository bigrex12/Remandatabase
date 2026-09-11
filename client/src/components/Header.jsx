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
    <header className="border-b border-[#2A3750] bg-[#111927]/95 backdrop-blur-md sticky top-0 z-30 px-6 py-4 shadow-md shadow-black/20">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title and Icon matching reference screenshot */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/40">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                KAEBS Wakarusa Orders
              </h1>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              Real-time order insights & lookup
            </p>
          </div>
        </div>

        {/* Action Controls & Top Bar */}
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Mystery Part Lookup Button */}
          <button
            onClick={onOpenMysteryLookup}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-amber-200 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 rounded-xl transition-all shadow-sm cursor-pointer"
            title="Identify returned board without box/tags"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mystery Lookup</span>
          </button>

          {/* Farmer Google Sheet Sync Status Pill */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
              isSyncError
                ? 'bg-rose-950/80 border-rose-600/80 text-rose-200 hover:bg-rose-900'
                : 'bg-[#182338] border-[#384868] text-slate-200 hover:bg-[#202E4A] hover:border-slate-500'
            }`}
            title="Google Sheets WAKA Farm Sync & Settings"
          >
            {isSyncError ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>
              WAKA Farms: {syncStatus?.total_farmers ?? 0}
            </span>
          </button>

          {/* Technicians Manager */}
          <button
            onClick={onOpenTechModal}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-[#182338] hover:bg-[#202E4A] border border-[#384868] hover:border-slate-500 rounded-xl transition-all cursor-pointer"
            title="Add or edit shop technicians"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Techs</span>
          </button>

          {/* Vendors Manager */}
          <button
            onClick={onOpenVendorModal}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-[#182338] hover:bg-[#202E4A] border border-[#384868] hover:border-slate-500 rounded-xl transition-all cursor-pointer"
            title="Add or edit vendors"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Vendors</span>
          </button>

          {/* Log New Repair Button */}
          <button
            onClick={onOpenNewRepairModal}
            className="flex items-center gap-2 px-4.5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/35 border border-indigo-400/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log New Part</span>
          </button>
        </div>

      </div>
    </header>
  );
}
