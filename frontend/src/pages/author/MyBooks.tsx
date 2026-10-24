import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Book } from '../../types';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { BookOpen, Search, Filter, ArrowUpDown, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

export const MyBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'sales' | 'royalty' | 'date'>('sales');

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const data = await api.getAuthorBooks();
        setBooks(data);
      } catch (err) {
        console.error('Failed to load books:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase())) ||
      (b.genre && b.genre.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'PUBLISHED') return b.status === 'Published & Live';
    if (statusFilter === 'IN_PRODUCTION') return b.status.includes('In Production');
    return true;
  });

  filteredBooks.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'sales') return (b.total_copies_sold || 0) - (a.total_copies_sold || 0);
    if (sortBy === 'royalty') return (b.total_royalty_earned || 0) - (a.total_royalty_earned || 0);
    if (sortBy === 'date') return new Date(b.publication_date || 0).getTime() - new Date(a.publication_date || 0).getTime();
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Books</h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive catalog of your published works, production stages, and royalty metrics.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-xs">
          Showing <span className="font-bold text-slate-900">{filteredBooks.length}</span> titles
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, ISBN, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published & Live</option>
              <option value="IN_PRODUCTION">In Production</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="sales">Sort: Highest Sales</option>
              <option value="royalty">Sort: Royalty Earned</option>
              <option value="title">Sort: Title A-Z</option>
              <option value="date">Sort: Publication Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Content */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredBooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No matching books found"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Book Title & ISBN</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Copies Sold</th>
                  <th className="px-4 py-3.5">Royalty Earned</th>
                  <th className="px-4 py-3.5">Royalty Paid</th>
                  <th className="px-4 py-3.5">Pending Payout</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  const isLive = book.status === 'Published & Live';
                  return (
                    <tr key={book.id} className="hover:bg-slate-50/60 transition group">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-brand-600">
                          {book.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ISBN: {book.isbn || 'Pending'} • Genre: {book.genre || 'General'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isLive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {book.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {book.total_copies_sold ? book.total_copies_sold.toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-700">
                        ₹{book.total_royalty_earned ? book.total_royalty_earned.toLocaleString() : '0.00'}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        ₹{book.royalty_paid ? book.royalty_paid.toLocaleString() : '0.00'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-semibold ${book.royalty_pending >= 1000 ? 'text-amber-600' : 'text-slate-500'}`}>
                          ₹{book.royalty_pending ? book.royalty_pending.toLocaleString() : '0.00'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/author/books/${book.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
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
