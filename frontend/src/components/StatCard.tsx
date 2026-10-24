import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  alert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  alert = false,
}) => {
  return (
    <div className={`p-5 rounded-xl border bg-white shadow-xs transition hover:shadow-sm ${
      alert ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${alert ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center text-xs text-slate-500">
            {trend && <span className="mr-1.5 font-medium text-emerald-600">{trend}</span>}
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
