'use client';
import { useEffect, useState } from 'react';
import { leadsApi, propertiesApi } from '@/lib/api';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  site_visit: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  converted: 'bg-green-500/15 text-green-400 border-green-500/20',
  lost: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

function StatCard({ label, value, sub, icon, color }: any) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value ?? '—'}</div>
      <div className="text-slate-400 text-sm">{label}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      leadsApi.getStats(),
      leadsApi.getAll(),
      propertiesApi.getAll(),
    ]).then(([s, leads, props]) => {
      setStats(s);
      setRecentLeads(Array.isArray(leads) ? leads.slice(0, 8) : []);
      setProperties(Array.isArray(props) ? props : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const activeProps = properties.filter(p => p.status === 'active').length;
  const featuredProps = properties.filter(p => p.isFeatured).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Overview of your PropAI platform</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={loading ? '...' : stats?.total ?? 0}
          color="bg-blue-500/20"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <StatCard
          label="New Leads Today"
          value={loading ? '...' : stats?.today ?? 0}
          color="bg-green-500/20"
          icon={<svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>}
        />
        <StatCard
          label="Active Properties"
          value={loading ? '...' : activeProps}
          sub={`${featuredProps} featured`}
          color="bg-indigo-500/20"
          icon={<svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
        />
        <StatCard
          label="Converted"
          value={loading ? '...' : stats?.converted ?? 0}
          color="bg-emerald-500/20"
          icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-2xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Recent Leads</h2>
            <Link href="/admin/leads" className="text-blue-400 hover:text-blue-300 text-xs transition">View all →</Link>
          </div>
          <div className="divide-y divide-slate-800/70">
            {loading ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading...</div>
            ) : recentLeads.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">No leads yet</div>
            ) : recentLeads.map(lead => (
              <Link
                key={lead._id}
                href={`/admin/leads/${lead._id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 transition group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold shrink-0">
                  {lead.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium group-hover:text-blue-300 transition">{lead.name}</div>
                  <div className="text-slate-500 text-xs">{lead.phone} · {lead.source?.replace('_', ' ')}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg border capitalize ${STATUS_COLOR[lead.status] || STATUS_COLOR.new}`}>
                  {lead.status?.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/properties/new" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-blue-400 text-sm transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add New Property
              </Link>
              <Link href="/admin/leads" className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                View All Leads
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Platform Settings
              </Link>
            </div>
          </div>

          {/* Lead breakdown */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Lead Status</h2>
            <div className="space-y-2.5">
              {[
                { label: 'New', key: 'newLeads', color: 'bg-blue-500' },
                { label: 'Converted', key: 'converted', color: 'bg-green-500' },
              ].map(({ label, key, color }) => {
                const val = stats?.[key] ?? 0;
                const total = stats?.total || 1;
                const pct = Math.round((val / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium">{val}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
