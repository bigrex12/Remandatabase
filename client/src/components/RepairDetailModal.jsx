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
  Target
} from 'lucide-react';
import { fetchRepairById, uploadRepairPhotos, updateBilling } from '../utils/api';
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
      setError(err.message || 'Failed to load repair details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [repairId]);

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

  if (!repair) return null;

  const statusInfo = getStatusBadge(repair.status);
  const intendedRoute = getIntendedRouteLabel(repair.intended_return_route);
  const billingInfo = getBillingStatusBadge(repair.billing_status);

  const isAtVendor = repair.status === 'SHIPPED_TO_VENDOR' || repair.status === 'AT_VENDOR_REPAIRING';
  const isInFloat = repair.status === 'IN_FLOAT_STOCK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-700/60">
              {repair.ticket_number}
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {repair.part_name}
              </h2>
              <div className="text-xs text-slate-400 font-mono">
                {repair.part_number && <span className="mr-2">OEM: {repair.part_number}</span>}
                {repair.serial_number && <span>SN: {repair.serial_number}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintModal(repair)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Tag / QR</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer & Location Provenance
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">Original Customer</div>
                  <div className="font-semibold text-purple-300">
                    {repair.original_farmer_name || 'Stock Inventory'}
                    {repair.original_farmer_code && ` [${repair.original_farmer_code}]`}
                  </div>
                  {repair.original_farmer_address && (
                    <div className="text-[10px] text-slate-500">{repair.original_farmer_address}</div>
                  )}
                </div>

                <div>
                  <div className="text-slate-500 text-[11px]">Current Location / Destination</div>
                  <div className="font-semibold text-teal-300">
                    {repair.current_location || 'Parts Shop'}
                  </div>
                  {repair.shelf_bin_location && (
                    <div className="text-[10px] text-amber-400">📍 {repair.shelf_bin_location}</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pre-Tagged Intended Route:</span>
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  {intendedRoute.label}
                </span>
              </div>
            </div>

            {/* Board Fingerprinting */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-2 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Physical Board Fingerprint
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>PCB Rev: <strong className="text-slate-200">{repair.pcb_revision || 'N/A'}</strong></div>
                <div>Quantity: <strong className="text-slate-200">{repair.quantity || 1}</strong></div>
              </div>
              {repair.physical_markings && (
                <div className="pt-1 text-slate-300">
                  <span className="text-slate-500">Distinguishing Marks: </span>
                  <span className="text-amber-300 font-medium">{repair.physical_markings}</span>
                </div>
              )}
              {repair.initial_symptom && (
                <div className="pt-1 text-slate-300">
                  <span className="text-slate-500">Initial Issue: </span>
                  <span>{repair.initial_symptom}</span>
                </div>
              )}
            </div>

            {/* Photo Gallery */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>Visual Inspection Photos ({repair.photos?.length || 0})</span>
                </h3>
                <label className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3 h-3" />
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
                <div className="grid grid-cols-3 gap-2">
                  {repair.photos.map((p) => (
                    <a
                      key={p.id}
                      href={p.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-lg overflow-hidden border border-slate-800 aspect-square block bg-black"
                    >
                      <img
                        src={p.file_path}
                        alt="Board photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white">
                        View Full
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No board photos attached yet.</p>
              )}
            </div>

            {/* Full Provenance Audit Log Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Chain of Custody & Audit Timeline</span>
              </h3>

              <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                {repair.events?.map((evt) => (
                  <div key={evt.id} className="relative text-xs">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#101624]"></div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-semibold text-slate-300">{evt.event_type}</span>
                      <span className="font-mono">{formatDate(evt.created_at)}</span>
                    </div>
                    <p className="text-slate-200 mt-0.5">{evt.description}</p>
                    {evt.performed_by && (
                      <div className="text-[10px] text-slate-500 mt-0.5">by {evt.performed_by}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Actions & Financial Reconciliation (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Status Card */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Current Status</span>
                <div className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusInfo.bg}`}>
                  {statusInfo.label}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                {isAtVendor && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCheckInModal(repair);
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Check In Return from Vendor</span>
                  </button>
                )}

                {isInFloat && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeployModal(repair);
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Route 4: Deploy to Customer</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenBillingModal(repair);
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Update Customer Billing / PO</span>
                </button>
              </div>
            </div>

            {/* Vendor & Shipping Card */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-2.5 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Vendor & Shipping Reference
              </h3>
              <div>
                <div className="text-slate-500 text-[11px]">Vendor</div>
                <div className="font-semibold text-white">{repair.vendor_name || 'N/A'}</div>
                {repair.vendor_phone && <div className="text-slate-400">{repair.vendor_phone}</div>}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <div className="text-slate-500 text-[11px]">Vendor RMA #</div>
                  <div className="font-mono font-bold text-slate-200">{repair.vendor_rma_number || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Vendor Invoice</div>
                  <div className="font-mono text-slate-200">{repair.vendor_invoice_number || '—'}</div>
                </div>
              </div>

              {repair.tracking_outbound && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-slate-500 text-[11px]">Outbound Tracking</div>
                  <div className="font-mono text-indigo-400 break-all">{repair.tracking_outbound}</div>
                </div>
              )}
            </div>

            {/* Financial & Billing Card */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Financial Reconciliation
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${billingInfo.bg}`}>
                  {billingInfo.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <div className="text-slate-500 text-[11px]">Vendor Cost</div>
                  <div className="text-rose-400 font-bold">{formatCurrency(repair.vendor_cost)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Billed to Customer</div>
                  <div className="text-emerald-400 font-bold">{formatCurrency(repair.billed_amount)}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-slate-500 text-[11px]">Customer PO / Work Order #</div>
                <div className="font-mono font-bold text-indigo-300 text-sm">{repair.customer_po_wo || 'Not Assigned Yet'}</div>
              </div>
            </div>

            {/* Internal Notes */}
            {repair.internal_notes && (
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#1E293B] space-y-1 text-xs">
                <div className="text-slate-500 font-semibold uppercase text-[10px]">Internal Notes</div>
                <p className="text-slate-300 whitespace-pre-line">{repair.internal_notes}</p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
