import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { UserProfile } from '../../types';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { Users, Search, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';

export const AuthorCatalog: React.FC = () => {
  const [authors, setAuthors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        const data = await api.getAdminAuthors();
        setAuthors(data);
      } catch (err) {
        console.error('Failed to load authors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  const filtered = authors.filter(
    (a) =>
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.city && a.city.toLowerCase().includes(search.toLowerCase())) ||
      (a.author_code && a.author_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">BookLeaf Author Catalog</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registered author directory, accounts, and contact profiles from official publishing records.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-xs">
          Total Authors: <span className="font-bold text-slate-900">{authors.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search author by name, email, city, or author ID (e.g. AUTH001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Authors Grid */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No authors found"
          description="Try adjusting your search criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((author) => (
            <div
              key={author.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm">
                  {author.full_name.charAt(0)}
                </div>
                {author.author_code && (
                  <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {author.author_code}
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-slate-900">{author.full_name}</h2>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2 text-slate-600 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{author.email}</span>
                </div>
                {author.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{author.phone}</span>
                  </div>
                )}
                {author.city && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{author.city}</span>
                  </div>
                )}
                {author.created_at && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Joined: {new Date(author.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
