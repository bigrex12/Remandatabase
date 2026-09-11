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
      <div className="p-16 text-center bg-[#141E32] border border-[#2A3B5A] rounded-2xl shadow-md">
        <div className="inline-block animate-spin w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full mb-4"></div>
        <p className="text-base font-semibold text-slate-200">Loading orders...</p>
      </div>
    );
  }

  if (repairs.length === 0) {
    return (
      <div className="p-16 text-center bg-[#141E32] border border-[#2A3B5A] rounded-2xl shadow-md">
        <p className="text-lg font-bold text-slate-200">No matching orders found</p>
        <p className="text-sm text-slate-400 mt-1.5">Try adjusting your search filters or click "Log New Part" above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2A3B5A] bg-[#141E32] shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header matching original screenshot */}
          <thead>
            <tr className="border-b border-[#2A3B5A] bg-[#0E1626] text-slate-200 font-extrabold uppercase tracking-wider text-xs">
              <th className="py-4.5 px-6 w-36 whitespace-nowrap">DATE ↓</th>
              <th className="py-4.5 px-6 min-w-[260px]">PART DETAILS</th>
              <th className="py-4.5 px-4 text-center w-16">QTY</th>
              <th className="py-4.5 px-6 w-32">WHO</th>
              <th className="py-4.5 px-6 min-w-[220px]">DESTINATION / REF</th>
              <th className="py-4.5 px-6 min-w-[170px]">STATUS / PO</th>
              <th className="py-4.5 px-5 text-right w-36"></th>
            </tr>
          </thead>

          {/* Clean table body matching screenshot */}
          <tbody className="divide-y divide-[#22314C]">
            {repairs.map((r) => {
              const isAtVendor = r.status === 'SHIPPED_TO_VENDOR' || r.status === 'AT_VENDOR_REPAIRING';
              const isInFloat = r.status === 'IN_FLOAT_STOCK';
              const dateDisplay = formatDate(r.date_shipped || r.date_removed || r.created_at);

              // Clean destination display matching screenshot
              let destinationPill = null;
              if (r.status === 'IN_FLOAT_STOCK') {
                destinationPill = (
                  <div className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#2E2010] text-[#FDE68A] border border-[#B45309] shadow-sm">
                    {r.shelf_bin_location || 'Stock Inventory'}
                  </div>
                );
              } else if (r.original_farmer_code || r.original_farmer_name) {
                destinationPill = (
                  <div className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#262058] text-[#C7D2FE] border border-[#6366F1] shadow-sm">
                    Farmer: {r.original_farmer_code || r.original_farmer_name}
                  </div>
                );
              } else {
                destinationPill = (
                  <div className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-[#1B273E] text-slate-300 border border-[#334668]">
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
                  className="hover:bg-[#1C2A44] transition-colors group cursor-pointer"
                  onClick={() => onSelectRepair(r.id)}
                >
                  {/* 1. Date */}
                  <td className="py-4.5 px-6 font-mono text-slate-200 font-semibold whitespace-nowrap text-sm">
                    {dateDisplay}
                  </td>

                  {/* 2. Part Details (Bold title + OEM Part # below) */}
                  <td className="py-4.5 px-6">
                    <div>
                      <div className="font-bold text-white text-[15px] group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                        <span>{r.part_name}</span>
                        {r.photo_count > 0 && (
                          <span className="text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-700/60 inline-flex items-center gap-1 text-[11px] font-semibold" title="Photo attached">
                            <Camera className="w-3 h-3" />
                            <span>{r.photo_count}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-slate-300 text-xs font-mono font-medium mt-1">
                        {r.part_number || r.ticket_number}
                      </div>
                    </div>
                  </td>

                  {/* 3. QTY */}
                  <td className="py-4.5 px-4 text-center font-mono text-white font-extrabold text-sm">
                    {r.quantity || 1}
                  </td>

                  {/* 4. WHO */}
                  <td className="py-4.5 px-6 font-semibold text-slate-200 whitespace-nowrap text-sm">
                    {r.technician_name}
                  </td>

                  {/* 5. DESTINATION / REF (Clean Pill Badge) */}
                  <td className="py-4.5 px-6">
                    {destinationPill}
                  </td>

                  {/* 6. STATUS / PO (Stacked cleanly like screenshot) */}
                  <td className="py-4.5 px-6">
                    <div>
                      {r.customer_po_wo ? (
                        <div className="font-mono text-sm font-bold text-[#A5B4FC]">
                          {r.customer_po_wo}
                        </div>
                      ) : null}
                      <div className="text-slate-300 text-xs font-semibold mt-0.5">
                        {statusLabel}
                      </div>
                    </div>
                  </td>

                  {/* 7. Hover Actions & Details Trigger */}
                  <td className="py-4.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {isAtVendor && (
                        <button
                          onClick={() => onOpenCheckInModal(r)}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-100 bg-emerald-800 hover:bg-emerald-700 border border-emerald-500 rounded-lg shadow-sm transition-all cursor-pointer"
                          title="Check in returned board"
                        >
                          Check In
                        </button>
                      )}

                      {isInFloat && (
                        <button
                          onClick={() => onOpenDeployModal(r)}
                          className="px-3 py-1.5 text-xs font-bold text-amber-100 bg-amber-800 hover:bg-amber-700 border border-amber-500 rounded-lg shadow-sm transition-all cursor-pointer"
                          title="Deploy board to customer"
                        >
                          Deploy
                        </button>
                      )}

                      <button
                        onClick={() => onOpenPrintModal(r)}
                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
                        title="Print Tag / QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectRepair(r.id)}
                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
                        title="View Full Details"
                      >
                        <ChevronRight className="w-4.5 h-4.5" />
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
