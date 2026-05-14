import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import {
    Trophy, Flame, Zap, Target, Award, Users, ChevronRight,
    Lock, TrendingUp, Star, Sparkles, Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LEVEL_TITLES: Record<number, { title: string; color: string }> = {
    1:  { title: 'Yeni Başlayan', color: 'from-slate-400 to-slate-500' },
    2:  { title: 'Meraklı',       color: 'from-blue-400 to-blue-500' },
    3:  { title: 'Öğrenci',       color: 'from-indigo-400 to-indigo-500' },
    4:  { title: 'Araştırmacı',   color: 'from-violet-400 to-violet-500' },
    5:  { title: 'Azimli',        color: 'from-purple-400 to-purple-500' },
    6:  { title: 'Kahraman',      color: 'from-pink-400 to-rose-500' },
    7:  { title: 'Uzman',         color: 'from-amber-400 to-orange-500' },
    8:  { title: 'Üstat',         color: 'from-orange-400 to-red-500' },
    9:  { title: 'Şampiyon',      color: 'from-rose-400 to-pink-600' },
    10: { title: 'Efsane',        color: 'from-yellow-300 to-amber-500' },
};

const XP_PER_LEVEL = 1000;

const XP_TIPS = [
    { icon: '✅', label: 'Ders Tamamlama', xp: '+10 XP' },
    { icon: '📚', label: 'Kurs Bitirme',   xp: '+200 XP' },
    { icon: '🔥', label: 'Günlük Giriş',   xp: '+5 XP' },
    { icon: '⭐', label: 'Değerlendirme',  xp: '+15 XP' },
    { icon: '💬', label: 'Soru Sorma',     xp: '+20 XP' },
];

const Gamification = () => {
    const { user } = useAuth();

    const { data: profile } = useQuery({
        queryKey: ['gamification-profile'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/gamification/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!r.ok) return { xp: 0, level: 1, streak_days: 0 };
            return r.json();
        }
    });

    const { data: badgesData } = useQuery({
        queryKey: ['gamification-badges'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/gamification/badges`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!r.ok) return { badges: [] };
            return r.json();
        }
    });

    const { data: lbData } = useQuery({
        queryKey: ['gamification-leaderboard'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/gamification/leaderboard`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!r.ok) return { leaderboard: [] };
            return r.json();
        }
    });

    const xp = profile?.xp || 0;
    const level = Math.min(profile?.level || 1, 10);
    const streak = profile?.streak_days || 0;
    const xpInCurrentLevel = xp % XP_PER_LEVEL;
    const progressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
    const { title: levelTitle, color: levelColor } = LEVEL_TITLES[level] || LEVEL_TITLES[10];
    const badges = badgesData?.badges || [];
    const leaderboard = lbData?.leaderboard || [];
    const earned = badges.filter((b: any) => b.earned_at).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                        <Link to="/" className="hover:text-indigo-400 transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link to="/home/learning" className="hover:text-indigo-400 transition-colors">Öğrenim Alanım</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-300 font-medium">Başarılarım</span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Başarılarım &amp; Rozetlerim</h1>
                            <p className="text-slate-400 text-sm">İlerlemeni takip et, rozet kazan, liderlik tablosunda yüksel!</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Profile & Progress ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Level Card */}
                        <div className={`relative bg-gradient-to-br ${levelColor} rounded-3xl p-7 overflow-hidden shadow-2xl`}>
                            {/* BG pattern */}
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/2" />

                            <div className="relative flex items-center justify-between gap-6 mb-7">
                                <div className="flex items-center gap-5">
                                    {/* Level badge */}
                                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex flex-col items-center justify-center shadow-xl">
                                        <span className="text-3xl font-black text-white">{level}</span>
                                        <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Seviye</span>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-[0.15em] text-white/60 mb-1">Unvan</div>
                                        <div className="text-2xl font-black text-white">{levelTitle}</div>
                                        <div className="text-xs text-white/70 mt-1">Merhaba, {user?.first_name}!</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-white">{xp.toLocaleString()}</div>
                                    <div className="text-xs text-white/60 font-bold uppercase tracking-wider mt-1">Toplam XP</div>
                                </div>
                            </div>

                            {/* XP Bar */}
                            <div className="relative space-y-2">
                                <div className="flex justify-between text-xs text-white/75 font-medium">
                                    <span>{xpInCurrentLevel.toLocaleString()} XP</span>
                                    <span>Seviye {level + 1} için {XP_PER_LEVEL.toLocaleString()} XP</span>
                                </div>
                                <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white/80 rounded-full transition-all duration-1000"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/50">
                                    Sonraki seviyeye {(XP_PER_LEVEL - xpInCurrentLevel).toLocaleString()} XP kaldı.
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Günlük Seri', value: streak, icon: Flame, gradient: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/25', suffix: 'gün' },
                                { label: 'Toplam XP', value: xp.toLocaleString(), icon: Zap, gradient: 'from-indigo-500 to-violet-600', glow: 'shadow-indigo-500/25', suffix: '' },
                                { label: 'Rozetler', value: earned, icon: Award, gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/25', suffix: `/ ${badges.length}` },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-800/40 border border-white/8 rounded-3xl p-5 flex flex-col items-center text-center hover:border-white/15 transition-all">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-lg ${s.glow}`}>
                                        <s.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-black text-white">{s.value} <span className="text-sm font-normal text-slate-400">{s.suffix}</span></div>
                                    <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Badges */}
                        <div className="bg-slate-800/40 border border-white/8 rounded-3xl p-6">
                            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" /> Rozetler
                                <span className="ml-auto text-xs text-slate-500">{earned}/{badges.length} kazanıldı</span>
                            </h2>
                            {badges.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-sm">
                                    Kursları tamamlayarak rozetler kazan!
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {badges.map((badge: any) => {
                                        const isEarned = !!badge.earned_at;
                                        return (
                                            <div
                                                key={badge.badge_id}
                                                className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                                                    isEarned
                                                        ? 'border-amber-400/30 bg-amber-400/10 hover:border-amber-400/50 hover:scale-105'
                                                        : 'border-white/5 bg-slate-800/30 opacity-40 grayscale'
                                                }`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 text-3xl shadow-lg ${
                                                    isEarned ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30' : 'bg-slate-700/50'
                                                }`}>
                                                    {badge.icon || '🏅'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-300 line-clamp-2 leading-tight">{badge.name}</span>
                                                {!isEarned && <Lock className="w-3 h-3 text-slate-600 mt-1.5" />}
                                                {isEarned && (
                                                    <span className="text-[9px] text-amber-400/70 font-bold mt-1">KAZANILDI</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Leaderboard & Tips ── */}
                    <div className="space-y-6">

                        {/* Leaderboard */}
                        <div className="bg-slate-800/40 border border-white/8 rounded-3xl p-6">
                            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-400" /> Liderlik Tablosu
                            </h2>
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-sm">
                                    Liderlik tablosu henüz boş.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((u: any, idx: number) => {
                                        const rankColors = [
                                            'from-amber-400 to-yellow-500',
                                            'from-slate-300 to-slate-400',
                                            'from-orange-400 to-amber-600',
                                        ];
                                        const isTop3 = idx < 3;
                                        return (
                                            <div
                                                key={u.user_id}
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                                                    u.is_me
                                                        ? 'bg-indigo-500/15 border border-indigo-500/25'
                                                        : 'hover:bg-white/5 border border-transparent'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                                    isTop3
                                                        ? `bg-gradient-to-br ${rankColors[idx]} text-white shadow-lg`
                                                        : 'bg-slate-700 text-slate-300'
                                                }`}>
                                                    {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-bold truncate ${u.is_me ? 'text-indigo-300' : 'text-white'}`}>
                                                        {u.is_me ? `${u.first_name} (Sen)` : `${u.first_name} ${u.last_name}`}
                                                    </div>
                                                    <div className="text-xs text-slate-500">Seviye {u.level}</div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Zap className="w-3 h-3 text-indigo-400" />
                                                    <span className="text-xs font-bold text-indigo-300">{u.xp?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* XP Tips */}
                        <div className="bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-400/20 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-amber-300 mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4" /> XP Nasıl Kazanılır?
                            </h3>
                            <div className="space-y-3">
                                {XP_TIPS.map(tip => (
                                    <div key={tip.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-base">{tip.icon}</span>
                                            <span className="text-sm text-amber-200/80">{tip.label}</span>
                                        </div>
                                        <span className="text-sm font-black text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                                            {tip.xp}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Progress to next level */}
                        <div className="bg-slate-800/40 border border-white/8 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-violet-400" /> Seviye İlerlemesi
                            </h3>
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white">{level}</div>
                                    <div className="text-xs text-slate-500">Mevcut</div>
                                </div>
                                <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${levelColor} rounded-full transition-all duration-1000`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-400">{level + 1}</div>
                                    <div className="text-xs text-slate-500">Sonraki</div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center">
                                {(XP_PER_LEVEL - xpInCurrentLevel).toLocaleString()} XP daha kazan →{' '}
                                <span className="text-violet-400 font-bold">{LEVEL_TITLES[Math.min(level + 1, 10)]?.title}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gamification;
