/**
 * Moderasyon paneli istemcisi.
 *
 * Panelin API yolu gizli bir ön ekin arkasında ve derleme sırasında
 * VITE_ADMIN_PATH ile geliyor. Ön ek tanımsızsa panel hiç yüklenmez —
 * ana uygulamanın paketine tahmin edilebilir bir yol gömmek, gizli yol
 * katmanını anlamsızlaştırırdı.
 */

const API_ROOT = (import.meta as any).env?.VITE_ADMIN_API_URL
    || (import.meta as any).env?.VITE_API_URL?.replace(/\/api$/, '')
    || 'https://api.edurce.com';

const PREFIX = String((import.meta as any).env?.VITE_ADMIN_PATH || '').replace(/^\/+|\/+$/g, '');

export const isStaffPanelEnabled = () => PREFIX.length >= 16;

/** Tarayıcı yolundaki panel kökü. */
export const staffBasePath = () => `/${PREFIX}`;

const TOKEN_KEY = 'edurce_staff_token';

export const staffToken = {
    get: () => {
        try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
    },
    set: (value: string) => {
        // sessionStorage bilinçli: sekme kapanınca oturum da düşsün. Panel
        // jetonu localStorage'da günlerce durmamalı.
        try { sessionStorage.setItem(TOKEN_KEY, value); } catch { /* engelliyse yoksay */ }
    },
    clear: () => {
        try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* yoksay */ }
    },
};

export class StaffApiError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

async function request<T = any>(
    path: string,
    options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
    const { method = 'GET', body, auth = true } = options;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = staffToken.get();
        if (!token) throw new StaffApiError('Oturum yok', 401, 'STAFF_AUTH_REQUIRED');
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_ROOT}/${PREFIX}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    // Ağ kapısı, panelin varlığını gizlemek için 404 döndürüyor. Boş gövdeli
    // 404'ü "adres yok" değil, "erişim reddedildi" diye okumak gerekiyor.
    if (res.status === 404) {
        const text = await res.text();
        if (!text) throw new StaffApiError('Bu ağdan erişim yok', 404, 'NETWORK_BLOCKED');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401) staffToken.clear();
        throw new StaffApiError(data.error || 'İşlem tamamlanamadı', res.status, data.code);
    }
    return data as T;
}

export const staffApi = {
    login: (email: string, password: string, code: string) =>
        request<any>('/auth/login', { method: 'POST', body: { email, password, code }, auth: false }),

    confirmTotp: (email: string, password: string, code: string) =>
        request<any>('/auth/totp/confirm', { method: 'POST', body: { email, password, code }, auth: false }),

    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request<any>('/auth/me'),
    dashboard: () => request<any>('/dashboard'),

    courses: (params: Record<string, string | number> = {}) =>
        request<any>(`/courses?${new URLSearchParams(params as any)}`),
    course: (id: number) => request<any>(`/courses/${id}`),
    decideCourse: (id: number, decision: string, note: string) =>
        request(`/courses/${id}/decision`, { method: 'POST', body: { decision, note } }),
    lessonTakedown: (id: number, takeDown: boolean, reason: string) =>
        request(`/lessons/${id}/takedown`, { method: 'POST', body: { takeDown, reason } }),

    users: (params: Record<string, string | number> = {}) =>
        request<any>(`/users?${new URLSearchParams(params as any)}`),
    user: (id: number) => request<any>(`/users/${id}`),
    sanction: (id: number, payload: Record<string, unknown>) =>
        request(`/users/${id}/sanction`, { method: 'POST', body: payload }),
    liftSanction: (id: number, note: string) =>
        request(`/users/${id}/lift`, { method: 'POST', body: { note } }),

    applications: (status = 'pending') => request<any>(`/applications?status=${status}`),
    decideApplication: (id: number, approve: boolean, note: string) =>
        request(`/applications/${id}/decision`, { method: 'POST', body: { approve, note } }),

    reports: (status = 'open') => request<any>(`/reports?status=${status}`),
    resolveReport: (id: number, action: string, resolution: string) =>
        request(`/reports/${id}/resolve`, { method: 'POST', body: { action, resolution } }),

    appeals: (status = 'open') => request<any>(`/appeals?status=${status}`),
    decideAppeal: (id: number, decision: string, note: string) =>
        request(`/appeals/${id}/decision`, { method: 'POST', body: { decision, note } }),

    dmca: (status = 'received') => request<any>(`/dmca?status=${status}`),
    resolveDmca: (id: number, status: string, note: string) =>
        request(`/dmca/${id}/resolve`, { method: 'POST', body: { status, note } }),

    suspiciousReviews: () => request<any>('/reviews/suspicious'),
    hideReview: (id: number, hide: boolean, note: string) =>
        request(`/reviews/${id}/hide`, { method: 'POST', body: { hide, note } }),

    announcements: () => request<any>('/announcements'),
    sendAnnouncement: (payload: Record<string, unknown>) =>
        request('/announcements', { method: 'POST', body: payload }),

    staffList: () => request<any>('/staff'),
    addStaff: (email: string, role: string, note: string) =>
        request('/staff', { method: 'POST', body: { email, role, note } }),
    disableStaff: (userId: number) =>
        request(`/staff/${userId}/disable`, { method: 'POST' }),

    audit: (params: Record<string, string | number> = {}) =>
        request<any>(`/audit?${new URLSearchParams(params as any)}`),
};

export const PERMISSIONS = {
    CONTENT_REVIEW: 'content.review',
    CONTENT_TAKEDOWN: 'content.takedown',
    CATEGORY_MANAGE: 'category.manage',
    USER_VIEW: 'user.view',
    USER_SANCTION: 'user.sanction',
    INSTRUCTOR_VERIFY: 'instructor.verify',
    REPORT_HANDLE: 'report.handle',
    APPEAL_HANDLE: 'appeal.handle',
    DMCA_HANDLE: 'dmca.handle',
    ANNOUNCE_SEND: 'announce.send',
    FINANCE_VIEW: 'finance.view',
    FINANCE_ACT: 'finance.act',
    STAFF_MANAGE: 'staff.manage',
    AUDIT_VIEW: 'audit.view',
} as const;
