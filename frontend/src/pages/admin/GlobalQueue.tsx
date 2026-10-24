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
  Inbox,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const GlobalQueue: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
        sort_by: sortBy,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, categoryFilter, priorityFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Ticket Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Triage, review AI auto-classifications, draft grounded responses, and resolve author inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket ID, subject, author name, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
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
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[140px]"
            >
              <option value="">All Categories</option>
              <option value="Royalty & Payments">Royalty & Payments</option>
              <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
              <option value="Printing & Quality">Printing & Quality</option>
              <option value="Distribution & Availability">Distribution</option>
              <option value="Book Status & Production Updates">Production Updates</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
              <option value="priority">Priority First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Queue Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No tickets match criteria"
          description="Try resetting your filters or search terms."
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Ticket ID</th>
                  <th className="px-4 py-3.5">Author</th>
                  <th className="px-4 py-3.5">Subject & Association</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assignee</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const isCritical = t.priority === 'Critical';
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCritical ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                        {t.ticket_number}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{t.author?.full_name || 'Author'}</div>
                        <div className="text-[11px] text-slate-400">{t.author?.email}</div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{t.subject}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {t.book ? `Book: ${t.book.title}` : 'General / Account Level'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <CategoryBadge category={t.category} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={t.priority} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        {t.assigned_admin ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                            {t.assigned_admin.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/tickets/${t.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition shadow-xs"
                        >
                          Manage <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
