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
    <div className="space-y-4">
      {/* Navigation Tabs (Pill Buttons matching user screenshot) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4.5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-400/40'
                  : 'bg-[#141E32] text-slate-200 hover:bg-[#1C2A46] hover:text-white border border-[#2A3B5A]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Filter Bar matching screenshot layout */}
      <div className="p-5 rounded-2xl bg-[#141E32] border border-[#2A3B5A] shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="md:col-span-4">
            <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
              SEARCH PARTS / IDS / COMMENTS
            </label>
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10.5 pr-4 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-medium"
              />
            </div>
          </div>

          {/* Vendor Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
              VENDOR
            </label>
            <select
              value={vendorId}
              onChange={(e) => onVendorChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all cursor-pointer font-medium"
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
            <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
              ORDERED BY
            </label>
            <select
              value={technician}
              onChange={(e) => onTechChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all cursor-pointer font-medium"
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
            <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
              DATE FROM
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
            />
          </div>

          {/* Date To */}
          <div className="md:col-span-1.5">
            <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
              DATE TO
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
            />
          </div>

          {/* Export CSV Button */}
          <div className="md:col-span-1 flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-slate-100 bg-[#1C2A46] hover:bg-[#25385E] border border-[#384E77] rounded-xl transition-all cursor-pointer shadow-sm"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span>Export</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="p-2.5 text-slate-300 hover:text-white bg-[#0C1322] hover:bg-[#182338] border border-[#2E4164] rounded-xl transition-all cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
