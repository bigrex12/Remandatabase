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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0E1626]">
          <div>
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">
                Shop Technicians & Staff
              </h2>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              Add, edit, or remove staff members appearing in the "WHO" / Technician dropdowns
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

          {/* Add / Edit Controls */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Active Technicians ({technicians.length})
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
                <span>+ Add Technician</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="p-5 rounded-2xl bg-[#0C1322] border border-indigo-500/70 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                  {editingId ? 'Edit Technician' : 'Add New Technician'}
                </h3>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Technician Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Justin, Matt A..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="tech@kaebs.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="574-555-0100"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#141E32] border border-[#2E4164] rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
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
                  <span>{editingId ? 'Save Changes' : 'Add Tech'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Technicians List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-[#0C1322] border border-[#23334F] hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <h4 className="text-sm font-extrabold text-white">{t.name}</h4>
                  <div className="text-xs text-slate-300 font-medium mt-1 space-y-0.5">
                    {t.phone && <div>📞 {t.phone}</div>}
                    {t.email && <div>✉️ {t.email}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-2 text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/60 rounded-xl transition-colors cursor-pointer"
                    title="Edit technician"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                    title="Remove technician"
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
