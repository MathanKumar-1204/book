import React from 'react';
import { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Open
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
          In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-purple-500"></span>
          Resolved
        </span>
      );
    case 'Closed':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Closed
        </span>
      );
  }
};
