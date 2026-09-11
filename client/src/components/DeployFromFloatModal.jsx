import React, { useState } from 'react';
import { X, ArrowRightLeft, Package, User, Calendar, DollarSign, Check, AlertCircle } from 'lucide-react';
import { deployFromFloat } from '../utils/api';

export function DeployFromFloatModal({
  isOpen,
  onClose,
  repair,
  farmers = [],
  technicians = ['Jonathan', 'Matt A', 'Keaton', 'Dave M'],
  onDeployCompleted
}) {
  if (!isOpen || !repair) return null;

  const [destinationFarmerId, setDestinationFarmerId] = useState('');
  const [technicianName, setTechnicianName] = useState(technicians[0] || 'Jonathan');
  const [dateReinstalled, setDateReinstalled] = useState(new Date().toISOString().split('T')[0]);
  const [customerPoWo, setCustomerPoWo] = useState(repair.customer_po_wo || '');
  const [billedAmount, setBilledAmount] = useState(repair.billed_amount || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!destinationFarmerId) {
      setError('Please select the destination customer / farmer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        destination_farmer_id: Number(destinationFarmerId),
        technician_name: technicianName,
        date_reinstalled: dateReinstalled,
        customer_po_wo: customerPoWo,
        billed_amount: billedAmount ? Number(billedAmount) : 0,
        notes: notes.trim() || undefined
      };

      const updated = await deployFromFloat(repair.id, payload);
      onDeployCompleted(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to deploy part to farmer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Route 4: Deploy Board from Floating Stock
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pull unit from shelf stock and install onto a customer machine
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Shelf Stock Info */}
          <div className="p-4 rounded-xl bg-[#0B0F17] border border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                {repair.ticket_number}
              </span>
              <span className="text-xs font-semibold text-amber-300">
                📍 {repair.shelf_bin_location || 'Shop Shelf (Floating Stock)'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mt-1">{repair.part_name}</h3>
            <div className="text-xs text-slate-400 font-mono">
              {repair.part_number && <span className="mr-2">OEM: {repair.part_number}</span>}
              {repair.serial_number && <span>SN: {repair.serial_number}</span>}
            </div>

            {/* Provenance note */}
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Provenance: Originally from <strong className="text-slate-300">{repair.original_farmer_name || 'Stock'}</strong> • Repaired by <strong className="text-slate-300">{repair.vendor_name || 'Vendor'}</strong>
            </div>
          </div>

          {/* Deployment Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destination Customer / Farm <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={destinationFarmerId}
                onChange={(e) => setDestinationFarmerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select Destination Customer...</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} {f.farm_id ? `[${f.farm_id}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Installing Technician
                </label>
                <select
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {technicians.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date Installed / Deployed
                </label>
                <input
                  type="date"
                  value={dateReinstalled}
                  onChange={(e) => setDateReinstalled(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Work Order / PO #
                </label>
                <input
                  type="text"
                  placeholder="e.g. WO-2026-891"
                  value={customerPoWo}
                  onChange={(e) => setCustomerPoWo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount to Invoice / Bill ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billedAmount}
                  onChange={(e) => setBilledAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Installation Notes / Work Done
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Installed onto Robot #2 arm axis 2. Verified operational and cleared error codes."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-xl text-white focus:outline-none focus:border-amber-500"
              ></textarea>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Deploying...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Deploy to Customer</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
