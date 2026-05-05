import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import {
    Bell, Check, CheckCheck, Trash2, Filter, Search,
    ShoppingCart, BookOpen, MessageSquare, Award, Settings,
    Star, Users, Megaphone, AlertCircle, ChevronDown, X
} from 'lucide-react';

interface Notification {
    notification_id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    action_url: string | null;
    created_at: string;
}

const getNotificationMeta = (type: string) => {
    switch (type) {
        case 'purchase': return { icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Satın Alma', emoji: '🛒' };
        case 'enrollment': return { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Kayıt', emoji: '📚' };
        case 'announcement': return { icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Duyuru', emoji: '📢' };
        case 'message': return { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Mesaj', emoji: '💬' };
        case 'achievement': return { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Başarı', emoji: '🏆' };
        case 'review': return { icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Değerlendirme', emoji: '⭐' };
        case 'system': return { icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Sistem', emoji: '⚙️' };
        default: return { icon: Bell, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Bildirim', emoji: '🔔' };
    }
};

const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isAuthenticated) fetchNotifications();
    }, [isAuthenticated]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.notifications.getAll();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.notifications.markAsRead(id);
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const markAllAsRead = async () => {
        try {
            await api.notifications.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const deleteNotification = async (id: number) => {
        try {
            await api.notifications.delete(id);
            const notif = notifications.find(n => n.notification_id === id);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            if (notif && !notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const handleNotifClick = (notif: Notification) => {
        if (!notif.is_read) markAsRead(notif.notification_id);
        if (notif.action_url) navigate(notif.action_url);
    };

    const filterTypes = [
        { key: 'all', label: 'Tümü' },
        { key: 'unread', label: 'Okunmamış' },
        { key: 'purchase', label: 'Satın Alma' },
        { key: 'enrollment', label: 'Kayıt' },
        { key: 'announcement', label: 'Duyurular' },
        { key: 'message', label: 'Mesajlar' },
        { key: 'achievement', label: 'Başarılar' },
        { key: 'system', label: 'Sistem' },
    ];

    const filteredNotifications = notifications
        .filter(n => {
            if (filter === 'unread') return !n.is_read;
            if (filter !== 'all') return n.type === filter;
            return true;
        })
        .filter(n => {
            if (!searchQuery) return true;
            return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase());
        });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/30">
                <div className="text-center p-8">
                    <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Bildirimlerinizi görmek için giriş yapın</h2>
                    <Button onClick={() => navigate('/login')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                        Giriş Yap
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/30">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg shadow-violet-200">
                                    <Bell className="w-7 h-7 text-white" />
                                </div>
                                Bildirimler
                                {unreadCount > 0 && (
                                    <span className="text-sm bg-red-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                                        {unreadCount} yeni
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 mt-2 text-sm">Tüm bildirimlerinizi buradan yönetebilirsiniz</p>
                        </div>
                        {unreadCount > 0 && (
                            <Button onClick={markAllAsRead} variant="outline" className="rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50 text-sm h-10 px-4">
                                <CheckCheck className="w-4 h-4 mr-2" />
                                Tümünü Okundu İşaretle
                            </Button>
                        )}
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Bildirimlerde ara..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-violet-200 focus:border-violet-300 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filterTypes.map(ft => (
                                <button
                                    key={ft.key}
                                    onClick={() => setFilter(ft.key)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === ft.key
                                            ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {ft.label}
                                    {ft.key === 'unread' && unreadCount > 0 && (
                                        <span className="ml-1.5 bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">{unreadCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-10 h-10 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">
                            {filter !== 'all' ? 'Bu kategoride bildirim yok' : 'Henüz bildiriminiz yok'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {filter !== 'all' ? 'Farklı bir filtre deneyebilirsiniz' : 'Yeni bildirimler geldiğinde burada görünecek'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredNotifications.map((notif) => {
                            const meta = getNotificationMeta(notif.type);
                            const Icon = meta.icon;
                            return (
                                <div
                                    key={notif.notification_id}
                                    className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md group ${!notif.is_read
                                            ? 'border-violet-200 bg-gradient-to-r from-violet-50/50 to-white shadow-sm'
                                            : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                    onClick={() => handleNotifClick(notif)}
                                >
                                    <div className="flex items-start gap-4 p-5">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                                            <span className="text-2xl">{meta.emoji}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold ${meta.color} ${meta.bg} px-2 py-0.5 rounded-full uppercase tracking-wide`}>
                                                    {meta.label}
                                                </span>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                                                )}
                                            </div>
                                            <h3 className={`text-sm mb-1 ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                {notif.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                                            <p className="text-[11px] text-slate-400 mt-2">{timeAgo(notif.created_at)}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            {!notif.is_read && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.notification_id); }}
                                                    className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Okundu işaretle"
                                                >
                                                    <Check className="w-4 h-4 text-green-500" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.notification_id); }}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary Footer */}
                {notifications.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            Toplam {notifications.length} bildirim · {unreadCount} okunmamış
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
