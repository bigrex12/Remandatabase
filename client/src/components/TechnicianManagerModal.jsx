import React, { useState } from 'react';
import { X, Users, Plus, Trash2, Edit2, Check, AlertCircle, Phone, Mail, Save } from 'lucide-react';
import { createTechnician, updateTechnician, deleteTechnician } from '../utils/api';

export function TechnicianManagerModal({ isOpen, onClose, technicians = [], onTechniciansUpdated }) {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState(null);

  const startEdit = (tech) => {
    setIsAdding(false);
    setEditingId(tech.id);
    setFormData({
      name: tech.name || '',
      email: tech.email || '',
      phone: tech.phone || '',
    });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '' });
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setError(null);
    try {
      if (editingId) {
        await updateTechnician(editingId, formData);
      } else {
        await createTechnician(formData);
      }
      cancelForm();
      if (onTechniciansUpdated) onTechniciansUpdated();
    } catch (err) {
      setError(err.message || 'Failed to save technician');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the technician list?`)) return;
    try {
      await deleteTechnician(id);
      if (onTechniciansUpdated) onTechniciansUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Shop Technicians & Staff
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Add, edit, or remove staff members appearing in the "WHO" / Technician dropdowns
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

          {/* Add / Edit Controls */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Technicians ({technicians.length})
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
                <span>+ Add Technician</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="p-4 rounded-xl bg-[#0B0F17] border border-indigo-500/50 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-300 uppercase">
                  {editingId ? 'Edit Technician' : 'Add New Technician'}
                </h3>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Technician Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Matt A, Jonathan..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="tech@kaebs.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="574-555-0100"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#101624] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  <span>{editingId ? 'Save Changes' : 'Add Tech'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Technicians List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-[#0B0F17] border border-[#1E293B] hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {t.phone && <span>📞 {t.phone} </span>}
                    {t.email && <span>✉️ {t.email}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Edit technician"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remove technician"
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
