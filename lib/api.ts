// ── Base URL ──────────────────────────────────────────────────────────────────
// In browser: use relative /api/v1 path → proxied by Next.js rewrites (no CORS)
// In SSR / server: use the full env URL directly
const BASE_URL =
  typeof window !== 'undefined'
    ? '/api/v1'                                               // browser → proxy
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'); // SSR

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('propai_token');
}

export function setToken(token: string) {
  localStorage.setItem('propai_token', token);
}

export function clearToken() {
  localStorage.removeItem('propai_token');
  localStorage.removeItem('propai_user');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    console.error(`[API] Network error for ${path}:`, err);
    throw new Error(`Network error: could not reach ${BASE_URL}${path}`);
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }

  // Handle non-JSON responses gracefully
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    return {} as T;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  profile: () => request<any>('/auth/profile'),
};

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leadsApi = {
  getAll: (filters?: Record<string, string>) => {
    const q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return request<any[]>(`/leads${q}`);
  },
  getStats: () => request<any>('/leads/stats'),
  getById: (id: string) => request<any>(`/leads/${id}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  update: (id: string, data: any) =>
    request<any>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Properties ───────────────────────────────────────────────────────────────
export const propertiesApi = {
  getAll: (filters?: Record<string, string>) => {
    const q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return request<any[]>(`/properties${q}`);
  },
  getAllAdmin: (filters?: Record<string, string>) => {
    const q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return request<any[]>(`/properties/admin/all${q}`);
  },
  getBySlug: (slug: string) => request<any>(`/properties/${slug}`),
  create: (formData: FormData) =>
    request<any>('/properties', { method: 'POST', body: formData }),
  update: (id: string, formData: FormData) =>
    request<any>(`/properties/${id}`, { method: 'PUT', body: formData }),
  delete: (id: string) =>
    request<any>(`/properties/${id}`, { method: 'DELETE' }),
  deleteImage: (propertyId: string, publicId: string) =>
    request<any>(`/properties/${propertyId}/image/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    }),
  restore: (id: string) =>
    request<any>(`/properties/${id}/restore`, { method: 'PATCH' }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  getSession: (sessionId: string) => request<any>(`/chat/${sessionId}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request<any>('/settings'),
  update: (data: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return request<any>('/settings/logo', { method: 'POST', body: fd });
  },
  uploadFavicon: (file: File) => {
    const fd = new FormData();
    fd.append('favicon', file);
    return request<any>('/settings/favicon', { method: 'POST', body: fd });
  },
  addBanner: (data: any, file?: File) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, String(v)));
    if (file) fd.append('image', file);
    return request<any>('/settings/banners', { method: 'POST', body: fd });
  },
  deleteBanner: (bannerId: string) =>
    request<any>(`/settings/banners/${bannerId}`, { method: 'DELETE' }),
  updateBannerOrder: (banners: { id: string; order: number }[]) =>
    request<any>('/settings/banners/order', {
      method: 'PUT',
      body: JSON.stringify({ banners }),
    }),
};