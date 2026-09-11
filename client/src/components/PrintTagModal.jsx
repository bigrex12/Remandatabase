import React, { useEffect, useRef } from 'react';
import { X, Printer, Target, CheckCircle2, Building2 } from 'lucide-react';
import QRCode from 'qrcode';
import { formatDate, getIntendedRouteLabel } from '../utils/formatters';

export function PrintTagModal({ isOpen, onClose, repair }) {
  if (!isOpen || !repair) return null;

  const canvasRef = useRef(null);
  const intended = getIntendedRouteLabel(repair.intended_return_route);

  useEffect(() => {
    if (canvasRef.current && repair) {
      const qrData = JSON.stringify({
        ticket: repair.ticket_number,
        part: repair.part_name,
        partNo: repair.part_number,
        serial: repair.serial_number,
        origFarmer: repair.original_farmer_name || 'Stock',
        intendedRoute: repair.intended_return_route,
        vendor: repair.vendor_name,
        rma: repair.vendor_rma_number,
      });

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  }, [repair]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101624] border border-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Controls (Not printed) */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E131F] print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              Printable Repair & Box Routing Tag
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tag (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 bg-slate-900/60 print:p-0 print:bg-white flex justify-center">
          <div
            id="printable-tag-area"
            className="w-full max-w-md bg-white text-black p-6 rounded-xl border-2 border-black shadow-lg font-sans space-y-4 print:border-none print:shadow-none print:max-w-none print:w-full"
          >
            {/* Tag Header */}
            <div className="border-b-2 border-black pb-3 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-extrabold tracking-widest text-slate-800 uppercase">
                  KAEBS WAKARUSA • REPAIR TAG
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-black mt-0.5">
                  {repair.ticket_number}
                </div>
              </div>
              <canvas ref={canvasRef} className="w-24 h-24 border border-black rounded" />
            </div>

            {/* Part & Identifiers */}
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase text-slate-600">Part Description</div>
              <div className="text-base font-extrabold text-black leading-snug">
                {repair.part_name}
              </div>
              <div className="text-xs font-mono font-bold text-slate-800 flex flex-wrap gap-x-4 pt-1">
                {repair.part_number && <span>OEM: {repair.part_number}</span>}
                {repair.serial_number && <span>SN: {repair.serial_number}</span>}
                {repair.pcb_revision && <span>PCB: {repair.pcb_revision}</span>}
              </div>
            </div>

            {/* INTENDED RETURN ROUTE (HIGHLIGHTED BOX) */}
            <div className="border-2 border-black p-3 bg-slate-100 rounded-lg space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <span>🎯 INTENDED DESTINATION UPON RETURN:</span>
              </div>
              <div className="text-sm font-black text-black">
                {intended.label}
              </div>
              {repair.intended_return_route === 'FLOAT_STOCK' && (
                <div className="text-[11px] font-semibold text-slate-700">
                  Hold in Non-Inventoried Shop Float Stock for next customer swap
                </div>
              )}
              {repair.intended_return_route === 'ORIGINAL_FARMER' && (
                <div className="text-[11px] font-semibold text-slate-700">
                  Deliver/reinstall to {repair.original_farmer_name || 'Original Farmer'}
                </div>
              )}
            </div>

            {/* Customer & Vendor Details */}
            <div className="grid grid-cols-2 gap-3 text-xs border-t-2 border-black pt-3">
              <div>
                <div className="font-bold text-slate-600 uppercase text-[10px]">Origin Customer</div>
                <div className="font-extrabold text-black text-sm">
                  {repair.original_farmer_name || 'Stock Inventory'}
                </div>
                {repair.original_farmer_code && (
                  <div className="font-mono text-slate-800">Farm ID: {repair.original_farmer_code}</div>
                )}
              </div>

              <div>
                <div className="font-bold text-slate-600 uppercase text-[10px]">Vendor & RMA #</div>
                <div className="font-extrabold text-black text-sm">
                  {repair.vendor_name || 'N/A'}
                </div>
                {repair.vendor_rma_number && (
                  <div className="font-mono text-slate-800">RMA: {repair.vendor_rma_number}</div>
                )}
              </div>
            </div>

            {/* Tech, Date, and Physical Marks */}
            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-400 pt-2 font-mono">
              <div>
                <span className="text-slate-600 font-sans text-[10px] uppercase block font-bold">Tech / Pulled By</span>
                <span className="font-bold">{repair.technician_name}</span>
              </div>
              <div>
                <span className="text-slate-600 font-sans text-[10px] uppercase block font-bold">Date Shipped</span>
                <span className="font-bold">{formatDate(repair.date_shipped || repair.date_removed)}</span>
              </div>
            </div>

            {repair.physical_markings && (
              <div className="text-[11px] border-t border-slate-300 pt-2 text-slate-800">
                <strong>Physical Marks:</strong> {repair.physical_markings}
              </div>
            )}

            <div className="text-[9px] text-center text-slate-500 font-mono pt-2 border-t border-slate-300">
              Tape this tag to anti-static pouch or box. Scribe ticket {repair.ticket_number} onto connector shell.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
