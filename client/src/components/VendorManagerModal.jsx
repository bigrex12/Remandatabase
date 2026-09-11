import React, { useState } from 'react';
import { X, Building2, Plus, ExternalLink, Trash2, Edit2, Check, AlertCircle, Phone, Mail, Save } from 'lucide-react';
import { createVendor, updateVendor, deleteVendor } from '../utils/api';

export function VendorManagerModal({ isOpen, onClose, vendors = [], onVendorsUpdated }) {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    rma_portal_url: '',
    notes: '',
  });
  const [error, setError] = useState(null);

  const startEdit = (vendor) => {
    setIsAdding(false);
    setEditingId(vendor.id);
    setFormData({
      name: vendor.name || '',
      contact_name: vendor.contact_name || '',
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      rma_portal_url: vendor.rma_portal_url || '',
      notes: vendor.notes || '',
    });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', contact_name: '', contact_email: '', contact_phone: '', rma_portal_url: '', notes: '' });
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setError(null);
    try {
      if (editingId) {
        await updateVendor(editingId, formData);
      } else {
        await createVendor(formData);
      }
      cancelForm();
      if (onVendorsUpdated) onVendorsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to save vendor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await deleteVendor(id);
      if (onVendorsUpdated) onVendorsUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Repair Vendors & RMA Portals
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Add, edit, or configure external electronics repair facilities and RMA portals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add / Edit Vendor Controls */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Vendors ({vendors.length})
            </span>
            {!isAdding && !editingId && (
              <button
                onClick={() => {
                  cancelForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Vendor</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="p-4 rounded-xl bg-[#0B0F17] border border-indigo-500/50 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-300 uppercase">
                  {editingId ? 'Edit Vendor Details' : 'Add New Repair Facility'}
                </h3>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vendor / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ag Express Electronics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dave Miller"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="515-289-2746"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="repairs@vendor.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">RMA Portal URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.rma_portal_url}
                    onChange={(e) => setFormData({ ...formData, rma_portal_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Turnaround / Specialities</label>
                <input
                  type="text"
                  placeholder="Specializes in A5 robot arm boards, spray monitors, GPS..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Save Changes' : 'Save Vendor'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Vendors List */}
          <div className="space-y-3">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{v.name}</h4>
                    {v.rma_portal_url && (
                      <a
                        href={v.rma_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40"
                      >
                        <span>Open RMA Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                    {v.contact_name && <span>Contact: <strong>{v.contact_name}</strong></span>}
                    {v.contact_phone && <span>📞 {v.contact_phone}</span>}
                    {v.contact_email && <span>✉️ {v.contact_email}</span>}
                  </div>

                  {v.notes && (
                    <p className="text-xs text-slate-500 pt-0.5">{v.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(v)}
                    className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800/60 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs"
                    title="Edit vendor details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 rounded-lg transition-colors cursor-pointer"
                    title="Delete vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
