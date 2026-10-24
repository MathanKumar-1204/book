import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { api } from '../../services/api';
import { AuthorDashboardStats } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  ShoppingBag,
  LifeBuoy,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export const AuthorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AuthorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getAuthorDashboard();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton rows={2} />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
        {error || 'Failed to load dashboard data.'}
        <button
          onClick={() => window.location.reload()}
          className="mt-3 block px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor your book production pipeline, sales performance, and royalty disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/author/books"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            My Books
          </Link>
          <Link
            to="/author/tickets/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Raise Support Ticket
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Books"
          value={stats.total_books}
          subtitle={`${stats.published_books} Published & Live`}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          title="Copies Sold"
          value={stats.total_copies_sold.toLocaleString()}
          subtitle="Across Amazon, Flipkart & Store"
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <StatCard
          title="Total Royalties Earned"
          value={`₹${stats.total_royalty_earned.toLocaleString()}`}
          subtitle={`₹${stats.royalty_paid.toLocaleString()} Disbursed`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Pending Royalty"
          value={`₹${stats.royalty_pending.toLocaleString()}`}
          subtitle="Quarterly Payout Cycle (₹1,000 min)"
          icon={<Coins className="w-5 h-5 text-amber-600" />}
          alert={stats.royalty_pending >= 1000}
        />
      </div>

      {/* Two-Column Section: Recent Tickets & Books In Production */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Recent Support Queries</h2>
            </div>
            <Link to="/author/tickets" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4">
            {stats.recent_tickets.length === 0 ? (
              <EmptyState
                icon={LifeBuoy}
                title="No support tickets"
                description="Have a question about your royalty, printing, or ISBN? Submit a query anytime."
                actionLabel="Submit Ticket"
                onAction={() => window.location.assign('/author/tickets/new')}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/author/tickets/${ticket.id}`}
                    className="py-3 flex items-center justify-between group hover:bg-slate-50 px-2 rounded-lg transition"
                  >
                    <div className="overflow-hidden pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">{ticket.ticket_number}</span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 truncate mt-1">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {ticket.category} • Priority: <PriorityBadge priority={ticket.priority} showIcon={false} />
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Books Catalog Preview */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Published Titles & Pipeline</h2>
            </div>
            <Link to="/author/books" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View Catalog <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4">
            {stats.recent_books.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No books registered"
                description="Your published titles and production pipeline will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_books.map((book) => (
                  <div key={book.id} className="py-3 flex items-center justify-between px-2">
                    <div className="overflow-hidden pr-3">
                      <div className="text-sm font-bold text-slate-900 truncate">{book.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ISBN: {book.isbn || 'Pending Assignment'} • {book.genre || 'General'}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="font-medium text-slate-700">Sold: {book.total_copies_sold}</span>
                        <span className="font-semibold text-emerald-700">Royalty: ₹{book.total_royalty_earned}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      book.status === 'Published & Live'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {book.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
