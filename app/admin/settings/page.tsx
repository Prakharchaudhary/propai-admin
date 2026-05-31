'use client';
import { useEffect, useState, useRef } from 'react';
import { settingsApi } from '@/lib/api';

type Tab = 'brand' | 'theme' | 'banners' | 'contact' | 'seo';

const PRESETS = [
  { label: 'Gold (Default)', accent: '#e4b363', bg: '#0a1120', card: '#162440' },
  { label: 'Royal Blue',     accent: '#3b82f6', bg: '#0d1117', card: '#161b22' },
  { label: 'Emerald',        accent: '#10b981', bg: '#0a1a12', card: '#0f2318' },
  { label: 'Rose',           accent: '#f43f5e', bg: '#120a0f', card: '#1e1015' },
  { label: 'Violet',         accent: '#8b5cf6', bg: '#0e0a1a', card: '#160f2a' },
  { label: 'Orange',         accent: '#f97316', bg: '#120d08', card: '#1e140c' },
  { label: 'Cyan',           accent: '#06b6d4', bg: '#040f14', card: '#081820' },
  { label: 'Pearl',          accent: '#f8f0e3', bg: '#0a0806', card: '#160f08' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('brand');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const bannerImgRef = useRef<HTMLInputElement>(null);

  const emptyBanner = {
    title: '', subtitle: '', badge: '',
    ctaText: 'Explore Properties', ctaLink: '/properties',
    ctaSecondaryText: '', ctaSecondaryLink: '',
    mediaType: 'image', videoUrl: '', overlayOpacity: 50,
  };
  const [bannerForm, setBannerForm] = useState({ ...emptyBanner });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [addingBanner, setAddingBanner] = useState(false);
  const [bannerError, setBannerError] = useState('');

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

  function applyPreset(p: typeof PRESETS[0]) {
    setSettings((s: any) => ({ ...s, accentColor: p.accent, bgColor: p.bg, cardColor: p.card }));
  }

  // ── THE FIX: now saves accentColor, bgColor, cardColor ──────────────────
  async function handleSave() {
    setSaving(true); setSaveError('');
    try {
      await settingsApi.update({
        dealerName:     settings.dealerName,
        tagline:        settings.tagline,
        accentColor:    settings.accentColor,   // ← was missing
        bgColor:        settings.bgColor,       // ← was missing
        cardColor:      settings.cardColor,     // ← was missing
        primaryColor:   settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        bannerInterval: settings.bannerInterval,
        contact:        settings.contact,
        social:         settings.social,
        seo:            settings.seo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const res = await settingsApi.uploadLogo(file);
    setSettings((s: any) => ({ ...s, logo: res.data?.logo || res?.logo || s.logo }));
  }

  async function handleFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const res = await settingsApi.uploadFavicon(file);
    setSettings((s: any) => ({ ...s, favicon: res.data?.favicon || res?.favicon || s.favicon }));
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setBannerFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = ev => setBannerPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else setBannerPreview(null);
  }

  async function handleAddBanner() {
    setBannerError('');
    if (bannerForm.mediaType === 'image' && !bannerFile) {
      setBannerError('Please select an image file.'); return;
    }
    if ((bannerForm.mediaType === 'video' || bannerForm.mediaType === 'youtube') && !bannerForm.videoUrl) {
      setBannerError('Please enter a video URL.'); return;
    }
    setAddingBanner(true);
    try {
      await settingsApi.addBanner(bannerForm, bannerFile || undefined);
      const updated = await settingsApi.get();
      setSettings(updated?.data || updated);
      setBannerForm({ ...emptyBanner });
      setBannerFile(null); setBannerPreview(null);
    } catch (e: any) { setBannerError(e.message || 'Failed to add banner'); }
    finally { setAddingBanner(false); }
  }

  async function handleDeleteBanner(id: string) {
    if (!id || id === "undefined") { alert("Cannot delete: banner has no ID. Try refreshing."); return; }
    if (!confirm('Delete this banner?')) return;
    await settingsApi.deleteBanner(id);
    setSettings((s: any) => ({ ...s, banners: s.banners.filter((b: any) => (b._id ?? b.id) !== id) }));
  }

  async function moveBanner(idx: number, dir: -1 | 1) {
    const banners = [...(settings.banners || [])];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= banners.length) return;
    [banners[idx], banners[newIdx]] = [banners[newIdx], banners[idx]];
    setSettings((s: any) => ({ ...s, banners }));
    try {
      await settingsApi.updateBannerOrder(banners.map((b: any, i: number) => ({ id: b._id ?? b.id, order: i })));
    } catch (_) {}
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!settings) return <div className="text-slate-500 text-sm py-10 text-center">Could not load settings.</div>;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'brand',   label: 'Brand',   icon: '🏷' },
    { key: 'theme',   label: 'Theme',   icon: '🎨' },
    { key: 'banners', label: 'Banners', icon: '🖼' },
    { key: 'contact', label: 'Contact', icon: '📞' },
    { key: 'seo',     label: 'SEO',     icon: '🔍' },
  ];

  const inp = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition";
  const lbl = "text-slate-400 text-xs mb-1.5 block";

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure your PropAI platform</p>
        </div>
        <div className="flex items-center gap-3">
          {saveError && <span className="text-red-400 text-xs">{saveError}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60 flex items-center gap-2">
            {saved ? '✓ Saved' : saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111827] border border-slate-800 rounded-xl p-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 flex-1 min-w-max px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── BRAND ──────────────────────────────────────────────────────────── */}
      {tab === 'brand' && (
        <div className="space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-semibold">Brand Identity</h2>
            <div>
              <label className={lbl}>Dealer / Agency Name</label>
              <input value={settings.dealerName || ''} onChange={e => setField('dealerName', e.target.value)} placeholder="PropAI Realty" className={inp} />
            </div>
            <div>
              <label className={lbl}>Tagline</label>
              <input value={settings.tagline || ''} onChange={e => setField('tagline', e.target.value)} placeholder="Your Dream Home Awaits" className={inp} />
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-5">Logo & Favicon</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className={lbl}>Logo</label>
                {settings.logo?.url && (
                  <div className="mb-3 p-3 bg-slate-800 rounded-xl border border-slate-700 inline-block">
                    <img src={settings.logo.url} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                  ↑ Upload Logo
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </div>
              <div>
                <label className={lbl}>Favicon</label>
                {settings.favicon?.url && (
                  <div className="mb-3 p-2 bg-slate-800 rounded-lg border border-slate-700 inline-block">
                    <img src={settings.favicon.url} alt="Favicon" className="h-8 w-8 object-contain" />
                  </div>
                )}
                <button type="button" onClick={() => faviconRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                  ↑ Upload Favicon
                </button>
                <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={handleFavicon} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── THEME ──────────────────────────────────────────────────────────── */}
      {tab === 'theme' && (
        <div className="space-y-5">
          {/* Presets */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Quick Presets</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700 hover:border-slate-500 transition-all"
                  style={{
                    background: p.bg,
                    outline: settings.accentColor === p.accent ? `2px solid ${p.accent}` : 'none',
                  }}>
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: p.bg }} />
                    <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: p.accent }} />
                    <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: p.card }} />
                  </div>
                  <span className="text-slate-300 text-xs font-medium">{p.label}</span>
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-3">Click a preset then hit <strong className="text-slate-400">Save Changes</strong> to apply.</p>
          </div>

          {/* Custom */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-5">
            <h2 className="text-white font-semibold">Custom Colors</h2>

            {/* Live preview */}
            <div className="rounded-xl p-4 border flex items-center justify-between"
              style={{ background: settings.bgColor || '#0a1120', borderColor: `${settings.accentColor || '#e4b363'}33` }}>
              <span className="text-sm font-medium" style={{ color: settings.accentColor || '#e4b363' }}>
                Live Preview — {settings.dealerName || 'PropAI'}
              </span>
              <div className="px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ background: settings.accentColor || '#e4b363', color: settings.bgColor || '#0a1120' }}>
                Button
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Accent Color', key: 'accentColor', placeholder: '#e4b363', hint: 'Buttons, highlights, gold' },
                { label: 'Background',   key: 'bgColor',     placeholder: '#0a1120', hint: 'Page & hero background' },
                { label: 'Card Color',   key: 'cardColor',   placeholder: '#162440', hint: 'Glass cards & panels' },
              ].map(({ label, key, placeholder, hint }) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  <div className="flex gap-2">
                    <input type="color"
                      value={settings[key] || placeholder}
                      onChange={e => setField(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer shrink-0" />
                    <input value={settings[key] || ''}
                      onChange={e => setField(key, e.target.value)}
                      placeholder={placeholder}
                      className={`${inp} flex-1`} />
                  </div>
                  <p className="text-slate-600 text-xs mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BANNERS ────────────────────────────────────────────────────────── */}
      {tab === 'banners' && (
        <div className="space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Slider Settings</h2>
            <div>
              <label className={lbl}>Auto-advance interval (ms) — 0 to disable</label>
              <input type="number" min={0} step={500}
                value={settings.bannerInterval ?? 5000}
                onChange={e => setField('bannerInterval', Number(e.target.value))}
                className={inp} />
            </div>
          </div>

          {(settings.banners || []).length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">
                Active Banners <span className="text-slate-500 text-sm font-normal">({settings.banners.length})</span>
              </h2>
              <div className="space-y-3">
                {settings.banners.map((banner: any, idx: number) => (
                  <div key={banner._id ?? banner.id ?? idx} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700">
                    <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-700 flex items-center justify-center">
                      {banner.image?.url
                        ? <img src={banner.image.url} alt="" className="w-full h-full object-cover" />
                        : banner.videoUrl ? <div className="text-2xl">🎬</div>
                        : <div className="text-slate-600 text-xs text-center">No media</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{banner.title || 'Untitled'}</div>
                      <div className="text-slate-500 text-xs truncate">{banner.subtitle}</div>
                      <div className="text-slate-600 text-xs mt-0.5 capitalize">{banner.mediaType || 'image'}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => moveBanner(idx, -1)} disabled={idx === 0}
                        className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 disabled:opacity-30 transition text-xs">▲</button>
                      <button onClick={() => moveBanner(idx, 1)} disabled={idx === settings.banners.length - 1}
                        className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 disabled:opacity-30 transition text-xs">▼</button>
                      <button onClick={() => handleDeleteBanner(banner._id ?? banner.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-5">Add New Banner / Slide</h2>
            {bannerError && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{bannerError}</div>}
            <div className="space-y-4">
              {/* Media type selector */}
              <div>
                <label className={lbl}>Media Type</label>
                <div className="flex gap-2">
                  {[{ value: 'image', label: '🖼 Image' }, { value: 'video', label: '🎬 Video URL' }, { value: 'youtube', label: '▶ YouTube' }].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setBannerForm(f => ({ ...f, mediaType: opt.value }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${
                        bannerForm.mediaType === opt.value
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {bannerForm.mediaType === 'image' && (
                <div>
                  <label className={lbl}>Banner Image</label>
                  <button type="button" onClick={() => bannerImgRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm transition">
                    {bannerFile ? bannerFile.name : '+ Choose Image'}
                  </button>
                  <input ref={bannerImgRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                  {bannerPreview && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700">
                      <img src={bannerPreview} alt="Preview" className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>
              )}

              {(bannerForm.mediaType === 'video' || bannerForm.mediaType === 'youtube') && (
                <div>
                  <label className={lbl}>
                    {bannerForm.mediaType === 'youtube' ? 'YouTube URL' : 'Video URL (.mp4)'}
                  </label>
                  <input value={bannerForm.videoUrl}
                    onChange={e => setBannerForm(f => ({ ...f, videoUrl: e.target.value }))}
                    placeholder={bannerForm.mediaType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...video.mp4'}
                    className={inp} />
                </div>
              )}

              <div>
                <label className={lbl}>Overlay darkness: <strong className="text-white">{bannerForm.overlayOpacity}%</strong></label>
                <input type="range" min={0} max={90} step={5}
                  value={bannerForm.overlayOpacity}
                  onChange={e => setBannerForm(f => ({ ...f, overlayOpacity: Number(e.target.value) }))}
                  className="w-full accent-blue-500" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Badge text</label>
                  <input value={bannerForm.badge} onChange={e => setBannerForm(f => ({ ...f, badge: e.target.value }))} placeholder="New Launch · 3 BHK" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Title (use \n for line break)</label>
                  <input value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))} placeholder="Luxury Villas\nNow Available" className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Subtitle</label>
                  <input value={bannerForm.subtitle} onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Starting ₹85L onwards in Gurgaon" className={inp} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className={lbl}>Primary CTA Text</label>
                  <input value={bannerForm.ctaText} onChange={e => setBannerForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="Explore Properties" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Primary CTA Link</label>
                  <input value={bannerForm.ctaLink} onChange={e => setBannerForm(f => ({ ...f, ctaLink: e.target.value }))} placeholder="/properties" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Secondary CTA Text</label>
                  <input value={bannerForm.ctaSecondaryText} onChange={e => setBannerForm(f => ({ ...f, ctaSecondaryText: e.target.value }))} placeholder="WhatsApp Us" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Secondary CTA Link</label>
                  <input value={bannerForm.ctaSecondaryLink} onChange={e => setBannerForm(f => ({ ...f, ctaSecondaryLink: e.target.value }))} placeholder="https://wa.me/91..." className={inp} />
                </div>
              </div>

              <button onClick={handleAddBanner} disabled={addingBanner}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60">
                {addingBanner ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</> : '+ Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT ────────────────────────────────────────────────────────── */}
      {tab === 'contact' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold mb-1">Contact Information</h2>
          {[
            { label: 'Phone',            key: 'contact.phone',    placeholder: '+91 98765 43210' },
            { label: 'WhatsApp Number',  key: 'contact.whatsapp', placeholder: '919876543210' },
            { label: 'Email',            key: 'contact.email',    placeholder: 'hello@propai.in' },
            { label: 'Office Address',   key: 'contact.address',  placeholder: 'Plot 12, Sector 18, Noida' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              <input value={key.split('.').reduce((o: any, k) => o?.[k], settings) || ''}
                onChange={e => setField(key, e.target.value)} placeholder={placeholder} className={inp} />
            </div>
          ))}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-white text-sm font-medium mb-4">Social Media</p>
            {[
              { label: 'Facebook',  key: 'social.facebook',  placeholder: 'https://facebook.com/...' },
              { label: 'Instagram', key: 'social.instagram', placeholder: 'https://instagram.com/...' },
              { label: 'YouTube',   key: 'social.youtube',   placeholder: 'https://youtube.com/...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="mb-4">
                <label className={lbl}>{label}</label>
                <input value={key.split('.').reduce((o: any, k) => o?.[k], settings) || ''}
                  onChange={e => setField(key, e.target.value)} placeholder={placeholder} className={inp} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEO ────────────────────────────────────────────────────────────── */}
      {tab === 'seo' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold mb-1">SEO Configuration</h2>
          {[
            { label: 'Site Title',          key: 'seo.metaTitle',          placeholder: 'PropAI – Premium Properties' },
            { label: 'Meta Description',    key: 'seo.metaDescription',    placeholder: 'AI-powered real estate platform...' },
            { label: 'Google Analytics ID', key: 'seo.googleAnalyticsId',  placeholder: 'G-XXXXXXXXXX' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              <input value={key.split('.').reduce((o: any, k) => o?.[k], settings) || ''}
                onChange={e => setField(key, e.target.value)} placeholder={placeholder} className={inp} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}