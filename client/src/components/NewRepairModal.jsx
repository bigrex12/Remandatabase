import React, { useState } from 'react';
import { X, Upload, Plus, RefreshCw, Target, AlertCircle, Camera, Check } from 'lucide-react';
import { createRepair, uploadRepairPhotos } from '../utils/api';

export function NewRepairModal({
  isOpen,
  onClose,
  farmers = [],
  vendors = [],
  technicians = [],
  onRepairCreated,
  onRefreshFarmers
}) {
  if (!isOpen) return null;

  const defaultTech = typeof technicians[0] === 'object' ? technicians[0]?.name : (technicians[0] || 'Jonathan');

  const [formData, setFormData] = useState({
    part_name: '',
    part_number: '',
    serial_number: '',
    pcb_revision: '',
    physical_markings: '',
    quantity: 1,
    original_farmer_id: '',
    intended_return_route: 'FLOAT_STOCK',
    designated_farmer_id: '',
    vendor_id: vendors[0]?.id || '',
    technician_name: defaultTech,
    date_removed: new Date().toISOString().split('T')[0],
    date_shipped: new Date().toISOString().split('T')[0],
    vendor_rma_number: '',
    tracking_outbound: '',
    customer_po_wo: '',
    initial_symptom: '',
    internal_notes: '',
  });

  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSyncingFarmers, setIsSyncingFarmers] = useState(false);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedPhotos(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreview(previews);
  };

  const handleSyncFarmers = async () => {
    setIsSyncingFarmers(true);
    try {
      if (onRefreshFarmers) await onRefreshFarmers();
    } finally {
      setIsSyncingFarmers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.part_name.trim()) {
      setError('Part Name is required.');
      return;
    }
    if (!formData.technician_name.trim()) {
      setError('Technician name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        original_farmer_id: formData.original_farmer_id ? Number(formData.original_farmer_id) : null,
        designated_farmer_id: formData.designated_farmer_id ? Number(formData.designated_farmer_id) : null,
        vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
        quantity: Number(formData.quantity) || 1,
      };

      const created = await createRepair(payload);

      if (selectedPhotos.length > 0 && created.id) {
        const uploadForm = new FormData();
        selectedPhotos.forEach((file) => uploadForm.append('photos', file));
        uploadForm.append('caption', 'Initial board condition before shipping');
        uploadForm.append('uploaded_by', formData.technician_name);
        await uploadRepairPhotos(created.id, uploadForm);
      }

      onRepairCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save repair entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0E1626]">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Log New Part / Outbound Repair</span>
            </h2>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              Record part details, customer provenance, and pre-tag intended return destination
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-sm font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Part Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              1. Part Details & Identifier
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Part Details / Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parasalic pump tube, M12 cable, A5 Robot Arm Board..."
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  OEM Part Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9.1185.0108.0 or 6.2001.1020.0"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-mono font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Serial / Barcode / Core ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN-88419-X"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-mono font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  PCB Silk Screen / Rev #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rev 4.2C"
                  value={formData.pcb_revision}
                  onChange={(e) => setFormData({ ...formData, pcb_revision: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-mono font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-extrabold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                Distinguishing Physical Marks / Sharpie Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Sharpie initials on connector shell, blue dot on capacitor..."
                value={formData.physical_markings}
                onChange={(e) => setFormData({ ...formData, physical_markings: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Section 2: Destination / Customer */}
          <div className="space-y-4 pt-5 border-t border-[#2A3B5A]">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span>2. Destination / Customer & Intended Route</span>
              <button
                type="button"
                onClick={handleSyncFarmers}
                disabled={isSyncingFarmers}
                className="text-xs font-bold text-indigo-300 hover:text-indigo-100 flex items-center gap-1.5 cursor-pointer bg-[#1A263E] px-3 py-1 rounded-lg border border-[#334668]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFarmers ? 'animate-spin' : ''}`} />
                <span>Sync WAKA Farms</span>
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Original Customer / Farmer (Removed From)
                </label>
                <select
                  value={formData.original_farmer_id}
                  onChange={(e) => setFormData({ ...formData, original_farmer_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium"
                >
                  <option value="">Stock Inventory (No Farmer Assigned)</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} {f.farm_id ? `[${f.farm_id}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Ordered By / Technician <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.technician_name}
                  onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium"
                >
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
            </div>

            {/* Intended Destination Selection */}
            <div className="p-4 rounded-2xl bg-[#0D1524] border border-[#283854] space-y-3">
              <label className="block text-xs font-extrabold text-indigo-300 flex items-center gap-2 uppercase tracking-wider">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Pre-Tag Intended Destination upon Return:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, intended_return_route: 'FLOAT_STOCK' })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    formData.intended_return_route === 'FLOAT_STOCK'
                      ? 'bg-amber-950/80 border-amber-500 text-white font-bold ring-2 ring-amber-500/40'
                      : 'bg-[#141E32] border-[#2A3B5A] text-slate-300 hover:text-white hover:bg-[#1A2844]'
                  }`}
                >
                  <div className="font-bold text-sm text-amber-300">Stock Inventory / Float</div>
                  <div className="text-xs text-slate-300 mt-1">Hold in shop shelf for next customer</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, intended_return_route: 'ORIGINAL_FARMER' })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    formData.intended_return_route === 'ORIGINAL_FARMER'
                      ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/40'
                      : 'bg-[#141E32] border-[#2A3B5A] text-slate-300 hover:text-white hover:bg-[#1A2844]'
                  }`}
                >
                  <div className="font-bold text-sm text-indigo-300">Return to Original Farmer</div>
                  <div className="text-xs text-slate-300 mt-1">Customer is waiting on this exact unit</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, intended_return_route: 'DESIGNATED_FARMER' })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    formData.intended_return_route === 'DESIGNATED_FARMER'
                      ? 'bg-purple-950/80 border-purple-500 text-white font-bold ring-2 ring-purple-500/40'
                      : 'bg-[#141E32] border-[#2A3B5A] text-slate-300 hover:text-white hover:bg-[#1A2844]'
                  }`}
                >
                  <div className="font-bold text-sm text-purple-300">Designate for Another Farm</div>
                  <div className="text-xs text-slate-300 mt-1">Pre-allocate for upcoming job</div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Vendor & PO */}
          <div className="space-y-4 pt-5 border-t border-[#2A3B5A]">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              3. Vendor & Tracking Reference
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Vendor
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Vendor RMA / PO #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO 13441"
                  value={formData.customer_po_wo}
                  onChange={(e) => setFormData({ ...formData, customer_po_wo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-mono font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2">
                  Outbound Tracking #
                </label>
                <input
                  type="text"
                  placeholder="1Z..."
                  value={formData.tracking_outbound}
                  onChange={(e) => setFormData({ ...formData, tracking_outbound: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0C1322] border border-[#2E4164] rounded-xl text-white font-mono font-medium focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Photos Upload */}
            <div>
              <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Attach Board Photo (Optional)</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-[#0C1322] p-2 rounded-xl border border-[#2E4164]"
              />

              {photoPreview.length > 0 && (
                <div className="flex gap-3 mt-3 overflow-x-auto py-2">
                  {photoPreview.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-[#384C72] shadow-md"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
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
              className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/35 border border-indigo-400/40 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Create Order</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
