import React from 'react';
import { Search, Download, RotateCcw } from 'lucide-react';

export function FilterBar({
  activeTab,
  onSelectTab,
  search,
  onSearchChange,
  vendorId,
  onVendorChange,
  technician,
  onTechChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  vendors = [],
  technicians = [],
  onExportCsv,
  onResetFilters
}) {
  const tabs = [
    { id: 'active', label: 'All Orders' },
    { id: 'vendor_out', label: 'Out at Vendor' },
    { id: 'float_stock', label: 'Stock / Float' },
    { id: 'ready_bill', label: 'Ready to Bill' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All Records' },
  ];

  const hasActiveFilters = search || vendorId || technician || dateFrom || dateTo;

  return (
    <div className="space-y-3.5">
      {/* Navigation Tabs (Pill Buttons matching user screenshot) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#101624] text-slate-300 hover:bg-[#161F34] hover:text-white border border-[#1E293B]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Filter Bar matching screenshot layout */}
      <div className="p-4 rounded-2xl bg-[#101624] border border-[#1E293B] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          
          {/* Search Input */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              SEARCH PARTS / IDS / COMMENTS
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Vendor Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              VENDOR
            </label>
            <select
              value={vendorId}
              onChange={(e) => onVendorChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ordered By (Tech) Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              ORDERED BY
            </label>
            <select
              value={technician}
              onChange={(e) => onTechChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Anyone</option>
              {technicians.map((t) => {
                const name = typeof t === 'string' ? t : t.name;
                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date From */}
          <div className="md:col-span-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              DATE FROM
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Date To */}
          <div className="md:col-span-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              DATE TO
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Export CSV Button */}
          <div className="md:col-span-1 flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-[#161F34] hover:bg-[#1E2B49] border border-slate-700/60 rounded-xl transition-all cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="p-2 text-xs text-slate-400 hover:text-slate-200 bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
