import React, { useState } from 'react';
import { X, DollarSign, Check, AlertCircle } from 'lucide-react';
import { updateBilling } from '../utils/api';
import { formatCurrency } from '../utils/formatters';

export function BillingModal({ isOpen, onClose, repair, onBillingUpdated }) {
  if (!isOpen || !repair) return null;

  const [billingStatus, setBillingStatus] = useState(repair.billing_status || 'READY_TO_BILL');
  const [billedAmount, setBilledAmount] = useState(repair.billed_amount || '');
  const [customerPoWo, setCustomerPoWo] = useState(repair.customer_po_wo || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        billing_status: billingStatus,
        billed_amount: billedAmount ? Number(billedAmount) : 0,
        customer_po_wo: customerPoWo,
        notes: notes.trim() || undefined,
        user: 'Parts / Billing Desk'
      };

      const updated = await updateBilling(repair.id, payload);
      onBillingUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update billing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Customer Billing & PO Reconciliation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Part & Customer summary */}
          <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-300">{repair.ticket_number}</span>
              <span className="text-slate-400">Vendor Cost: <strong className="text-rose-400 font-mono">{formatCurrency(repair.vendor_cost)}</strong></span>
            </div>
            <div className="font-bold text-white text-sm">{repair.part_name}</div>
            <div className="text-slate-400">
              Customer to Bill: <strong className="text-purple-300">{repair.current_farmer_name || repair.original_farmer_name || 'Stock / Internal'}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Billing / Invoice Status:
              </label>
              <select
                value={billingStatus}
                onChange={(e) => setBillingStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="READY_TO_BILL">Ready to Bill (Pending Invoice Creation)</option>
                <option value="BILLED">Billed / Invoiced</option>
                <option value="WARRANTY_INTERNAL">Internal Shop Expense / Warranty</option>
                <option value="CORE_CREDIT">Core Credit Issued</option>
                <option value="PENDING">Pending Repair Return</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount to Invoice ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer PO / Work Order #:
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO 13441 or WO-2026-891"
                  value={customerPoWo}
                  onChange={(e) => setCustomerPoWo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Billing Notes / Internal Reference:
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Invoiced to customer on Work Order #891. Included $45 freight."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end gap-2">
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Update Billing Record'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
