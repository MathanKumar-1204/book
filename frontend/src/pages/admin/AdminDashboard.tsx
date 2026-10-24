import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AdminDashboardStats } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart3,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getAdminDashboard();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
        {error || 'Failed to load metrics.'}
      </div>
    );
  }

  // Format data for Recharts
  const categoryChartData = Object.entries(stats.by_category || {}).map(([name, count]) => ({
    name: name.replace(' & ', ' &\n'),
    count,
  }));

  const priorityColors: Record<string, string> = {
    Critical: '#dc2626',
    High: '#d97706',
    Medium: '#2563eb',
    Low: '#64748b',
  };

  const priorityChartData = Object.entries(stats.by_priority || {}).map(([name, value]) => ({
    name,
    value,
    color: priorityColors[name] || '#94a3b8',
  }));

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="bg-navy-950 text-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 bg-brand-950/80 px-2.5 py-0.5 rounded border border-brand-800">
              Operations Control
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Operations Support Overview</h1>
          <p className="mt-1 text-sm text-slate-300">
            Real-time ticket volume, AI auto-classification breakdowns, and priority triage queue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs"
          >
            <Inbox className="w-4 h-4" /> Open Global Ticket Queue
          </Link>
        </div>
      </div>

      {/* Real DB Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inquiries"
          value={stats.total_tickets}
          subtitle={`${stats.open_tickets} Open, ${stats.in_progress_tickets} In Progress`}
          icon={<Inbox className="w-5 h-5" />}
        />
        <StatCard
          title="Critical & High Priority"
          value={stats.critical_tickets + stats.high_priority_tickets}
          subtitle={`${stats.critical_tickets} Critical, ${stats.high_priority_tickets} High`}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          alert={stats.critical_tickets > 0}
        />
        <StatCard
          title="Awaiting Assignment"
          value={stats.awaiting_admin}
          subtitle="Unassigned active queries"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Resolved Tickets"
          value={stats.resolved_tickets}
          subtitle={`${stats.closed_tickets} Closed Archival`}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" /> Inquiries Grouped by Category
            </h2>
            <span className="text-xs text-slate-400">Live Database Counts</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Priority Distribution
              </h2>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                    paddingAngle={3}
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {priorityChartData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                <span className="text-slate-600">{p.name}:</span>
                <span className="font-bold text-slate-900">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incoming Urgent Queries */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Incoming Tickets</h2>
          </div>
          <Link to="/admin/tickets" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View All In Queue <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Subject & Book</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_tickets.slice(0, 6).map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                    {ticket.ticket_number}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{ticket.author?.full_name || 'Author'}</div>
                    <div className="text-[11px] text-slate-400">{ticket.author?.email}</div>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">{ticket.subject}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {ticket.book ? `Book: ${ticket.book.title}` : 'General / Account Level'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <CategoryBadge category={ticket.category} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      to={`/admin/tickets/${ticket.id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Review & Reply
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
