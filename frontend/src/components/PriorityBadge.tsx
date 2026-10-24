import React from 'react';
import { TicketPriority } from '../types';
import { AlertCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TicketPriority | string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-600" />}
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-slate-500" />}
          Low
        </span>
      );
  }
};
