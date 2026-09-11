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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0F1829]">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Customer Billing & PO Reconciliation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Part & Customer summary */}
          <div className="p-4 rounded-xl bg-[#0C1322] border border-[#2A3B5A] space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                {repair.ticket_number}
              </span>
              <span className="text-slate-300 font-medium">
                Vendor Cost: <strong className="text-rose-400 font-mono text-sm">{formatCurrency(repair.vendor_cost)}</strong>
              </span>
            </div>
            <div className="font-bold text-white text-base">{repair.part_name}</div>
            <div className="text-slate-300 text-xs font-medium">
              Customer to Bill: <strong className="text-purple-300 font-semibold">{repair.current_farmer_name || repair.original_farmer_name || 'Stock / Internal'}</strong>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Billing / Invoice Status:
              </label>
              <select
                value={billingStatus}
                onChange={(e) => setBillingStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              >
                <option value="READY_TO_BILL">Ready to Bill (Pending Invoice Creation)</option>
                <option value="BILLED">Billed / Invoiced</option>
                <option value="WARRANTY_INTERNAL">Internal Shop Expense / Warranty</option>
                <option value="CORE_CREDIT">Core Credit Issued</option>
                <option value="PENDING">Pending Repair Return</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Amount to Invoice ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Customer PO / Work Order #:
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO 13441 or WO-2026-891"
                  value={customerPoWo}
                  onChange={(e) => setCustomerPoWo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Billing Notes / Internal Reference:
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Invoiced to customer on Work Order #891. Included $45 freight."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2A3B5A] rounded-xl text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              ></textarea>
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#2A3B5A] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-[#1E2C44] hover:bg-[#253755] border border-[#2E4164] rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
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
