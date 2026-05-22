'use client';
import { useEffect, useState, useRef } from 'react';
import { settingsApi } from '@/lib/api';

type Tab = 'brand' | 'contact' | 'ai' | 'seo' | 'banners';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('brand');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const bannerImgRef = useRef<HTMLInputElement>(null);

  // Banner form state
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', ctaText: '', ctaLink: '' });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [addingBanner, setAddingBanner] = useState(false);

  useEffect(() => {
    settingsApi.get()
      .then(data => setSettings(data?.data || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function setField(path: string, value: any) {
    setSettings((prev: any) => {
      const updated = { ...prev };
      const keys = path.split('.');
      let cur = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await settingsApi.update({
        dealerName: settings.dealerName,
        tagline: settings.tagline,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        contact: settings.contact,
        social: settings.social,
        seo: settings.seo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await settingsApi.uploadLogo(file);
    setSettings((s: any) => ({ ...s, logo: res.data?.logo || s.logo }));
  }

  async function handleFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await settingsApi.uploadFavicon(file);
    setSettings((s: any) => ({ ...s, favicon: res.data?.favicon || s.favicon }));
  }

  async function handleAddBanner() {
    setAddingBanner(true);
    try {
      await settingsApi.addBanner(bannerForm, bannerFile || undefined);
      const updated = await settingsApi.get();
      setSettings(updated?.data || updated);
      setBannerForm({ title: '', subtitle: '', ctaText: '', ctaLink: '' });
      setBannerFile(null);
    } catch (e) { console.error(e); } finally { setAddingBanner(false); }
  }

  async function handleDeleteBanner(id: string) {
    if (!confirm('Delete this banner?')) return;
    await settingsApi.deleteBanner(id);
    setSettings((s: any) => ({ ...s, banners: s.banners.filter((b: any) => b._id !== id) }));
  }

  if (loading) return <div className="text-slate-500 text-sm py-10 text-center">Loading settings...</div>;
  if (!settings) return <div className="text-slate-500 text-sm py-10 text-center">Could not load settings</div>;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'brand', label: 'Brand & Theme' },
    { key: 'contact', label: 'Contact' },
    { key: 'seo', label: 'SEO' },
    { key: 'banners', label: 'Banners' },
  ];

  const inputCls = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition";
  const labelCls = "text-slate-400 text-xs mb-1.5 block";

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure your PropAI platform</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60"
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#111827] border border-slate-800 rounded-xl p-1.5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Brand */}
      {tab === 'brand' && (
        <div className="space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-5">Brand Identity</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Dealer / Agency Name</label>
                <input value={settings.dealerName || ''} onChange={e => setField('dealerName', e.target.value)} placeholder="PropAI Realty" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tagline</label>
                <input value={settings.tagline || ''} onChange={e => setField('tagline', e.target.value)} placeholder="Your Dream Home Awaits" className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.primaryColor || '#1a2f5a'} onChange={e => setField('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" />
                    <input value={settings.primaryColor || ''} onChange={e => setField('primaryColor', e.target.value)} placeholder="#1a2f5a" className={`${inputCls} flex-1`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.secondaryColor || '#2563eb'} onChange={e => setField('secondaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" />
                    <input value={settings.secondaryColor || ''} onChange={e => setField('secondaryColor', e.target.value)} placeholder="#2563eb" className={`${inputCls} flex-1`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Favicon */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-5">Logo & Favicon</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Logo</label>
                {settings.logo?.url && (
                  <img src={settings.logo.url} alt="Logo" className="h-12 mb-3 object-contain rounded-lg border border-slate-700 bg-slate-800 p-2" />
                )}
                <button type="button" onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  Upload Logo
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </div>
              <div>
                <label className={labelCls}>Favicon</label>
                {settings.favicon?.url && (
                  <img src={settings.favicon.url} alt="Favicon" className="h-10 w-10 mb-3 object-contain rounded-lg border border-slate-700 bg-slate-800 p-1" />
                )}
                <button type="button" onClick={() => faviconRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  Upload Favicon
                </button>
                <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={handleFavicon} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      {tab === 'contact' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold mb-1">Contact Information</h2>
          {[
            { label: 'Phone', key: 'contact.phone', placeholder: '+91 98765 43210' },
            { label: 'WhatsApp Number', key: 'contact.whatsapp', placeholder: '919876543210' },
            { label: 'Email', key: 'contact.email', placeholder: 'hello@propai.in' },
            { label: 'Office Address', key: 'contact.address', placeholder: 'Plot 12, Sector 18, Noida' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                value={key.split('.').reduce((o: any, k) => o?.[k], settings) || ''}
                onChange={e => setField(key, e.target.value)}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-white text-sm font-medium mb-4">Social Media</div>
            {[
              { label: 'Facebook', key: 'social.facebook', placeholder: 'https://facebook.com/...' },
              { label: 'Instagram', key: 'social.instagram', placeholder: 'https://instagram.com/...' },
              { label: 'YouTube', key: 'social.youtube', placeholder: 'https://youtube.com/...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="mb-4">
                <label className={labelCls}>{label}</label>
                <input
                  value={key.split('.').reduce((o: any, k) => o?.[k], settings) || ''}
                  onChange={e => setField(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold mb-1">SEO Configuration</h2>
          {[
            { label: 'Site Title', key: 'seo.metaTitle', placeholder: 'PropAI – Premium Properties in Noida' },
            { label: 'Meta Description', key: 'seo.metaDescription', placeholder: 'AI-powered real estate platform...' },
            { label: 'Google Analytics ID', key: 'seo.googleAnalyticsId', placeholder: 'G-XXXXXXXXXX' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                value={key.split('.').reduce((o: any, k) => o?.[k], settings) || ''}
                onChange={e => setField(key, e.target.value)}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      )}

      {/* Banners */}
      {tab === 'banners' && (
        <div className="space-y-5">
          {/* Existing banners */}
          {settings.banners?.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">Active Banners ({settings.banners.length})</h2>
              <div className="space-y-3">
                {settings.banners.map((banner: any) => (
                  <div key={banner._id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700">
                    {banner.image?.url && (
                      <img src={banner.image.url} alt="" className="w-16 h-10 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{banner.title || 'Untitled'}</div>
                      <div className="text-slate-500 text-xs">{banner.subtitle}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(banner._id)}
                      className="text-red-400 hover:text-red-300 text-xs transition"
                    >Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add banner */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Add Banner</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Banner Image</label>
                <button type="button" onClick={() => bannerImgRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  {bannerFile ? bannerFile.name : 'Choose Image'}
                </button>
                <input ref={bannerImgRef} type="file" accept="image/*" className="hidden" onChange={e => setBannerFile(e.target.files?.[0] || null)} />
              </div>
              {[
                { label: 'Title', key: 'title', placeholder: 'Luxury 3BHK Now Available' },
                { label: 'Subtitle', key: 'subtitle', placeholder: 'Starting from ₹85 Lakh' },
                { label: 'CTA Button Text', key: 'ctaText', placeholder: 'View Properties' },
                { label: 'CTA Link', key: 'ctaLink', placeholder: '/properties' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    value={(bannerForm as any)[key]}
                    onChange={e => setBannerForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
              <button
                onClick={handleAddBanner}
                disabled={addingBanner}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60"
              >
                {addingBanner ? 'Adding...' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
