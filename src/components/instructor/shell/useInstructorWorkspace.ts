import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';

/*
 * Eğitmen panelinin menüsü ile açılış sayfası aynı veriyi gösteriyor:
 * eğitmenin kursları, cevap bekleyen sorular, okunmamış mesajlar.
 *
 * Sorgu anahtarları ilgili sayfalarla aynı (Soru-Cevap sayfası
 * 'instructor-questions', Mesajlar 'instructor-conversations'). Böylece
 * menüdeki sayı ile sayfadaki liste tek önbellekten geliyor; soru
 * cevaplanınca ikisi birlikte güncelleniyor.
 */

const authed = async (path: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(path);
    return res.json();
};

export type WorkspaceCourse = {
    id: number;
    title: string;
    thumbnail: string | null;
    status: string;
    price: number;
    updated_at: string | null;
};

export const COURSE_STATUS: Record<string, { label: string; tone: 'draft' | 'review' | 'live' }> = {
    draft: { label: 'Taslak', tone: 'draft' },
    pending: { label: 'İncelemede', tone: 'review' },
    published: { label: 'Yayında', tone: 'live' },
};

export const statusOf = (s: string) => COURSE_STATUS[s] || { label: 'İncelemede', tone: 'review' as const };

export function useInstructorCourses() {
    return useQuery({
        queryKey: ['instructor-workspace-courses'],
        queryFn: async (): Promise<WorkspaceCourse[]> => {
            const data = await authed('/instructor/courses');
            const list: any[] = Array.isArray(data?.courses) ? data.courses : [];
            return list
                .map(c => ({
                    id: Number(c.id ?? c.course_id),
                    title: c.title || 'Adsız kurs',
                    thumbnail: c.thumbnail || null,
                    status: c.status || 'draft',
                    price: Number(c.price) || 0,
                    updated_at: c.updated_at || c.created_at || null,
                }))
                .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        },
        staleTime: 60_000,
    });
}

/** Kazanç ve öğrenci özeti. Menü de açılış sayfası da aynı önbellekten okuyor. */
export function useInstructorDashboard() {
    return useQuery({
        queryKey: ['instructor-dashboard'],
        queryFn: async () => {
            const data = await authed('/instructor/dashboard');
            if (!data?.success) throw new Error('Panel verisi alınamadı');
            return data;
        },
        staleTime: 60_000,
    });
}

export function useUnansweredCount() {
    const q = useQuery({
        queryKey: ['instructor-questions'],
        queryFn: () => authed('/qa/instructor-questions'),
        staleTime: 60_000,
    });
    const questions: any[] = q.data?.questions || [];
    return { ...q, questions, count: questions.filter(x => !x.is_answered).length };
}

export function useUnreadMessages() {
    const q = useQuery({
        queryKey: ['instructor-conversations'],
        queryFn: () => authed('/instructor/messages/conversations'),
        refetchInterval: 30_000,
    });
    const conversations: any[] = q.data?.conversations || [];
    return {
        ...q,
        conversations,
        count: conversations.reduce((n, c) => n + (Number(c.unread_count) || 0), 0),
    };
}

/** "3 gün önce" — kaba ama okunur; tam tarih title'da duruyor. */
export const relativeTime = (iso?: string | null) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diff)) return '';
    const m = Math.round(diff / 60000);
    if (m < 1) return 'az önce';
    if (m < 60) return `${m} dk önce`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} saat önce`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d} gün önce`;
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};
