import React from 'react';
import { TrendingUp, ArrowDownToLine, Package, DollarSign } from 'lucide-react';

export function MetricCards({ stats, activeTab, onSelectTab }) {
  const cards = [
    {
      id: 'all',
      title: 'Total Orders',
      value: stats?.totalRepairs ?? 0,
      icon: TrendingUp,
      iconColor: 'text-slate-400',
      valueColor: 'text-white'
    },
    {
      id: 'vendor_out',
      title: 'On Backorder / At Vendor',
      value: stats?.atVendor ?? 0,
      icon: ArrowDownToLine,
      iconColor: 'text-rose-500',
      valueColor: 'text-white'
    },
    {
      id: 'float_stock',
      title: 'Stock Inventory / Float',
      value: stats?.inFloatStock ?? 0,
      icon: Package,
      iconColor: 'text-amber-400',
      valueColor: 'text-white'
    },
    {
      id: 'ready_bill',
      title: 'Pending Invoicing',
      value: stats?.readyToBill ?? 0,
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      valueColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeTab === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onSelectTab && onSelectTab(card.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#141B2D] border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                : 'bg-[#101624] border-[#1E293B] hover:border-slate-700 hover:bg-[#131B2C]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide uppercase">
              <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
              <span>{card.title}</span>
            </div>

            <div className="mt-2.5">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
