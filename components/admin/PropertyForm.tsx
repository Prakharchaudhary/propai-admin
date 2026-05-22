'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { propertiesApi } from '@/lib/api';

const AMENITIES_LIST = ['Gym', 'Swimming Pool', 'Parking', 'Clubhouse', 'Security', 'Lift', 'Power Backup', 'Garden', 'Play Area', 'CCTV', 'Intercom', 'Rainwater Harvesting'];

interface Props {
  initial?: any;
  propertyId?: string;
}

export default function PropertyForm({ initial, propertyId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    propertyType: initial?.propertyType || 'apartment',
    listingType: initial?.listingType || 'sale',
    status: initial?.status || 'active',
    configuration: initial?.configuration || '',
    bedrooms: initial?.bedrooms || '',
    bathrooms: initial?.bathrooms || '',
    area: initial?.area || '',
    price: initial?.price || '',
    priceLabel: initial?.priceLabel || '',
    city: initial?.city || '',
    locality: initial?.locality || '',
    address: initial?.address || '',
    lat: initial?.lat || '',
    lng: initial?.lng || '',
    reraNumber: initial?.reraNumber || '',
    isFeatured: initial?.isFeatured || false,
    amenities: initial?.amenities || [],
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    initial?.images?.map((img: any) => img.url) || []
  );
  const [existingImages, setExistingImages] = useState<any[]>(initial?.images || []);

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x: string) => x !== a)
        : [...f.amenities, a],
    }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setNewFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  async function removeExistingImage(img: any) {
    if (!propertyId) return;
    try {
      await propertiesApi.deleteImage(propertyId, img.publicId);
      setExistingImages(prev => prev.filter(i => i.publicId !== img.publicId));
      setPreviews(prev => prev.filter(p => p !== img.url));
    } catch (e) { console.error(e); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'amenities') {
          fd.append(k, (v as string[]).join(','));
        } else {
          fd.append(k, String(v));
        }
      });
      newFiles.forEach(f => fd.append('images', f));

      if (propertyId) {
        await propertiesApi.update(propertyId, fd);
      } else {
        await propertiesApi.create(fd);
      }
      router.push('/admin/properties');
    } catch (err: any) {
      setError(err.message || 'Failed to save property');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition";
  const labelCls = "text-slate-400 text-xs mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

      {/* Basic Info */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Property Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Spacious 3BHK Apartment in Sector 62, Noida" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={4} placeholder="Describe the property..." className={`${inputCls} resize-none`} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Property Type *</label>
              <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={inputCls}>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Listing Type *</label>
              <select value={form.listingType} onChange={e => set('listingType', e.target.value)} className={inputCls}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Property Details</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Configuration</label>
            <input value={form.configuration} onChange={e => set('configuration', e.target.value)} placeholder="e.g. 3BHK" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Bedrooms</label>
            <input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="3" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Bathrooms</label>
            <input type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="2" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Area (sq.ft)</label>
            <input type="number" value={form.area} onChange={e => set('area', e.target.value)} placeholder="1200" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Pricing</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Price (INR) *</label>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="8500000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Price Label</label>
            <input value={form.priceLabel} onChange={e => set('priceLabel', e.target.value)} placeholder="₹85 Lakh" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>RERA Number</label>
            <input value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} placeholder="UP/RERA/..." className={inputCls} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Location</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>City *</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} required placeholder="Noida" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Locality</label>
            <input value={form.locality} onChange={e => set('locality', e.target.value)} placeholder="Sector 62" className={inputCls} />
          </div>
        </div>
        <div className="mb-4">
          <label className={labelCls}>Full Address</label>
          <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address with landmark" className={inputCls} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Latitude (for AI locality)</label>
            <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="28.6139" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Longitude (for AI locality)</label>
            <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="77.2090" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {AMENITIES_LIST.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-3.5 py-1.5 rounded-xl text-sm border transition ${
                form.amenities.includes(a)
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Property Images</h2>
        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <div className="text-slate-500 text-xs mb-3">Current Images</div>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-700" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* New file previews */}
        {newFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {newFiles.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="" className="w-20 h-20 object-cover rounded-xl border border-blue-500/30" />
                <button
                  type="button"
                  onClick={() => { setNewFiles(p => p.filter((_, j) => j !== i)); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-xl text-slate-400 text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Upload Images
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {/* Featured */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set('isFeatured', !form.isFeatured)}
            className={`w-11 h-6 rounded-full border transition-all duration-200 relative ${form.isFeatured ? 'bg-blue-600 border-blue-600' : 'bg-slate-700 border-slate-600'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${form.isFeatured ? 'left-5' : 'left-0.5'}`} />
          </div>
          <div>
            <div className="text-white text-sm font-medium">Featured Property</div>
            <div className="text-slate-500 text-xs">Show this property prominently on the homepage</div>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : propertyId ? 'Update Property' : 'Create Property'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/properties')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
