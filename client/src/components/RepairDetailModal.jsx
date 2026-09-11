import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Camera, 
  Upload, 
  DollarSign, 
  MapPin, 
  Building2, 
  User, 
  Calendar, 
  Truck, 
  QrCode, 
  ArrowRightLeft, 
  PackageCheck, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Target,
  Trash2
} from 'lucide-react';
import { fetchRepairById, uploadRepairPhotos, updateBilling, deleteRepair } from '../utils/api';
import { formatDate, formatCurrency, getStatusBadge, getIntendedRouteLabel, getBillingStatusBadge } from '../utils/formatters';

export function RepairDetailModal({
  isOpen,
  onClose,
  repairId,
  onOpenCheckInModal,
  onOpenDeployModal,
  onOpenBillingModal,
  onOpenPrintModal,
  onRepairUpdated
}) {
  if (!isOpen || !repairId) return null;

  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRepairById(repairId);
      setRepair(data);
    } catch (err) {
      setError(err.message || 'This record is no longer available in the database.');
      if (onRepairUpdated) onRepairUpdated();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [repairId]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket ${repair?.ticket_number}?`)) return;
    try {
      await deleteRepair(repairId);
      if (onRepairUpdated) onRepairUpdated();
      onClose();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('photos', f));
      formData.append('caption', 'Visual identification photo');
      await uploadRepairPhotos(repairId, formData);
      await loadDetails();
      if (onRepairUpdated) onRepairUpdated();
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div className="bg-[#101624] border border-[#1E293B] rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs text-slate-400">Loading full provenance audit log...</p>
        </div>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div className="bg-[#101624] border border-[#1E293B] rounded-2xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Record Not Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {error || 'This order was removed or purged from the database.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (onRepairUpdated) onRepairUpdated();
              onClose();
            }}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close & Refresh Table
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(repair.status);
  const intendedRoute = getIntendedRouteLabel(repair.intended_return_route);
  const billingInfo = getBillingStatusBadge(repair.billing_status);

  const isAtVendor = repair.status === 'SHIPPED_TO_VENDOR' || repair.status === 'AT_VENDOR_REPAIRING';
  const isInFloat = repair.status === 'IN_FLOAT_STOCK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#141E32] border border-[#2A3B5A] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A3B5A] flex items-center justify-between bg-[#0E1626]">
          <div className="flex items-center gap-3.5">
            <span className="text-sm font-mono font-extrabold text-indigo-200 bg-indigo-950/90 px-3 py-1.5 rounded-xl border border-indigo-500/70 shadow-sm">
              {repair.ticket_number}
            </span>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                {repair.part_name}
              </h2>
              <div className="text-sm text-slate-300 font-mono font-medium mt-0.5">
                {repair.part_number && <span className="mr-3">OEM: {repair.part_number}</span>}
                {repair.serial_number && <span>SN: {repair.serial_number}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintModal(repair)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-slate-200 bg-[#1C2A46] hover:bg-[#25385E] border border-[#384E77] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>Print Tag / QR</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-slate-300 hover:text-rose-300 hover:bg-rose-950/60 border border-transparent hover:border-rose-800 rounded-xl transition-colors cursor-pointer"
              title="Delete this repair entry"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          
          {/* Left Column: Details & Audit Trail (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Provenance Chain Summary */}
            <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-3.5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Customer & Location Provenance
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-400 text-xs font-semibold">Original Customer</div>
                  <div className="font-bold text-purple-200 mt-0.5">
                    {repair.original_farmer_name || 'Stock Inventory'}
                    {repair.original_farmer_code && ` [${repair.original_farmer_code}]`}
                  </div>
                  {repair.original_farmer_address && (
                    <div className="text-xs text-slate-400 mt-0.5">{repair.original_farmer_address}</div>
                  )}
                </div>

                <div>
                  <div className="text-slate-400 text-xs font-semibold">Current Location / Destination</div>
                  <div className="font-bold text-teal-200 mt-0.5">
                    {repair.current_location || 'Parts Shop'}
                  </div>
                  {repair.shelf_bin_location && (
                    <div className="text-xs font-bold text-amber-300 mt-0.5">📍 {repair.shelf_bin_location}</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F2D45] flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Pre-Tagged Intended Route:</span>
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  {intendedRoute.label}
                </span>
              </div>
            </div>

            {/* Board Fingerprinting */}
            <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-2.5 text-sm shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Physical Board Fingerprint
              </h3>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>PCB Rev: <strong className="text-white font-bold">{repair.pcb_revision || 'N/A'}</strong></div>
                <div>Quantity: <strong className="text-white font-bold">{repair.quantity || 1}</strong></div>
              </div>
              {repair.physical_markings && (
                <div className="pt-1.5 text-slate-200">
                  <span className="text-slate-400 font-semibold">Distinguishing Marks: </span>
                  <span className="text-amber-300 font-bold">{repair.physical_markings}</span>
                </div>
              )}
              {repair.initial_symptom && (
                <div className="pt-1.5 text-slate-200">
                  <span className="text-slate-400 font-semibold">Initial Issue: </span>
                  <span className="font-medium text-white">{repair.initial_symptom}</span>
                </div>
              )}
            </div>

            {/* Photo Gallery */}
            <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span>Visual Inspection Photos ({repair.photos?.length || 0})</span>
                </h3>
                <label className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 cursor-pointer bg-[#19253C] hover:bg-[#20304E] px-3 py-1.5 rounded-xl border border-[#304364] transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading...' : '+ Add Photo'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {repair.photos && repair.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {repair.photos.map((p) => (
                    <a
                      key={p.id}
                      href={p.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-[#2B3C58] aspect-square block bg-black shadow-sm"
                    >
                      <img
                        src={p.file_path}
                        alt="Board photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                        View Full
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No board photos attached yet.</p>
              )}
            </div>

            {/* Full Provenance Audit Log Timeline */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Chain of Custody & Audit Timeline</span>
              </h3>

              <div className="space-y-3 border-l-2 border-[#2A3B5A] ml-2 pl-4">
                {repair.events?.map((evt) => (
                  <div key={evt.id} className="relative text-sm">
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-indigo-400 ring-4 ring-[#141E32]"></div>
                    <div className="flex items-center justify-between text-slate-300 text-xs">
                      <span className="font-bold text-indigo-200">{evt.event_type}</span>
                      <span className="font-mono text-slate-400">{formatDate(evt.created_at)}</span>
                    </div>
                    <p className="text-slate-100 font-medium mt-1">{evt.description}</p>
                    {evt.performed_by && (
                      <div className="text-xs text-slate-400 mt-0.5">by {evt.performed_by}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Actions & Financial Reconciliation (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Status Card */}
            <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Current Status</span>
                <div className={`px-3 py-1 rounded-lg text-xs font-extrabold border shadow-sm ${statusInfo.bg}`}>
                  {statusInfo.label}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-3 border-t border-[#1F2D45] space-y-2.5">
                {isAtVendor && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCheckInModal(repair);
                    }}
                    className="w-full py-2.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PackageCheck className="w-4.5 h-4.5" />
                    <span>Check In Return from Vendor</span>
                  </button>
                )}

                {isInFloat && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeployModal(repair);
                    }}
                    className="w-full py-2.5 px-4 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4.5 h-4.5" />
                    <span>Route 4: Deploy to Customer</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenBillingModal(repair);
                  }}
                  className="w-full py-2.5 px-4 text-sm font-bold text-purple-200 bg-[#251B42] hover:bg-[#32235B] border border-purple-600/70 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <DollarSign className="w-4.5 h-4.5" />
                  <span>Update Customer Billing / PO</span>
                </button>
              </div>
            </div>

            {/* Vendor & Shipping Card */}
            <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-3 text-sm shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Vendor & Shipping Reference
              </h3>
              <div>
                <div className="text-slate-400 text-xs font-semibold">Vendor</div>
                <div className="font-bold text-white mt-0.5">{repair.vendor_name || 'N/A'}</div>
                {repair.vendor_phone && <div className="text-slate-300 text-xs mt-0.5">{repair.vendor_phone}</div>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1F2D45]">
                <div>
                  <div className="text-slate-400 text-xs font-semibold">Vendor RMA #</div>
                  <div className="font-mono font-bold text-slate-100 mt-0.5">{repair.vendor_rma_number || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-semibold">Vendor Invoice</div>
                  <div className="font-mono font-bold text-slate-100 mt-0.5">{repair.vendor_invoice_number || '—'}</div>
                </div>
              </div>

              {repair.tracking_outbound && (
                <div className="pt-3 border-t border-[#1F2D45]">
                  <div className="text-slate-400 text-xs font-semibold">Outbound Tracking</div>
                  <div className="font-mono font-bold text-indigo-300 break-all mt-0.5">{repair.tracking_outbound}</div>
                </div>
              )}
            </div>

            {/* Financial & Billing Card */}
            <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-3 text-sm shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Financial Reconciliation
                </h3>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${billingInfo.bg}`}>
                  {billingInfo.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <div className="text-slate-400 text-xs font-sans font-semibold">Vendor Cost</div>
                  <div className="text-rose-300 font-extrabold text-base mt-0.5">{formatCurrency(repair.vendor_cost)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-sans font-semibold">Billed to Customer</div>
                  <div className="text-emerald-300 font-extrabold text-base mt-0.5">{formatCurrency(repair.billed_amount)}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F2D45]">
                <div className="text-slate-400 text-xs font-semibold">Customer PO / Work Order #</div>
                <div className="font-mono font-extrabold text-indigo-200 text-base mt-0.5">{repair.customer_po_wo || 'Not Assigned Yet'}</div>
              </div>
            </div>

            {/* Internal Notes */}
            {repair.internal_notes && (
              <div className="p-5 rounded-2xl bg-[#0D1524] border border-[#23334F] space-y-1.5 text-sm shadow-sm">
                <div className="text-slate-400 font-black uppercase tracking-wider text-xs">Internal Notes</div>
                <p className="text-slate-200 font-medium whitespace-pre-line leading-relaxed">{repair.internal_notes}</p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default RepairDetailModal;
