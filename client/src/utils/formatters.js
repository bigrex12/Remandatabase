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
        bg: 'bg-blue-950/70 border-blue-800/80 text-blue-300',
        dot: 'bg-blue-400'
      };
    case 'AT_VENDOR_REPAIRING':
      return {
        label: 'At Vendor (In Repair)',
        bg: 'bg-indigo-950/70 border-indigo-700/80 text-indigo-300',
        dot: 'bg-indigo-400'
      };
    case 'RETURNED_TO_SHOP':
      return {
        label: 'Returned to Shop',
        bg: 'bg-cyan-950/70 border-cyan-700/80 text-cyan-300',
        dot: 'bg-cyan-400'
      };
    case 'IN_FLOAT_STOCK':
      return {
        label: 'In Float Stock (Shelf)',
        bg: 'bg-amber-950/70 border-amber-700/80 text-amber-300',
        dot: 'bg-amber-400'
      };
    case 'INSTALLED_ORIGINAL_FARMER':
      return {
        label: 'Installed (Orig Farmer)',
        bg: 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300',
        dot: 'bg-emerald-400'
      };
    case 'REASSIGNED_NEW_FARMER':
      return {
        label: 'Reassigned Customer',
        bg: 'bg-purple-950/70 border-purple-700/80 text-purple-300',
        dot: 'bg-purple-400'
      };
    case 'DEPLOYED_FROM_FLOAT':
      return {
        label: 'Deployed from Float',
        bg: 'bg-teal-950/70 border-teal-700/80 text-teal-300',
        dot: 'bg-teal-400'
      };
    case 'SCRAPPED_UNREPAIRABLE':
      return {
        label: 'Scrapped / Beyond Repair',
        bg: 'bg-rose-950/70 border-rose-800/80 text-rose-300',
        dot: 'bg-rose-500'
      };
    default:
      return {
        label: status || 'Pending',
        bg: 'bg-slate-800 border-slate-700 text-slate-300',
        dot: 'bg-slate-400'
      };
  }
}

export function getIntendedRouteLabel(route) {
  switch (route) {
    case 'FLOAT_STOCK':
      return { label: 'Float / Reman Stock', color: 'text-amber-400 bg-amber-950/50 border-amber-800/60' };
    case 'DESIGNATED_FARMER':
      return { label: 'Pre-Allocated Farmer', color: 'text-purple-400 bg-purple-950/50 border-purple-800/60' };
    case 'ORIGINAL_FARMER':
    default:
      return { label: 'Return to Orig Farmer', color: 'text-blue-400 bg-blue-950/50 border-blue-800/60' };
  }
}

export function getBillingStatusBadge(billingStatus) {
  switch (billingStatus) {
    case 'BILLED':
      return { label: 'Billed / Invoiced', bg: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60' };
    case 'READY_TO_BILL':
      return { label: 'Ready to Bill', bg: 'bg-purple-900/60 text-purple-300 border-purple-700/60' };
    case 'WARRANTY_INTERNAL':
      return { label: 'Warranty (Internal)', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    case 'CORE_CREDIT':
      return { label: 'Core Credit', bg: 'bg-blue-900/60 text-blue-300 border-blue-700/60' };
    case 'PENDING':
    default:
      return { label: 'Pending Repair', bg: 'bg-slate-800/80 text-slate-400 border-slate-700/60' };
  }
}
