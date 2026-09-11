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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0E1626]">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">
                Repair Vendors & RMA Portals
              </h2>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              Add, edit, or configure external electronics repair facilities and RMA portals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-sm font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add / Edit Vendor Controls */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Registered Vendors ({vendors.length})
            </span>
            {!isAdding && !editingId && (
              <button
                onClick={() => {
                  cancelForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Vendor</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="p-5 rounded-2xl bg-[#0C1322] border border-indigo-500/70 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                  {editingId ? 'Edit Vendor Details' : 'Add New Repair Facility'}
                </h3>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Vendor / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ag Express Electronics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dave Miller"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Phone</label>
                  <input
                    type="text"
                    placeholder="515-289-2746"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="repairs@vendor.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">RMA Portal URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.rma_portal_url}
                    onChange={(e) => setFormData({ ...formData, rma_portal_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Notes / Turnaround / Specialities</label>
                <input
                  type="text"
                  placeholder="Specializes in A5 robot arm boards, spray monitors, GPS..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#1E2C44] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Save Vendor'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Vendors List */}
          <div className="space-y-3.5">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-2xl bg-[#0C1322] border border-[#23334F] hover:border-indigo-500/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-bold text-white">{v.name}</h4>
                    {v.rma_portal_url && (
                      <a
                        href={v.rma_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-700/60"
                      >
                        <span>Open RMA Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 font-medium flex flex-wrap gap-x-5 gap-y-1">
                    {v.contact_name && <span>Contact: <strong className="text-white">{v.contact_name}</strong></span>}
                    {v.contact_phone && <span>📞 {v.contact_phone}</span>}
                    {v.contact_email && <span>✉️ {v.contact_email}</span>}
                  </div>

                  {v.notes && (
                    <p className="text-xs text-slate-400 pt-0.5">{v.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(v)}
                    className="px-3.5 py-2 text-slate-200 hover:text-white bg-[#1A263E] hover:bg-[#243556] border border-[#334668] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Edit vendor details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 rounded-xl transition-colors cursor-pointer"
                    title="Delete vendor"
                  >
                    <Trash2 className="w-4 h-4" />
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
