import React from 'react';
import { 
  QrCode, 
  ArrowRightLeft, 
  PackageCheck, 
  DollarSign, 
  ChevronRight,
  ExternalLink,
  Camera
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export function RepairTable({
  repairs = [],
  loading = false,
  onSelectRepair,
  onOpenCheckInModal,
  onOpenDeployModal,
  onOpenBillingModal,
  onOpenPrintModal
}) {
  if (loading) {
    return (
      <div className="p-12 text-center bg-[#101624] border border-[#1E293B] rounded-2xl">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm text-slate-400">Loading orders...</p>
      </div>
    );
  }

  if (repairs.length === 0) {
    return (
      <div className="p-12 text-center bg-[#101624] border border-[#1E293B] rounded-2xl">
        <p className="text-base font-semibold text-slate-300">No matching orders found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or log a new part.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#101624] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header matching original screenshot */}
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#0E131F]/90 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-4 px-5 w-32 whitespace-nowrap">DATE ↓</th>
              <th className="py-4 px-5 min-w-[240px]">PART DETAILS</th>
              <th className="py-4 px-4 text-center w-14">QTY</th>
              <th className="py-4 px-5 w-28">WHO</th>
              <th className="py-4 px-5 min-w-[200px]">DESTINATION / REF</th>
              <th className="py-4 px-5 min-w-[150px]">STATUS / PO</th>
              <th className="py-4 px-4 text-right w-28"></th>
            </tr>
          </thead>

          {/* Clean table body matching screenshot */}
          <tbody className="divide-y divide-[#182133]">
            {repairs.map((r) => {
              const isAtVendor = r.status === 'SHIPPED_TO_VENDOR' || r.status === 'AT_VENDOR_REPAIRING';
              const isInFloat = r.status === 'IN_FLOAT_STOCK';
              const dateDisplay = formatDate(r.date_shipped || r.date_removed || r.created_at);

              // Clean destination display matching screenshot
              let destinationPill = null;
              if (r.status === 'IN_FLOAT_STOCK') {
                destinationPill = (
                  <div className="inline-block px-3.5 py-1 rounded-full text-xs font-medium bg-[#1A1F2C] text-slate-300 border border-slate-700/50">
                    {r.shelf_bin_location || 'Stock Inventory'}
                  </div>
                );
              } else if (r.original_farmer_code || r.original_farmer_name) {
                destinationPill = (
                  <div className="inline-block px-3.5 py-1 rounded-full text-xs font-medium bg-[#1C1838] text-[#818CF8] border border-[#3730A3]/50">
                    Farmer: {r.original_farmer_code || r.original_farmer_name}
                  </div>
                );
              } else {
                destinationPill = (
                  <div className="inline-block px-3.5 py-1 rounded-full text-xs font-medium bg-[#161D2B] text-slate-400 border border-slate-800">
                    Stock Inventory
                  </div>
                );
              }

              // Clean status text
              let statusLabel = 'Pending';
              if (r.status === 'INSTALLED_ORIGINAL_FARMER' || r.status === 'DEPLOYED_FROM_FLOAT' || r.status === 'REASSIGNED_NEW_FARMER') {
                statusLabel = 'Completed';
              } else if (r.status === 'IN_FLOAT_STOCK') {
                statusLabel = 'In Float Stock';
              }

              return (
                <tr
                  key={r.id}
                  className="hover:bg-[#141C2E] transition-colors group cursor-pointer"
                  onClick={() => onSelectRepair(r.id)}
                >
                  {/* 1. Date */}
                  <td className="py-4 px-5 font-mono text-slate-300 whitespace-nowrap">
                    {dateDisplay}
                  </td>

                  {/* 2. Part Details (Bold title + OEM Part # below) */}
                  <td className="py-4 px-5">
                    <div>
                      <div className="font-semibold text-white text-[13px] group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        <span>{r.part_name}</span>
                        {r.photo_count > 0 && (
                          <span className="text-slate-500 inline-flex items-center text-[10px]" title="Photo attached">
                            <Camera className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-xs font-mono mt-0.5">
                        {r.part_number || r.ticket_number}
                      </div>
                    </div>
                  </td>

                  {/* 3. QTY */}
                  <td className="py-4 px-4 text-center font-mono text-slate-300 font-medium text-[13px]">
                    {r.quantity || 1}
                  </td>

                  {/* 4. WHO */}
                  <td className="py-4 px-5 font-medium text-slate-300 whitespace-nowrap text-xs">
                    {r.technician_name}
                  </td>

                  {/* 5. DESTINATION / REF (Clean Pill Badge) */}
                  <td className="py-4 px-5">
                    {destinationPill}
                  </td>

                  {/* 6. STATUS / PO (Stacked cleanly like screenshot) */}
                  <td className="py-4 px-5">
                    <div>
                      {r.customer_po_wo ? (
                        <div className="font-mono text-xs font-semibold text-[#818CF8]">
                          {r.customer_po_wo}
                        </div>
                      ) : null}
                      <div className="text-slate-400 text-xs mt-0.5">
                        {statusLabel}
                      </div>
                    </div>
                  </td>

                  {/* 7. Hover Actions & Details Trigger */}
                  <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      
                      {isAtVendor && (
                        <button
                          onClick={() => onOpenCheckInModal(r)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg transition-all cursor-pointer"
                          title="Check in returned board"
                        >
                          Check In
                        </button>
                      )}

                      {isInFloat && (
                        <button
                          onClick={() => onOpenDeployModal(r)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 rounded-lg transition-all cursor-pointer"
                          title="Deploy board to customer"
                        >
                          Deploy
                        </button>
                      )}

                      <button
                        onClick={() => onOpenPrintModal(r)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Print Tag / QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectRepair(r.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="View Full Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
