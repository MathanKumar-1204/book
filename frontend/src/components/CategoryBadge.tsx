import React from 'react';
import { TicketCategory } from '../types';

interface CategoryBadgeProps {
  category: TicketCategory | string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const getColors = () => {
    switch (category) {
      case 'Royalty & Payments':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'ISBN & Metadata Issues':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Printing & Quality':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Distribution & Availability':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Book Status & Production Updates':
        return 'bg-violet-50 text-violet-800 border-violet-200';
      case 'General Inquiry':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getColors()}`}>
      {category}
    </span>
  );
};
