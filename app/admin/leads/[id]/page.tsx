'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { leadsApi, chatApi } from '@/lib/api';

const STATUSES = ['new', 'contacted', 'qualified', 'site_visit', 'converted', 'lost'];
const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  site_visit: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  converted: 'bg-green-500/15 text-green-400 border-green-500/20',
  lost: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LeadDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    leadsApi.getById(id).then(data => {
      setLead(data);
      setStatus(data.status || 'new');
      setNotes(data.notes || '');
      setFollowUpDate(data.followUpDate ? data.followUpDate.slice(0, 10) : '');
      if (data.sessionId) {
        chatApi.getSession(data.sessionId).then(setConversation).catch(() => {});
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      await leadsApi.updateStatus(id, status, notes);
      if (followUpDate) {
        await leadsApi.update(id, { followUpDate });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-500 text-sm py-10 text-center">Loading...</div>;
  if (!lead) return <div className="text-slate-500 text-sm py-10 text-center">Lead not found</div>;

  const intent = lead.intent;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-slate-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-white text-xl font-bold">{lead.name}</h1>
          <p className="text-slate-400 text-sm">{lead.phone} · Added {formatDate(lead.createdAt)}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${STATUS_COLOR[lead.status] || STATUS_COLOR.new}`}>
          {lead.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Lead Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Name', value: lead.name },
                { label: 'Phone', value: lead.phone },
                { label: 'Email', value: lead.email || '—' },
                { label: 'Source', value: lead.source?.replace('_', ' ') },
                { label: 'Priority', value: lead.priority },
                { label: 'Property', value: lead.propertyTitle || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-slate-500 text-xs mb-0.5">{label}</div>
                  <div className="text-white capitalize">{value}</div>
                </div>
              ))}
            </div>
            {lead.message && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-slate-500 text-xs mb-1.5">Message</div>
                <p className="text-slate-300 text-sm leading-relaxed">{lead.message}</p>
              </div>
            )}
          </div>

          {/* AI Intent */}
          {intent && Object.keys(intent).length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                </div>
                <h2 className="text-white font-semibold">AI Extracted Intent</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {intent.propertyType && <div className="bg-slate-800/40 rounded-xl px-3 py-2.5"><div className="text-slate-500 text-xs mb-0.5">Property Type</div><div className="text-slate-200 text-sm capitalize">{intent.propertyType}</div></div>}
                {intent.configuration && <div className="bg-slate-800/40 rounded-xl px-3 py-2.5"><div className="text-slate-500 text-xs mb-0.5">Configuration</div><div className="text-slate-200 text-sm">{intent.configuration}</div></div>}
                {intent.location && <div className="bg-slate-800/40 rounded-xl px-3 py-2.5"><div className="text-slate-500 text-xs mb-0.5">Location</div><div className="text-slate-200 text-sm">{intent.location}</div></div>}
                {intent.purpose && <div className="bg-slate-800/40 rounded-xl px-3 py-2.5"><div className="text-slate-500 text-xs mb-0.5">Purpose</div><div className="text-slate-200 text-sm capitalize">{intent.purpose}</div></div>}
                {intent.urgency && <div className="bg-slate-800/40 rounded-xl px-3 py-2.5"><div className="text-slate-500 text-xs mb-0.5">Urgency</div><div className="text-slate-200 text-sm capitalize">{intent.urgency}</div></div>}
                {intent.budget && (intent.budget.min || intent.budget.max) && (
                  <div className="bg-slate-800/40 rounded-xl px-3 py-2.5">
                    <div className="text-slate-500 text-xs mb-0.5">Budget</div>
                    <div className="text-slate-200 text-sm">
                      {intent.budget.min ? `₹${(intent.budget.min / 100000).toFixed(0)}L` : ''}
                      {intent.budget.min && intent.budget.max ? ' – ' : ''}
                      {intent.budget.max ? `₹${(intent.budget.max / 100000).toFixed(0)}L` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation */}
          {conversation?.messages?.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">Chat Conversation</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {conversation.messages.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600/20 text-blue-100 rounded-tr-sm'
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Update Lead</h2>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-2 block">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-2 block">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-2 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this lead..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-60"
              >
                {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* WhatsApp quick link */}
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-medium py-3 rounded-xl text-sm transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Open WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
