'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi } from '@/lib/api';

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'site_visit', 'converted', 'lost'];
const SOURCES = ['all', 'website_form', 'chatbot', 'voice', 'whatsapp', 'referral'];

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  site_visit: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  converted: 'bg-green-500/15 text-green-400 border-green-500/20',
  lost: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (sourceFilter !== 'all') filters.source = sourceFilter;
    leadsApi.getAll(filters)
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, sourceFilter]);

  const filtered = leads.filter(l =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  function exportCSV() {
    const rows = [
      ['Name', 'Phone', 'Email', 'Source', 'Status', 'Priority', 'Date'],
      ...filtered.map(l => [l.name, l.phone, l.email || '', l.source, l.status, l.priority, formatDate(l.createdAt)]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'propai-leads.csv';
    a.click();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Leads</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} leads found</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          {SOURCES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-500 text-xs font-medium px-5 py-3.5 uppercase tracking-wider">Lead</th>
                <th className="text-left text-slate-500 text-xs font-medium px-4 py-3.5 uppercase tracking-wider hidden md:table-cell">Source</th>
                <th className="text-left text-slate-500 text-xs font-medium px-4 py-3.5 uppercase tracking-wider">Status</th>
                <th className="text-left text-slate-500 text-xs font-medium px-4 py-3.5 uppercase tracking-wider hidden lg:table-cell">Priority</th>
                <th className="text-left text-slate-500 text-xs font-medium px-4 py-3.5 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="text-center text-slate-500 py-10 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-500 py-10 text-sm">No leads found</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead._id} className="hover:bg-slate-800/20 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">
                        {lead.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{lead.name}</div>
                        <div className="text-slate-500 text-xs">{lead.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-slate-400 text-sm capitalize">{lead.source?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border capitalize ${STATUS_COLOR[lead.status] || STATUS_COLOR.new}`}>
                      {lead.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className={`text-xs capitalize font-medium ${PRIORITY_COLOR[lead.priority] || 'text-slate-400'}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell text-slate-500 text-xs">
                    {lead.createdAt ? formatDate(lead.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/leads/${lead._id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs transition"
                    >
                      View →
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
}
