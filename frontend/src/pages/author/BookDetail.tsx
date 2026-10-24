import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Book, Ticket } from '../../types';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  ShoppingBag,
  Coins,
  CheckCircle2,
  Clock,
  Printer,
  Globe,
  PlusCircle,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';

const PRODUCTION_STAGES = [
  'Manuscript Received',
  'Editing',
  'Cover Design',
  'Typesetting',
  'Proofreading',
  'ISBN Assignment',
  'Printing',
  'Distribution Setup',
  'Published & Live',
];

export const BookDetail: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<(Book & { tickets: Ticket[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await api.getAuthorBook(bookId);
        setBook(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load book details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto">
        <h3 className="text-base font-bold text-slate-900">Book Not Found</h3>
        <p className="mt-2 text-sm text-slate-500">{error || 'The requested book was not found or access was restricted.'}</p>
        <Link
          to="/author/books"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Books
        </Link>
      </div>
    );
  }

  const isLive = book.status === 'Published & Live';

  // Determine active production milestone stage index
  const currentStageIndex = isLive
    ? 8
    : PRODUCTION_STAGES.findIndex((s) => book.status.toLowerCase().includes(s.toLowerCase()));
  const activeStageIdx = currentStageIndex >= 0 ? currentStageIndex : 2;

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/author/books"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Books
        </Link>
        <button
          onClick={() => navigate('/author/tickets/new', { state: { bookId: book.id } })}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Raise Ticket for this Book
        </button>
      </div>

      {/* Main Book Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                {book.id}
              </span>
              <span className="text-xs font-medium text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">{book.genre || 'General'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{book.title}</h1>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              ISBN: <span className="font-semibold text-slate-800">{book.isbn || 'Pending Assignment'}</span>
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isLive ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {book.status}
          </span>
        </div>

        {/* Production Stage Pipeline Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" /> Production Pipeline Progression
          </h2>
          <div className="relative">
            <div className="hidden md:flex items-center justify-between relative z-10">
              {PRODUCTION_STAGES.map((stage, idx) => {
                const isPassed = idx <= activeStageIdx;
                const isCurrent = idx === activeStageIdx;
                return (
                  <div key={stage} className="flex flex-col items-center flex-1 text-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-medium max-w-[85px] leading-tight ${
                        isCurrent ? 'text-brand-700 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Background connecting line */}
            <div className="hidden md:block absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 -z-0">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(activeStageIdx / (PRODUCTION_STAGES.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* Mobile simplified stage indicator */}
            <div className="md:hidden p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Current Milestone:</span>
              <span className="text-xs font-bold text-brand-700">{book.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Financial Metrics & Distribution Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Royalty & Sales Details */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" /> Sales & Royalty Breakdown
          </h2>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-50 text-xs">
              <span className="text-slate-500">Retail MRP:</span>
              <span className="font-semibold text-slate-900">{book.mrp ? `₹${book.mrp}` : 'Not fixed yet'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 text-xs">
              <span className="text-slate-500">Author Royalty / Copy (80% net):</span>
              <span className="font-semibold text-slate-900">
                {book.author_royalty_per_copy ? `₹${book.author_royalty_per_copy}` : 'Pending Net Calc'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 text-xs">
              <span className="text-slate-500">Total Copies Sold:</span>
              <span className="font-bold text-slate-900">{book.total_copies_sold} copies</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 text-xs">
              <span className="text-slate-500">Total Royalty Earned:</span>
              <span className="font-bold text-emerald-700 text-sm">₹{book.total_royalty_earned}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 text-xs">
              <span className="text-slate-500">Disbursed (Paid):</span>
              <span className="font-semibold text-slate-800">₹{book.royalty_paid}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs bg-amber-50/50 p-2 rounded-lg">
              <span className="font-medium text-amber-900">Pending Royalty Payout:</span>
              <span className="font-bold text-amber-700 text-sm">₹{book.royalty_pending}</span>
            </div>
            {book.last_royalty_payout_date && (
              <div className="text-[11px] text-slate-400 text-right mt-1">
                Last Payout: {new Date(book.last_royalty_payout_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Manufacturing & Channels */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" /> Printing & Channel Availability
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <span className="text-xs text-slate-500 block mb-1">Print Facility Partner:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                {book.print_partner || 'BookLeaf Delhi In-House'}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">Publication Date:</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {book.publication_date ? new Date(book.publication_date).toLocaleDateString() : 'Awaiting Release'}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-2">Retail Listing Channels:</span>
              <div className="flex flex-wrap gap-2">
                {book.available_on && book.available_on.length > 0 ? (
                  book.available_on.map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200"
                    >
                      <ExternalLink className="w-3 h-3 text-brand-500" />
                      {channel}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Distribution setup initiates upon print approval.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Queries for this book */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Support Inquiries for this Book</h2>
          </div>
          <button
            onClick={() => navigate('/author/tickets/new', { state: { bookId: book.id } })}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Submit New Query
          </button>
        </div>

        <div className="mt-4">
          {book.tickets && book.tickets.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {book.tickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/author/tickets/${t.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">{t.ticket_number}</span>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} showIcon={false} />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{t.subject}</div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No support queries registered for this book.</p>
          )}
        </div>
      </div>
    </div>
  );
};
