import React, { useState, useEffect } from 'react';
import { X, Sparkles, Search, Building2, Calendar, User, Camera, PackageCheck, AlertCircle, ArrowRight, Target } from 'lucide-react';
import { mysteryLookup } from '../utils/api';
import { formatDate, getIntendedRouteLabel } from '../utils/formatters';

export function MysteryPartLookupModal({
  isOpen,
  onClose,
  vendors = [],
  onSelectForCheckIn
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [onlyAtVendor, setOnlyAtVendor] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performLookup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mysteryLookup({
        query: query.trim(),
        vendor_id: vendorId,
        status: onlyAtVendor ? 'SHIPPED_TO_VENDOR' : ''
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performLookup();
  }, [query, vendorId, onlyAtVendor]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0F1829]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                Mystery Part Reverse Lookup Assistant
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Identify bare boards returning without original box or customer tags
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Helpful clue guidance */}
          <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/50 text-xs text-slate-200">
            <span className="font-bold text-indigo-300">🔍 How to identify a bare board:</span> Type any single clue found on the board or vendor packing slip: 
            <strong className="text-white"> Vendor RMA #, Serial #, PCB Rev (e.g. Rev 4.2), Part Name, or distinguishing physical markings (Sharpie initials, tape, etc.)</strong>.
          </div>

          {/* Search Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Search Clues / Identifiers:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type RMA #, serial #, PCB Rev, markings, or part name..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Vendor Sending It Back:
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              >
                <option value="">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2 pb-2.5">
              <input
                type="checkbox"
                id="onlyAtVendorCheck"
                checked={onlyAtVendor}
                onChange={(e) => setOnlyAtVendor(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="onlyAtVendorCheck" className="text-xs font-semibold text-slate-200 cursor-pointer select-none">
                Only open / at vendor items
              </label>
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
              <span>Candidate Matches ({results.length})</span>
              {loading && <span className="text-amber-400 animate-pulse">Searching records...</span>}
            </div>

            {results.length === 0 && !loading && (
              <div className="p-8 text-center bg-[#0C1322] rounded-xl border border-[#2A3B5A]">
                <p className="text-sm font-bold text-slate-200">No matching repairs found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try unchecking "Only open / at vendor items" or searching for a shorter serial or part keyword.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {results.map((item) => {
                const intended = getIntendedRouteLabel(item.intended_return_route);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0C1322] border border-[#2A3B5A] hover:border-amber-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-500/50">
                          {item.ticket_number}
                        </span>
                        <h4 className="text-base font-bold text-white">{item.part_name}</h4>
                        {item.pcb_revision && (
                          <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {item.pcb_revision}
                          </span>
                        )}
                      </div>

                      {/* Identifiers & Markings */}
                      <div className="text-xs text-slate-300 font-mono flex flex-wrap gap-x-4 gap-y-1">
                        {item.part_number && <span>OEM: <strong className="text-white">{item.part_number}</strong></span>}
                        {item.serial_number && <span>SN: <strong className="text-white">{item.serial_number}</strong></span>}
                        {item.vendor_rma_number && <span>RMA: <strong className="text-amber-300">{item.vendor_rma_number}</strong></span>}
                      </div>

                      {item.physical_markings && (
                        <div className="text-xs text-amber-300 font-medium">
                          🏷️ Physical Marks: <span className="text-white font-semibold">{item.physical_markings}</span>
                        </div>
                      )}

                      {/* Origin & Routing */}
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                        <span>Original Customer: <strong className="text-purple-300">{item.original_farmer_name || 'Stock'}</strong></span>
                        <span>Vendor: <strong className="text-white">{item.vendor_name || 'N/A'}</strong></span>
                        <span>Sent: <strong className="text-white">{formatDate(item.date_shipped)}</strong> (by {item.technician_name})</span>
                        <span className="text-emerald-400 font-semibold">🎯 Intended: {intended.label}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectForCheckIn(item);
                        }}
                        className="w-full md:w-auto px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Check In This Unit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
