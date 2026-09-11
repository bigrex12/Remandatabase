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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Check In Returned Part from Vendor
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirm receiving from {repair.vendor_name || 'Vendor'} and execute routing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Part Summary Card */}
          <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  {repair.ticket_number}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{repair.part_name}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {repair.part_number && <span className="mr-2">OEM: {repair.part_number}</span>}
                  {repair.serial_number && <span>SN: {repair.serial_number}</span>}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-400">Vendor RMA</div>
                <div className="font-mono font-bold text-slate-200">{repair.vendor_rma_number || 'N/A'}</div>
              </div>
            </div>

            {/* Pre-tagged destination alert */}
            <div className="pt-2 border-t border-[#1E293B] flex items-center gap-2 text-xs">
              <Target className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                Pre-Tagged Intended Route: <strong className="text-emerald-300">{intendedRouteInfo.label}</strong>
              </span>
            </div>
          </div>

          {/* Routing Decision */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300">
              Select Post-Return Routing Destination:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Original Farmer */}
              <button
                type="button"
                onClick={() => setRoutingChoice('ORIGINAL_FARMER')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  routingChoice === 'ORIGINAL_FARMER'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-[#0B0F17] border-[#1E293B] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-indigo-300">1. Original Customer</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Deliver / reinstall to {repair.original_farmer_name || 'Original Farmer'}
                </div>
              </button>

              {/* Option 2: Floating Stock */}
              <button
                type="button"
                onClick={() => setRoutingChoice('FLOAT_STOCK')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  routingChoice === 'FLOAT_STOCK'
                    ? 'bg-amber-950/70 border-amber-500 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                    : 'bg-[#0B0F17] border-[#1E293B] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-amber-300">2. Floating / Reman Stock</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Hold on shop shelf as non-inventoried loaner/swap unit
                </div>
              </button>

              {/* Option 3: Reassign to Different Farmer */}
              <button
                type="button"
                onClick={() => setRoutingChoice('REASSIGN_FARMER')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  routingChoice === 'REASSIGN_FARMER'
                    ? 'bg-purple-950/70 border-purple-500 text-white shadow-md shadow-purple-500/10 ring-1 ring-purple-500'
                    : 'bg-[#0B0F17] border-[#1E293B] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-purple-300">3. Reassign to New Farm</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Install onto a different customer machine immediately
                </div>
              </button>
            </div>

            {/* Conditional fields based on route */}
            {routingChoice === 'FLOAT_STOCK' && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Shop Shelf / Bin Location:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shelf B2 - Bin 4 (Reman Pool)"
                  value={shelfBinLocation}
                  onChange={(e) => setShelfBinLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {routingChoice === 'REASSIGN_FARMER' && (
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40">
                <label className="block text-xs font-semibold text-purple-300 mb-1">
                  Select New Destination Customer / Farmer:
                </label>
                <select
                  value={reassignFarmerId}
                  onChange={(e) => setReassignFarmerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-purple-500"
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
          <div className="space-y-4 pt-4 border-t border-[#1E293B]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Vendor Cost & Customer Billing
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendor Repair Charge ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={vendorCost}
                  onChange={(e) => setVendorCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendor Invoice / PO #
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-AGX-9011"
                  value={vendorInvoiceNumber}
                  onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount to Bill Customer ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer PO / Work Order #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO 13441 or WO-2026-891"
                  value={customerPoWo}
                  onChange={(e) => setCustomerPoWo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Outcome Notes & Checked in by */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#1E293B]">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vendor Repair Outcome / Work Completed Notes
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Replaced capacitor C12, firmware re-flashed, calibrated on bench."
                value={vendorRepairNotes}
                onChange={(e) => setVendorRepairNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Checked In By (Staff)
              </label>
              <input
                type="text"
                value={checkedInBy}
                onChange={(e) => setCheckedInBy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Checking In...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
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
