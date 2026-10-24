import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Ticket, TicketMessage, RAGExcerpt, UserProfile } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  BookOpen,
  Send,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  Clock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const AdminTicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<(Ticket & { messages: TicketMessage[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<UserProfile[]>([]);

  // Composer state
  const [activeTab, setActiveTab] = useState<'reply' | 'note'>('reply');
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [sending, setSending] = useState(false);

  // Status & Assignment state
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [assignedAdminId, setAssignedAdminId] = useState<string>('');

  // AI Classification override state
  const [isEditingClassification, setIsEditingClassification] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overridePriority, setOverridePriority] = useState('');
  const [reclassifying, setReclassifying] = useState(false);

  // AI Draft Response state
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [aiDraftText, setAiDraftText] = useState<string | null>(null);
  const [retrievedExcerpts, setRetrievedExcerpts] = useState<RAGExcerpt[]>([]);
  const [draftModel, setDraftModel] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await api.getAdminTicket(ticketId);
      setTicket(data);
      setCurrentStatus(data.status);
      setOverrideCategory(data.category);
      setOverridePriority(data.priority);
      setAssignedAdminId(data.assigned_admin_id || '');
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    api.getAdminUsers().then(setAdmins).catch(() => {});
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  // Handle Public Reply Submission
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !replyMessage.trim()) return;

    setSending(true);
    try {
      const msg = await api.sendAdminReply(ticketId, replyMessage.trim());
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: prev.status === 'Open' ? 'In Progress' : prev.status,
          messages: [...(prev.messages || []), msg],
        };
      });
      setReplyMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to send response.');
    } finally {
      setSending(false);
    }
  };

  // Handle Internal Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !internalNote.trim()) return;

    setSending(true);
    try {
      const msg = await api.addAdminNote(ticketId, internalNote.trim());
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), msg],
        };
      });
      setInternalNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to add internal note.');
    } finally {
      setSending(false);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return;
    setCurrentStatus(newStatus);
    try {
      const updated = await api.updateAdminTicket(ticketId, { status: newStatus });
      setTicket((prev) => (prev ? { ...prev, status: updated.status } : null));
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  // Handle Admin Assignment
  const handleAssignChange = async (adminId: string) => {
    if (!ticketId) return;
    setAssignedAdminId(adminId);
    try {
      const updated = await api.assignAdminTicket(ticketId, adminId);
      setTicket((prev) => (prev ? { ...prev, assigned_admin_id: updated.assigned_admin_id } : null));
    } catch (err: any) {
      alert(err.message || 'Failed to assign ticket.');
    }
  };

  // Handle Classification Override
  const handleSaveClassificationOverride = async () => {
    if (!ticketId) return;
    try {
      const updated = await api.updateAdminTicket(ticketId, {
        category: overrideCategory,
        priority: overridePriority,
      });
      setTicket((prev) => (prev ? { ...prev, ...updated } : null));
      setIsEditingClassification(false);
    } catch (err: any) {
      alert(err.message || 'Failed to override classification.');
    }
  };

  // Trigger AI Re-classification
  const handleReclassifyAI = async () => {
    if (!ticketId) return;
    setReclassifying(true);
    try {
      const res = await api.reclassifyTicket(ticketId);
      setTicket((prev) => (prev ? { ...prev, ...res.data } : null));
      setOverrideCategory(res.data.category);
      setOverridePriority(res.data.priority);
    } catch (err: any) {
      alert(err.message || 'AI classification failed.');
    } finally {
      setReclassifying(false);
    }
  };

  // Generate Grounded AI Draft Response
  const handleGenerateAIDraft = async () => {
    if (!ticketId) return;
    setGeneratingDraft(true);
    try {
      const res = await api.generateAIDraft(ticketId);
      setAiDraftText(res.draft_response);
      setRetrievedExcerpts(res.retrieved_excerpts || []);
      setDraftModel(res.model_used || 'Groq');
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI draft.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Apply AI Draft to Composer
  const handleApplyDraftToReply = () => {
    if (aiDraftText) {
      setReplyMessage(aiDraftText);
      setActiveTab('reply');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto">
        <h3 className="text-base font-bold text-slate-900">Ticket Not Found</h3>
        <Link
          to="/admin/tickets"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Global Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Quick Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Global Queue
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.admin_override && (
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Admin Overridden
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Created: {new Date(ticket.created_at).toLocaleString()}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Author Info, Query, Conversation & Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Author & Book Context Header Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Author Profile
                </span>
                <div className="font-bold text-slate-900 text-base">{ticket.author?.full_name}</div>
                <div className="text-xs text-slate-500">{ticket.author?.email}</div>
              </div>

              {ticket.book && (
                <div className="border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Associated Title
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{ticket.book.title}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    ISBN: {ticket.book.isbn || 'Pending'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation History & Composer */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Conversation & Internal Notes</span>
              <span className="text-xs font-normal text-slate-400">
                {ticket.messages?.length || 0} messages
              </span>
            </h2>

            {/* Original Query */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Author's Inquiry: "{ticket.subject}"
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Message Stream */}
            <div className="space-y-4 pt-2">
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((msg) => {
                  const isInternal = msg.visibility === 'internal';
                  const isAuthor = msg.sender_role === 'author';

                  if (isInternal) {
                    return (
                      <div key={msg.id} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950">
                        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-amber-200/60">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>INTERNAL NOTE — Strictly Confidential (Hidden from Author)</span>
                          </div>
                          <span className="text-[10px] text-amber-700">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAuthor ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl p-4 text-sm ${
                          isAuthor
                            ? 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                            : 'bg-brand-600 text-white rounded-tr-none shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-black/10">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {isAuthor ? (
                              <span>Author ({ticket.author?.full_name})</span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> BookLeaf Operations Specialist
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] ${isAuthor ? 'text-slate-400' : 'text-brand-100'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No responses sent yet. Use the composer below or generate an AI draft.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Tabbed Composer: Public Reply vs Internal Note */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('reply')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === 'reply'
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Send Public Reply to Author
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('note')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === 'note'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Add Internal Note (Admin Only)
                </button>
              </div>

              {activeTab === 'reply' ? (
                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    rows={5}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type official response to the author. You can also generate and customize an AI draft..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Sending will automatically update ticket status to In Progress.
                    </span>
                    <button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> {sending ? 'Dispatching...' : 'Send Response'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    rows={4}
                    required
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Record internal escalation, print shop follow-up, or finance notes (never shared with author)..."
                    className="w-full px-3.5 py-2.5 text-sm border border-amber-300 bg-amber-50/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-700">
                      Private ops note. Only visible to BookLeaf administrative staff.
                    </span>
                    <button
                      type="submit"
                      disabled={sending || !internalNote.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition shadow-xs disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" /> {sending ? 'Saving...' : 'Save Internal Note'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Operations Controls, AI Classification, RAG Excerpts & AI Draft Engine */}
        <div className="space-y-6">
          {/* Status & Assignment Controls */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Ticket Management
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Ticket Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Operations Specialist
              </label>
              <select
                value={assignedAdminId}
                onChange={(e) => handleAssignChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Unassigned</option>
                {admins.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.full_name} ({adm.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Auto-Classification & Priority Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" /> AI Classification Triage
              </h3>
              <button
                onClick={handleReclassifyAI}
                disabled={reclassifying}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${reclassifying ? 'animate-spin' : ''}`} />
                {reclassifying ? 'Retrying...' : 'Retry AI'}
              </button>
            </div>

            {!isEditingClassification ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Category:</span>
                  <CategoryBadge category={ticket.category} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Priority Score:</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                {ticket.ai_confidence && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">AI Confidence:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {Math.round(ticket.ai_confidence * 100)}%
                    </span>
                  </div>
                )}
                {ticket.ai_reason && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold block text-slate-700 mb-0.5">Decision Rationale:</span>
                    {ticket.ai_reason}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingClassification(true)}
                  className="w-full mt-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Override Category / Priority
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Override Category:
                  </label>
                  <select
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Royalty & Payments">Royalty & Payments</option>
                    <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
                    <option value="Printing & Quality">Printing & Quality</option>
                    <option value="Distribution & Availability">Distribution & Availability</option>
                    <option value="Book Status & Production Updates">Book Status & Production Updates</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Override Priority:
                  </label>
                  <select
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveClassificationOverride}
                    className="flex-1 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Save Override
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingClassification(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI-Drafted Response & BookLeaf Policy Engine */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Grounded AI Draft Generator
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Groq Direct
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Generates an empathetic response strictly grounded in BookLeaf's official publishing policies (80/20 royalty split, ₹1,000 threshold, 48h ISBN resolution, free reprints for verified defects).
            </p>

            <button
              type="button"
              onClick={handleGenerateAIDraft}
              disabled={generatingDraft}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-navy-950 hover:bg-slate-800 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {generatingDraft ? 'Consulting Policies & Drafting...' : 'Generate Grounded AI Draft'}
            </button>

            {aiDraftText && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Generated Draft:</span>
                  <span className="text-[10px] text-slate-400 font-mono">Model: {draftModel}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {aiDraftText}
                </div>
                <button
                  type="button"
                  onClick={handleApplyDraftToReply}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Insert Draft into Reply Composer
                </button>
              </div>
            )}

            {/* BookLeaf Policy Excerpts */}
            {retrievedExcerpts.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  BookLeaf Policy Context Applied:
                </span>
                <div className="space-y-2">
                  {retrievedExcerpts.map((chunk, idx) => (
                    <div key={chunk.id || idx} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 truncate max-w-[200px]">{chunk.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-brand-50 text-brand-700 border border-brand-200">
                          Official Policy
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-3">{chunk.content || 'Standard BookLeaf operational guideline applied.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
