import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Ticket } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  LifeBuoy,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Clock,
  BookOpen
} from 'lucide-react';

export const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getAuthorTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
        sort_by: sortBy,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track communication and updates for queries submitted to the BookLeaf operations team.
          </p>
        </div>
        <Link
          to="/author/tickets/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Raise New Ticket
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket number or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets found"
          description={search || statusFilter ? 'Try clearing your active filters.' : 'You have not submitted any support tickets yet.'}
          actionLabel="Submit a Support Query"
          onAction={() => window.location.assign('/author/tickets/new')}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/author/tickets/${t.id}`}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition group"
            >
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {t.ticket_number}
                  </span>
                  <StatusBadge status={t.status} />
                  <CategoryBadge category={t.category} />
                  <PriorityBadge priority={t.priority} showIcon={false} />
                </div>

                <div className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition">
                  {t.subject}
                </div>

                <p className="text-xs text-slate-500 line-clamp-1">
                  {t.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  {t.book ? (
                    <span className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-xs">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {t.book.title}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">General / Account Level</span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                  View Conversation <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
