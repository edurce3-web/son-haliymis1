import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface Tier {
    key: string; name: string; min: number;
    multiplier: number; rate: number; color: string; reached?: boolean;
}

interface Overview {
    balance: number;
    lifetimeEarned: number;
    streakDays: number;
    earnedThisMonth: number;
    balanceValue: number;
    tier: Tier & { progress: number; next: { name: string; min: number; remaining: number } | null };
    tiers: Tier[];
    rules: Array<{ key: string; label: string; amount: number }>;
    purchaseRate: number;
    maxShare: number;
    history: Array<{ amount: number; reason: string; description: string; balanceAfter: number; date: string }>;
    streakEarnedNow: number;
}

const nf = (n: number) => (Number(n) || 0).toLocaleString('tr-TR');
const lira = (n: number) =>
    `${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

const dateLabel = (d: string) => {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const Gamification: React.FC = () => {
    const { user } = useAuth();

    const { data, isLoading } = useQuery<Overview>({
        queryKey: ['credits-overview'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/credits/overview`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!r.ok) throw new Error('Kredi bilgisi alınamadı');
            return r.json();
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Kredi bilgin yüklenemedi</h1>
                    <p className="text-sm text-slate-500">Sayfayı yenilemeyi dene.</p>
                </div>
            </div>
        );
    }

    const { tier } = data;

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Bakiye ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-brand-900">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-32 -left-20 w-[460px] h-[460px] bg-brand-500/25 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 right-0 w-[480px] h-[480px] bg-brand-400/15 rounded-full blur-[130px]" />
                </div>

                <div className="relative container px-4 py-12 lg:py-16">
                    <div className="flex flex-wrap items-end justify-between gap-8">
                        <div>
                            <p className="text-brand-200/80 text-sm font-medium mb-2">
                                {user?.first_name ? `${user.first_name}, kredi bakiyen` : 'Kredi bakiyen'}
                            </p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl lg:text-6xl font-extrabold text-white tabular-nums">
                                    {nf(data.balance)}
                                </span>
                                <span className="text-brand-200 text-lg font-medium">kredi</span>
                            </div>
                            <p className="text-brand-100/70 mt-2">
                                Yaklaşık <strong className="text-white">{lira(data.balanceValue)}</strong> değerinde
                            </p>

                            {data.streakEarnedNow > 0 && (
                                <p className="inline-block mt-4 text-sm text-brand-50 bg-white/10 rounded-full px-3.5 py-1.5">
                                    Bugünkü girişin için +{data.streakEarnedNow} kredi
                                </p>
                            )}
                        </div>

                        {/* Seviye */}
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-5 w-full max-w-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs text-brand-200/70">Seviyen</p>
                                    <p className="text-xl font-bold text-white">{tier.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-brand-200/70">Kazanç çarpanı</p>
                                    <p className="text-xl font-bold text-brand-300">×{tier.multiplier}</p>
                                </div>
                            </div>

                            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-300 rounded-full transition-all"
                                    style={{ width: `${tier.progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-brand-100/70 mt-2">
                                {tier.next
                                    ? <>{tier.name} → {tier.next.name} için <strong className="text-white">{nf(tier.next.remaining)}</strong> kredi daha</>
                                    : 'En üst seviyedesin'}
                            </p>
                        </div>
                    </div>

                    {/* Özet sayılar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-10 bg-white/10 rounded-xl overflow-hidden">
                        {[
                            { value: nf(data.lifetimeEarned), label: 'toplam kazanılan' },
                            { value: nf(data.earnedThisMonth), label: 'bu ay kazanılan' },
                            { value: `${data.streakDays} gün`, label: 'giriş serisi' },
                            { value: `${data.tier.rate} kredi`, label: '1 ₺ karşılığı' },
                        ].map(s => (
                            <div key={s.label} className="bg-brand-900/90 px-5 py-5">
                                <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                                <p className="text-xs text-brand-200/70 mt-1.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container px-4 py-12 space-y-12">

                {/* ── Krediyi kullan ──────────────────────────────────────── */}
                <section className="bg-white border border-brand-100 rounded-2xl p-6 lg:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="max-w-xl">
                            <h2 className="text-lg font-bold text-slate-900">Kredini kursa çevir</h2>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                Ödeme sayfasında kredini indirim olarak uygulayabilirsin.
                                Seviyende <strong>{data.tier.rate} kredi = 1 ₺</strong>. Bir siparişin
                                en fazla %{Math.round(data.maxShare * 100)}'i krediyle ödenebilir.
                            </p>
                        </div>
                        <Link to="/courses">
                            <Button className="h-11 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold">
                                Kursları keşfet
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* ── Nasıl kazanılır ─────────────────────────────────────── */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Nasıl kredi kazanılır?</h2>
                    <p className="text-sm text-slate-500 mb-5">
                        Aşağıdaki tutarlar taban değerdir; seviyenin çarpanıyla ({`×${tier.multiplier}`}) artar.
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.rules.map(rule => (
                            <div
                                key={rule.key}
                                className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                            >
                                <span className="text-sm text-slate-700">{rule.label}</span>
                                <span className="text-sm font-bold text-brand-700 whitespace-nowrap">
                                    +{rule.amount}
                                </span>
                            </div>
                        ))}
                        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                            <span className="text-sm text-slate-700">Her 10 ₺ alışveriş</span>
                            <span className="text-sm font-bold text-brand-700 whitespace-nowrap">
                                +{data.purchaseRate}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── Seviyeler ───────────────────────────────────────────── */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Seviyeler</h2>
                    <p className="text-sm text-slate-500 mb-5">
                        Seviye, hayat boyu kazandığın toplam krediye göre belirlenir — harcadıkça düşmez.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50/70">
                                    <th className="font-medium px-5 py-3">Seviye</th>
                                    <th className="font-medium px-3 py-3">Eşik</th>
                                    <th className="font-medium px-3 py-3">Kazanç çarpanı</th>
                                    <th className="font-medium px-5 py-3 text-right">1 ₺ karşılığı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.tiers.map(t => {
                                    const isCurrent = t.key === tier.key;
                                    return (
                                        <tr key={t.key} className={cn(isCurrent && 'bg-brand-50/70')}>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-2.5">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: t.color }}
                                                    />
                                                    <span className={cn('font-medium', isCurrent ? 'text-brand-800' : 'text-slate-700')}>
                                                        {t.name}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-100 rounded-full px-2 py-0.5">
                                                            şu an
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5 text-slate-500 tabular-nums">{nf(t.min)}</td>
                                            <td className="px-3 py-3.5 text-slate-700">×{t.multiplier}</td>
                                            <td className="px-5 py-3.5 text-right text-slate-700 tabular-nums">
                                                {t.rate} kredi
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── Hareketler ──────────────────────────────────────────── */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-5">Son hareketler</h2>

                    {data.history.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl py-14 text-center">
                            <p className="text-sm font-medium text-slate-700">Henüz hareket yok</p>
                            <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
                                Bir ders tamamla ya da değerlendirme yaz; ilk kredin burada görünecek.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                            {data.history.map((h, i) => (
                                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-800 truncate">{h.description}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{dateLabel(h.date)}</p>
                                    </div>
                                    <span className={cn(
                                        'text-sm font-bold tabular-nums shrink-0',
                                        h.amount > 0 ? 'text-emerald-600' : 'text-slate-500'
                                    )}>
                                        {h.amount > 0 ? '+' : ''}{nf(h.amount)}
                                    </span>
                                    <span className="text-xs text-slate-400 tabular-nums shrink-0 w-16 text-right">
                                        {nf(h.balanceAfter)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Gamification;
