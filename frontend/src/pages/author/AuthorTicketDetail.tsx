import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Ticket, TicketMessage } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  BookOpen,
  Send,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const AuthorTicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<(Ticket & { messages: TicketMessage[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      const data = await api.getAuthorTicket(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!ticketId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`ticket_messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as TicketMessage;
          // Strictly ignore internal notes for author
          if (newMsg.visibility === 'public') {
            setTicket((prev) => {
              if (!prev) return prev;
              const exists = prev.messages?.some((m) => m.id === newMsg.id);
              if (exists) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), newMsg],
              };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          const updatedTicket = payload.new as Ticket;
          setTicket((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: updatedTicket.status,
              priority: updatedTicket.priority,
              category: updatedTicket.category,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !replyText.trim()) return;

    setSending(true);
    try {
      const sent = await api.sendAuthorMessage(ticketId, replyText.trim());
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), sent],
        };
      });
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Ticket Not Accessible</h3>
        <p className="mt-2 text-sm text-slate-500">{error || 'This ticket was not found or access was restricted.'}</p>
        <Link
          to="/author/tickets"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/author/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Tickets
        </Link>
        <button
          onClick={fetchTicket}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} showIcon={false} />
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {new Date(ticket.created_at).toLocaleString()}
          </span>
        </div>

        <div className="mt-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
          {ticket.book && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-800 rounded-lg text-xs font-semibold border border-brand-200">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              Associated Book: {ticket.book.title} {ticket.book.isbn ? `(ISBN: ${ticket.book.isbn})` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          Ticket Conversation & Updates
        </h2>

        {/* Original Query Message */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">Your Original Query</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>

        {/* Message Stream */}
        <div className="space-y-4 pt-2">
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((msg) => {
              const isAuthor = msg.sender_role === 'author';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAuthor ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm ${
                      isAuthor
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-900 shadow-xs rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/20">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {isAuthor ? (
                          <span>You (Author)</span>
                        ) : (
                          <span className="text-navy-950 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                            BookLeaf Operations Team
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] ${isAuthor ? 'text-brand-100' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No replies yet. An operations specialist will respond shortly.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box */}
        {ticket.status !== 'Closed' ? (
          <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Send a Follow-up Message
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response or additional information here..."
                disabled={sending}
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="self-end sm:self-stretch px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
            This ticket has been marked as Closed.
          </div>
        )}
      </div>
    </div>
  );
};
