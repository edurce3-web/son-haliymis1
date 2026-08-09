import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Bell, Check, CheckCheck, Trash2, Search, Loader2,
    ShoppingCart, BookOpen, MessageSquare, Megaphone, Star,
    Settings, TrendingUp, HelpCircle, MessageCircleReply,
} from 'lucide-react';

interface Notification {
    notification_id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean | number;
    action_url: string | null;
    created_at: string;
}

interface TypeCount {
    type: string;
    total: number;
    unread: number;
}

/**
 * Bildirim türü -> görsel kimlik.
 * Türler backend'de services/notificationService.js içindeki TYPES ile aynı.
 */
const META: Record<string, { icon: React.ElementType; fg: string; bg: string; label: string }> = {
    purchase: { icon: ShoppingCart, fg: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Satın alma' },
    sale: { icon: TrendingUp, fg: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Satış' },
    enrollment: { icon: BookOpen, fg: 'text-blue-600', bg: 'bg-blue-50', label: 'Kayıt' },
    announcement: { icon: Megaphone, fg: 'text-orange-600', bg: 'bg-orange-50', label: 'Duyuru' },
    message: { icon: MessageSquare, fg: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Mesaj' },
    review: { icon: Star, fg: 'text-amber-600', bg: 'bg-amber-50', label: 'Değerlendirme' },
    question: { icon: HelpCircle, fg: 'text-violet-600', bg: 'bg-violet-50', label: 'Soru' },
    answer: { icon: MessageCircleReply, fg: 'text-violet-600', bg: 'bg-violet-50', label: 'Cevap' },
    system: { icon: Settings, fg: 'text-slate-600', bg: 'bg-slate-100', label: 'Sistem' },
};

const metaFor = (type: string) =>
    META[type] || { icon: Bell, fg: 'text-slate-600', bg: 'bg-slate-100', label: 'Bildirim' };

const timeAgo = (date: string) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Listeyi Bugün / Dün / Bu hafta / Daha eski başlıklarına ayırır. */
const bucketFor = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Bugün';
    if (d.toDateString() === new Date(now.getTime() - 86_400_000).toDateString()) return 'Dün';
    if (now.getTime() - d.getTime() < 7 * 86_400_000) return 'Bu hafta';
    return 'Daha eski';
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [byType, setByType] = useState<TypeCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await api.notifications.getAll();
            setNotifications(data.notifications || []);
            setByType(data.byType || []);
        } catch {
            if (!silent) toast.error('Bildirimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        load();
        // Sayfa açıkken arka planda yenile — yeni bildirim için sayfa yenilemek gerekmesin
        const timer = setInterval(() => load(true), 30_000);
        return () => clearInterval(timer);
    }, [isAuthenticated, load]);

    /** Zil ikonundaki rozetin de güncellenmesi için Header'a haber ver. */
    const announce = () => window.dispatchEvent(new Event('notificationsUpdated'));

    const markAsRead = async (id: number) => {
        setNotifications(prev => prev.map(n => (n.notification_id === id ? { ...n, is_read: true } : n)));
        announce();
        try { await api.notifications.markAsRead(id); } catch { /* sessiz */ }
    };

    const markAllAsRead = async () => {
        setBusy(true);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        announce();
        try { await api.notifications.markAllAsRead(); }
        catch { toast.error('İşlem tamamlanamadı'); load(true); }
        finally { setBusy(false); }
    };

    const remove = async (id: number) => {
        const backup = notifications;
        setNotifications(prev => prev.filter(n => n.notification_id !== id));
        announce();
        try { await api.notifications.delete(id); }
        catch { toast.error('Bildirim silinemedi'); setNotifications(backup); }
    };

    /** Okunmuşları toplu temizle — biriken listeyi tek hamlede sadeleştirir. */
    const clearRead = async () => {
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/read/all`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setNotifications(prev => prev.filter(n => !n.is_read));
            announce();
            toast.success(`${data.deleted || 0} okunmuş bildirim temizlendi`);
        } catch {
            toast.error('Temizlenemedi');
        } finally {
            setBusy(false);
        }
    };

    const open = (n: Notification) => {
        if (!n.is_read) markAsRead(n.notification_id);
        if (n.action_url) navigate(n.action_url);
    };

    // Filtre sekmeleri: yalnızca kullanıcıda gerçekten bulunan türler gösterilir,
    // böylece öğrenci hesabında "Satış" gibi boş sekmeler durmaz.
    const tabs = useMemo(() => {
        const present = byType
            .filter(t => t.total > 0)
            .sort((a, b) => b.total - a.total)
            .map(t => ({ key: t.type, label: metaFor(t.type).label, badge: t.unread }));
        return [
            { key: 'all', label: 'Tümü', badge: 0 },
            { key: 'unread', label: 'Okunmamış', badge: unreadCount },
            ...present,
        ];
    }, [byType, unreadCount]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return notifications.filter(n => {
            if (filter === 'unread' && n.is_read) return false;
            if (filter !== 'all' && filter !== 'unread' && n.type !== filter) return false;
            if (!q) return true;
            return `${n.title} ${n.message}`.toLowerCase().includes(q);
        });
    }, [notifications, filter, query]);

    const groups = useMemo(() => {
        const order = ['Bugün', 'Dün', 'Bu hafta', 'Daha eski'];
        const map = new Map<string, Notification[]>();
        for (const n of filtered) {
            const key = bucketFor(n.created_at);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(n);
        }
        return order.filter(k => map.has(k)).map(k => ({ label: k, items: map.get(k)! }));
    }, [filtered]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">
                        Bildirimlerini görmek için giriş yap
                    </h2>
                    <p className="text-sm text-slate-500 mb-5">
                        Satın alma, mesaj ve duyuru bildirimlerin burada toplanır.
                    </p>
                    <Button onClick={() => navigate('/login')} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                        Giriş yap
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 py-8">

                <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Bildirimler
                            {unreadCount > 0 && (
                                <span className="text-xs bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {notifications.length > 0
                                ? `${notifications.length} bildirim · ${unreadCount} okunmamış`
                                : 'Satın alma, mesaj ve duyurular burada görünür.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                disabled={busy}
                                variant="outline"
                                className="h-9 rounded-xl gap-2 text-sm"
                            >
                                <CheckCheck className="w-4 h-4" /> Tümünü okundu yap
                            </Button>
                        )}
                        {notifications.some(n => n.is_read) && (
                            <Button
                                onClick={clearRead}
                                disabled={busy}
                                variant="ghost"
                                className="h-9 rounded-xl gap-2 text-sm text-slate-500 hover:text-red-600"
                            >
                                <Trash2 className="w-4 h-4" /> Okunanları temizle
                            </Button>
                        )}
                    </div>
                </div>

                {notifications.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Bildirimlerde ara…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setFilter(t.key)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                        filter === t.key
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    )}
                                >
                                    {t.label}
                                    {t.badge > 0 && (
                                        <span className={cn(
                                            'ml-1.5 px-1.5 rounded-full text-[10px]',
                                            filter === t.key ? 'bg-white/20' : 'bg-indigo-100 text-indigo-700'
                                        )}>
                                            {t.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                                        <div className="h-3 bg-slate-50 rounded w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-7 h-7 text-slate-300" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-700 mb-1">
                            {notifications.length === 0 ? 'Henüz bildirimin yok' : 'Eşleşen bildirim yok'}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto">
                            {notifications.length === 0
                                ? 'Bir kurs satın aldığında, mesaj geldiğinde ya da eğitmenin duyuru yaptığında burada görürsün.'
                                : 'Farklı bir filtre veya arama deneyebilirsin.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {groups.map(group => (
                            <div key={group.label}>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
                                    {group.label}
                                </p>
                                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                                    {group.items.map(n => {
                                        const meta = metaFor(n.type);
                                        const Icon = meta.icon;
                                        const unread = !n.is_read;
                                        return (
                                            <div
                                                key={n.notification_id}
                                                onClick={() => open(n)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={e => { if (e.key === 'Enter') open(n); }}
                                                className={cn(
                                                    'group flex items-start gap-3 p-4 transition-colors cursor-pointer',
                                                    unread ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                                    meta.bg
                                                )}>
                                                    <Icon className={cn('w-5 h-5', meta.fg)} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={cn('text-[10px] font-semibold uppercase tracking-wide', meta.fg)}>
                                                            {meta.label}
                                                        </span>
                                                        {unread && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                                    </div>
                                                    <h3 className={cn(
                                                        'text-sm leading-snug',
                                                        unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                                                    )}>
                                                        {n.title}
                                                    </h3>
                                                    {n.message && (
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                    )}
                                                    <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(n.created_at)}</p>
                                                </div>

                                                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                    {unread && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); markAsRead(n.notification_id); }}
                                                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                                                            title="Okundu işaretle"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={e => { e.stopPropagation(); remove(n.notification_id); }}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {busy && (
                    <div className="flex justify-center mt-4">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
