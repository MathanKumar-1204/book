import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Book } from '../../types';
import {
  LifeBuoy,
  BookOpen,
  Send,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Bot,
  MessageSquare,
  FileText,
  Copy,
  ChevronRight,
  HelpCircle,
  CornerDownLeft
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'author' | 'ai';
  text: string;
  suggestedDraft?: {
    subject: string;
    description: string;
  } | null;
}

export const SubmitTicket: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeMode, setActiveMode] = useState<'clarifier' | 'form'>('form');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftAppliedNotice, setDraftAppliedNotice] = useState<string | null>(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am BookLeaf's AI Publishing Assistant. You can describe any issue—royalties, ISBN discrepancies, print quality defects, or Amazon/Flipkart availability—and I will clarify our policies and prepare a structured ticket for operations.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoadingBooks(true);
        const data = await api.getAuthorBooks();
        setBooks(data);

        // Pre-select book if passed via route state
        const stateBookId = (location.state as any)?.bookId;
        if (stateBookId) {
          setSelectedBookId(stateBookId);
        }
      } catch (err) {
        console.error('Failed to load author books:', err);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [location.state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Attachment file size must be less than 5MB.');
        return;
      }
      setFileName(file.name);
      setError(null);
    }
  };

  const parseSuggestedDraft = (text: string) => {
    const subjectMatch = text.match(/\*\*Suggested Ticket Subject:\*\*\s*(.*)/i);
    const descMatch = text.match(/\*\*Suggested Ticket Description:\*\*\s*([\s\S]*?)(?:---|$)/i);
    if (subjectMatch && descMatch) {
      return {
        subject: subjectMatch[1].trim(),
        description: descMatch[1].trim(),
      };
    }
    return null;
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const messageToSend = (presetText || chatInput).trim();
    if (!messageToSend || chatLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'author',
      text: messageToSend,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await api.clarifyTicketInquiry(
        messageToSend,
        selectedBookId || null,
        history
      );

      const draft = parseSuggestedDraft(res.response);

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.response,
        suggestedDraft: draft,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: "I'm having trouble connecting to the BookLeaf AI policy service right now. You can switch to the direct form tab anytime to submit your ticket.",
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApplyDraft = (draft: { subject: string; description: string }) => {
    setSubject(draft.subject);
    setDescription(draft.description);
    setActiveMode('form');
    setDraftAppliedNotice('✓ AI-drafted subject and description applied below. Review and click submit!');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (subject.trim().length < 3) {
      setError('Please provide a subject line with at least 3 characters.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide a detailed description with at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: subject.trim(),
        description: description.trim(),
        book_id: selectedBookId || null,
      };

      const created = await api.createAuthorTicket(payload);
      navigate(`/author/tickets/${created.id}`, {
        state: { newTicketCreated: true },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <Link
          to="/author/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Tickets
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Author Support Portal</h1>
            <p className="mt-1 text-sm text-slate-500">
              Clarify publishing policies or submit a ticket directly to BookLeaf's operations team.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode('form')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeMode === 'form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Direct Ticket Form
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('clarifier')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeMode === 'clarifier'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-brand-600" />
              AI Assistant Clarifier
            </button>
          </div>
        </div>
      </div>

      {/* Book Context Selector Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <BookOpen className="w-4 h-4 text-brand-600 shrink-0" />
          <span className="font-semibold text-slate-900">Context Book:</span>
          <span className="text-slate-500">Select which book this inquiry relates to (optional):</span>
        </div>
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          disabled={loadingBooks || submitting}
          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">General Account (No Book Selected)</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} {b.isbn ? `(${b.isbn})` : ''} — [{b.status}]
            </option>
          ))}
        </select>
      </div>

      {draftAppliedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{draftAppliedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDraftAppliedNotice(null)}
            className="text-[11px] underline font-medium hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: AI QUERY CLARIFIER CHATBOT */}
      {activeMode === 'clarifier' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">BookLeaf AI Assistant & Clarifier</h3>
                <p className="text-[11px] text-slate-500">Ask policy questions, check timelines, or generate ticket drafts</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
              Groq Powered
            </span>
          </div>

          {/* Quick Policy Chips */}
          <div className="px-5 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Quick Topics:</span>
            <button
              type="button"
              onClick={() => handleSendChatMessage("How are royalties calculated and when is the 80/20 payout disbursed?")}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition"
            >
              💰 Royalty 80/20 & ₹1,000 Threshold
            </button>
            <button
              type="button"
              onClick={() => handleSendChatMessage("My book is showing 'Currently Unavailable' on Amazon / Flipkart. How can we fix this?")}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition"
            >
              📚 Amazon/Flipkart Out of Stock
            </button>
            <button
              type="button"
              onClick={() => handleSendChatMessage("I received author copies with printing defects (misprinted pages/binding). What is the free reprint procedure?")}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition"
            >
              📦 Defective Copies & Free Reprint
            </button>
            <button
              type="button"
              onClick={() => handleSendChatMessage("There is an ISBN error on retail platforms (wrong book or barcode). How do I report it?")}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition"
            >
              🏷️ ISBN Error Escalation
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.sender === 'author' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                    m.sender === 'author'
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Render Suggested Draft Action Card if provided */}
                  {m.suggestedDraft && (
                    <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3 rounded-xl shadow-xs space-y-2 text-slate-900">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Suggested Ticket Draft
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyDraft(m.suggestedDraft!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[11px] rounded-lg transition shadow-xs"
                        >
                          <Copy className="w-3 h-3" /> Apply to Ticket Form
                        </button>
                      </div>
                      <div className="text-[11px]">
                        <span className="font-semibold text-slate-500">Subject: </span>
                        <span className="font-bold text-slate-800">{m.suggestedDraft.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono line-clamp-3">
                        {m.suggestedDraft.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
                  Consulting BookLeaf policy knowledge base...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Composer Footer */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              placeholder="Ask a policy question or describe what happened..."
              disabled={chatLoading}
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => handleSendChatMessage()}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT TICKET FORM */}
      {activeMode === 'form' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Subject Line *
                </label>
                <button
                  type="button"
                  onClick={() => setActiveMode('clarifier')}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Need help phrasing? Ask AI
                </button>
              </div>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={submitting}
                placeholder="e.g. Unpaid royalties for Q3 or Print quality defect in author copies"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                placeholder="Please explain your question or issue in detail. Include any relevant dates, copy quantities, platform names, or order numbers..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                <span>Minimum 10 characters</span>
                <span>{description.length} characters</span>
              </div>
            </div>

            {/* Optional Attachment */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                File Attachment (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  Choose File (PDF, PNG, JPG)
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    disabled={submitting}
                  />
                </label>
                {fileName && (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {fileName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Recommended for print defect verification (photos) or payment statements (max 5MB).
              </p>
            </div>

            {/* Submit Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/author/tickets')}
                disabled={submitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting & Classifying...' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
