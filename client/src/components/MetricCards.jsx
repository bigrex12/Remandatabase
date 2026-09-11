import React from 'react';
import { TrendingUp, ArrowDownToLine, Package, DollarSign } from 'lucide-react';

export function MetricCards({ stats, activeTab, onSelectTab }) {
  const cards = [
    {
      id: 'all',
      title: 'Total Orders',
      value: stats?.totalRepairs ?? 0,
      icon: TrendingUp,
      iconColor: 'text-indigo-400',
      valueColor: 'text-white'
    },
    {
      id: 'vendor_out',
      title: 'On Backorder / At Vendor',
      value: stats?.atVendor ?? 0,
      icon: ArrowDownToLine,
      iconColor: 'text-rose-400',
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
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-md ${
              isSelected
                ? 'bg-[#182640] border-indigo-400 shadow-indigo-500/20 ring-2 ring-indigo-500/50'
                : 'bg-[#141E32] border-[#2A3B5A] hover:border-indigo-400/60 hover:bg-[#1A2844]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wider uppercase">
              <Icon className={`w-4 h-4 ${card.iconColor}`} />
              <span>{card.title}</span>
            </div>

            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
