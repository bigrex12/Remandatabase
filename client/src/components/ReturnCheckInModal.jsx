import React, { useState, useEffect } from 'react';
import { X, PackageCheck, Target, ArrowRight, DollarSign, Building2, User, Check, AlertCircle } from 'lucide-react';
import { returnCheckInRepair } from '../utils/api';
import { getIntendedRouteLabel } from '../utils/formatters';

export function ReturnCheckInModal({
  isOpen,
  onClose,
  repair,
  farmers = [],
  onCheckInCompleted
}) {
  if (!isOpen || !repair) return null;

  const intendedRouteInfo = getIntendedRouteLabel(repair.intended_return_route);

  const [routingChoice, setRoutingChoice] = useState('ORIGINAL_FARMER');
  const [shelfBinLocation, setShelfBinLocation] = useState(repair.shelf_bin_location || 'Shelf B2 - Bin 1');
  const [reassignFarmerId, setReassignFarmerId] = useState('');
  const [dateReturned, setDateReturned] = useState(new Date().toISOString().split('T')[0]);
  const [vendorCost, setVendorCost] = useState(repair.vendor_cost || '');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState(repair.vendor_invoice_number || '');
  const [billedAmount, setBilledAmount] = useState(repair.billed_amount || '');
  const [customerPoWo, setCustomerPoWo] = useState(repair.customer_po_wo || '');
  const [vendorRepairNotes, setVendorRepairNotes] = useState('');
  const [checkedInBy, setCheckedInBy] = useState('Jonathan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto-initialize to pre-tagged intended route!
  useEffect(() => {
    if (repair.intended_return_route === 'FLOAT_STOCK') {
      setRoutingChoice('FLOAT_STOCK');
    } else if (repair.intended_return_route === 'DESIGNATED_FARMER') {
      setRoutingChoice('REASSIGN_FARMER');
      if (repair.designated_farmer_id) {
        setReassignFarmerId(repair.designated_farmer_id);
      }
    } else {
      setRoutingChoice('ORIGINAL_FARMER');
    }
  }, [repair]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        routing_choice: routingChoice,
        shelf_bin_location: routingChoice === 'FLOAT_STOCK' ? shelfBinLocation : null,
        reassign_farmer_id: routingChoice === 'REASSIGN_FARMER' ? Number(reassignFarmerId) : null,
        date_returned: dateReturned,
        vendor_cost: vendorCost ? Number(vendorCost) : 0,
        vendor_invoice_number: vendorInvoiceNumber,
        billed_amount: billedAmount ? Number(billedAmount) : 0,
        customer_po_wo: customerPoWo,
        vendor_repair_notes: vendorRepairNotes,
        checked_in_by: checkedInBy
      };

      const updated = await returnCheckInRepair(repair.id, payload);
      onCheckInCompleted(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to check in returned repair');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0E1626]">
          <div>
            <div className="flex items-center gap-2.5">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-black text-white">
                Check In Returned Part from Vendor
              </h2>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              Confirm receiving from {repair.vendor_name || 'Vendor'} and execute routing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-sm font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Part Summary Card */}
          <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-700/60">
                  {repair.ticket_number}
                </span>
                <h3 className="text-base font-extrabold text-white mt-2">{repair.part_name}</h3>
                <div className="text-xs text-slate-300 font-mono font-medium mt-0.5">
                  {repair.part_number && <span className="mr-3">OEM: {repair.part_number}</span>}
                  {repair.serial_number && <span>SN: {repair.serial_number}</span>}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-400 font-semibold">Vendor RMA</div>
                <div className="font-mono font-bold text-white text-sm mt-0.5">{repair.vendor_rma_number || 'N/A'}</div>
              </div>
            </div>

            {/* Pre-tagged destination alert */}
            <div className="pt-2.5 border-t border-[#1F2D45] flex items-center gap-2 text-xs">
              <Target className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                Pre-Tagged Intended Route: <strong className="text-emerald-300 font-bold">{intendedRouteInfo.label}</strong>
              </span>
            </div>
          </div>

          {/* Routing Decision */}
          <div className="space-y-3.5">
            <label className="block text-xs font-black uppercase tracking-wider text-indigo-300">
              Select Post-Return Routing Destination:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Original Farmer */}
              <button
                type="button"
                onClick={() => setRoutingChoice('ORIGINAL_FARMER')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                  routingChoice === 'ORIGINAL_FARMER'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg ring-2 ring-indigo-500/50'
                    : 'bg-[#0D1524] border-[#23334F] text-slate-300 hover:text-white hover:bg-[#141F35]'
                }`}
              >
                <div className="font-bold text-sm text-indigo-300">1. Original Customer</div>
                <div className="text-xs text-slate-300 mt-1">
                  Deliver / reinstall to {repair.original_farmer_name || 'Original Farmer'}
                </div>
              </button>

              {/* Option 2: Floating Stock */}
              <button
                type="button"
                onClick={() => setRoutingChoice('FLOAT_STOCK')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                  routingChoice === 'FLOAT_STOCK'
                    ? 'bg-amber-950/80 border-amber-500 text-white shadow-lg ring-2 ring-amber-500/50'
                    : 'bg-[#0D1524] border-[#23334F] text-slate-300 hover:text-white hover:bg-[#141F35]'
                }`}
              >
                <div className="font-bold text-sm text-amber-300">2. Floating / Reman Stock</div>
                <div className="text-xs text-slate-300 mt-1">
                  Hold on shop shelf as non-inventoried loaner/swap unit
                </div>
              </button>

              {/* Option 3: Reassign to Different Farmer */}
              <button
                type="button"
                onClick={() => setRoutingChoice('REASSIGN_FARMER')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                  routingChoice === 'REASSIGN_FARMER'
                    ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg ring-2 ring-purple-500/50'
                    : 'bg-[#0D1524] border-[#23334F] text-slate-300 hover:text-white hover:bg-[#141F35]'
                }`}
              >
                <div className="font-bold text-sm text-purple-300">3. Reassign to New Farm</div>
                <div className="text-xs text-slate-300 mt-1">
                  Install onto a different customer machine immediately
                </div>
              </button>
            </div>

            {/* Conditional fields based on route */}
            {routingChoice === 'FLOAT_STOCK' && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/60 space-y-1.5">
                <label className="block text-xs font-extrabold text-amber-200 uppercase tracking-wider mb-1.5">
                  Shop Shelf / Bin Location:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shelf B2 - Bin 4 (Reman Pool)"
                  value={shelfBinLocation}
                  onChange={(e) => setShelfBinLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {routingChoice === 'REASSIGN_FARMER' && (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-600/60 space-y-1.5">
                <label className="block text-xs font-extrabold text-purple-200 uppercase tracking-wider mb-1.5">
                  Select New Destination Customer / Farmer:
                </label>
                <select
                  value={reassignFarmerId}
                  onChange={(e) => setReassignFarmerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-purple-400"
                >
                  <option value="">Select Destination Customer...</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} {f.farm_id ? `[${f.farm_id}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Financial & Billing Reconciliation */}
          <div className="space-y-4 pt-5 border-t border-[#2A3B5A]">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Vendor Cost & Customer Billing
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Vendor Repair Charge ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={vendorCost}
                  onChange={(e) => setVendorCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Vendor Invoice / PO #
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-AGX-9011"
                  value={vendorInvoiceNumber}
                  onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Amount to Bill Customer ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 font-mono font-bold text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                  Customer PO / Work Order #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO 13441 or WO-2026-891"
                  value={customerPoWo}
                  onChange={(e) => setCustomerPoWo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Outcome Notes & Checked in by */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-[#2A3B5A]">
            <div>
              <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                Vendor Repair Outcome / Notes
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Replaced capacitor C12, firmware re-flashed, calibrated on bench."
                value={vendorRepairNotes}
                onChange={(e) => setVendorRepairNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                Checked In By (Staff)
              </label>
              <input
                type="text"
                value={checkedInBy}
                onChange={(e) => setCheckedInBy(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-5 border-t border-[#2A3B5A] flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white bg-[#1A263E] hover:bg-[#223354] border border-[#304364] rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/35 border border-emerald-400/40 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Checking In...</span>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Complete Check-In & Route</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
