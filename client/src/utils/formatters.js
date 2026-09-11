export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getStatusBadge(status) {
  switch (status) {
    case 'SHIPPED_TO_VENDOR':
      return {
        label: 'Shipped to Vendor',
        bg: 'bg-blue-950/90 border-blue-600/80 text-blue-200',
        dot: 'bg-blue-400'
      };
    case 'AT_VENDOR_REPAIRING':
      return {
        label: 'At Vendor (In Repair)',
        bg: 'bg-indigo-950/90 border-indigo-500/80 text-indigo-200',
        dot: 'bg-indigo-400'
      };
    case 'RETURNED_TO_SHOP':
      return {
        label: 'Returned to Shop',
        bg: 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200',
        dot: 'bg-cyan-300'
      };
    case 'IN_FLOAT_STOCK':
      return {
        label: 'In Float Stock (Shelf)',
        bg: 'bg-amber-950/90 border-amber-500/80 text-amber-200',
        dot: 'bg-amber-300'
      };
    case 'INSTALLED_ORIGINAL_FARMER':
      return {
        label: 'Installed (Orig Farmer)',
        bg: 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200',
        dot: 'bg-emerald-300'
      };
    case 'REASSIGNED_NEW_FARMER':
      return {
        label: 'Reassigned Customer',
        bg: 'bg-purple-950/90 border-purple-500/80 text-purple-200',
        dot: 'bg-purple-300'
      };
    case 'DEPLOYED_FROM_FLOAT':
      return {
        label: 'Deployed from Float',
        bg: 'bg-teal-950/90 border-teal-500/80 text-teal-200',
        dot: 'bg-teal-300'
      };
    case 'SCRAPPED_UNREPAIRABLE':
      return {
        label: 'Scrapped / Beyond Repair',
        bg: 'bg-rose-950/90 border-rose-600/80 text-rose-200',
        dot: 'bg-rose-400'
      };
    default:
      return {
        label: status || 'Pending',
        bg: 'bg-slate-800 border-slate-600 text-slate-200',
        dot: 'bg-slate-300'
      };
  }
}

export function getIntendedRouteLabel(route) {
  switch (route) {
    case 'FLOAT_STOCK':
      return { label: 'Float / Reman Stock', color: 'text-amber-300 bg-amber-950/80 border-amber-600/70' };
    case 'DESIGNATED_FARMER':
      return { label: 'Pre-Allocated Farmer', color: 'text-purple-300 bg-purple-950/80 border-purple-600/70' };
    case 'ORIGINAL_FARMER':
    default:
      return { label: 'Return to Orig Farmer', color: 'text-blue-300 bg-blue-950/80 border-blue-600/70' };
  }
}

export function getBillingStatusBadge(billingStatus) {
  switch (billingStatus) {
    case 'BILLED':
      return { label: 'Billed / Invoiced', bg: 'bg-emerald-900/80 text-emerald-200 border-emerald-500/70' };
    case 'READY_TO_BILL':
      return { label: 'Ready to Bill', bg: 'bg-purple-900/80 text-purple-200 border-purple-500/70' };
    case 'WARRANTY_INTERNAL':
      return { label: 'Warranty (Internal)', bg: 'bg-slate-800 text-slate-200 border-slate-600' };
    case 'CORE_CREDIT':
      return { label: 'Core Credit', bg: 'bg-blue-900/80 text-blue-200 border-blue-500/70' };
    case 'PENDING':
    default:
      return { label: 'Pending Repair', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
}
