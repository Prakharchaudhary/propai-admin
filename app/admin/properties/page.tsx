'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { propertiesApi } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-500/15 text-green-400 border-green-500/20',
  sold: 'bg-red-500/15 text-red-400 border-red-500/20',
  rented: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  draft: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [listingFilter, setListingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  function fetchProperties() {
    setLoading(true);
    const filters: any = {};
    if (typeFilter !== 'all') filters.propertyType = typeFilter;
    if (listingFilter !== 'all') filters.listingType = listingFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;
    propertiesApi.getAllAdmin(filters)
      .then(data => setProperties(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchProperties(); }, [typeFilter, listingFilter, statusFilter]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Archive "${title}"? It will be set to draft.`)) return;
    setDeleting(id);
    try {
      await propertiesApi.delete(id);
      setProperties(p => p.map(x => x._id === id ? { ...x, status: 'draft' } : x));
    } catch (e) { console.error(e); } finally { setDeleting(null); }
  }

  async function handleRestore(id: string) {
    try {
      await propertiesApi.restore(id);
      setProperties(p => p.map(x => x._id === id ? { ...x, status: 'active' } : x));
    } catch (e) { console.error(e); }
  }

  const filtered = properties.filter(p =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.locality?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Properties</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} properties</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Property
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search title, city, locality..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition">
          <option value="all">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="plot">Plot</option>
          <option value="commercial">Commercial</option>
        </select>
        <select value={listingFilter} onChange={e => setListingFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition">
          <option value="all">Sale & Rent</option>
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Archived</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-10 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-slate-600 text-4xl mb-3">🏠</div>
          <div className="text-slate-400 text-sm">No properties found</div>
          <Link href="/admin/properties/new" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm transition">Add your first property →</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(prop => (
            <div key={prop._id} className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition group">
              {/* Image */}
              <div className="relative h-44 bg-slate-800 overflow-hidden">
                {prop.images?.[0]?.url ? (
                  <img src={prop.images[0].url} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border capitalize ${STATUS_COLOR[prop.status] || STATUS_COLOR.draft}`}>
                    {prop.status === 'draft' ? 'Archived' : prop.status}
                  </span>
                  {prop.isFeatured && (
                    <span className="text-xs px-2.5 py-1 rounded-lg border bg-yellow-500/15 text-yellow-400 border-yellow-500/20">⭐ Featured</span>
                  )}
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="font-semibold text-white text-sm leading-snug mb-1 line-clamp-2">{prop.title}</div>
                <div className="text-slate-500 text-xs mb-3">{prop.locality ? `${prop.locality}, ` : ''}{prop.city}</div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-blue-400 font-bold text-sm">{prop.priceLabel || `₹${(prop.price / 100000).toFixed(1)}L`}</div>
                  <div className="text-slate-500 text-xs capitalize">{prop.configuration || prop.propertyType}</div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/properties/${prop._id}/edit`}
                    className="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-xs font-medium transition"
                  >
                    Edit
                  </Link>
                  {prop.status === 'draft' ? (
                    <button
                      onClick={() => handleRestore(prop._id)}
                      className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-400 text-xs transition"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(prop._id, prop.title)}
                      disabled={deleting === prop._id}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs transition disabled:opacity-50"
                    >
                      {deleting === prop._id ? '...' : 'Archive'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}