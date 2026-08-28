import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { PageBand } from '@/components/layout/PageBand';
import { cn, formatPrice } from '@/lib/utils';
import { ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CouponTier {
    key: string;
    credits: number;
    discount: number;
    affordable: boolean;
}

interface Coupon {
    code: string;
    discount: number;
    creditsUsed: number;
    used: boolean;
    expired: boolean;
    expiresAt: string;
    createdAt: string;
}

interface Overview {
    balance: number;
    lifetimeEarned: number;
    purchaseRate: number;
    completeReward: number;
    couponTiers: CouponTier[];
    coupons: Coupon[];
    history: Array<{
        amount: number;
        reason: string;
        description: string | null;
        balanceAfter: number;
        date: string;
    }>;
}

const REASON_LABELS: Record<string, string> = {
    purchase: 'Kurs satın alma',
    course_complete: 'Kurs tamamlama',
    redeem: 'Kupona çevrildi',
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

const Gamification: React.FC = () => {
    const queryClient = useQueryClient();
    const [redeeming, setRedeeming] = useState<string | null>(null);

    const { data, isLoading } = useQuery<Overview>({
        queryKey: ['credit-overview'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/credits/overview`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error('Kredi bilgisi alınamadı');
            return res.json();
        },
    });

    const redeem = async (tier: CouponTier) => {
        setRedeeming(tier.key);
        try {
            const res = await fetch(`${API_BASE_URL}/credits/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ tier: tier.key }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Kupon oluşturulamadı');

            toast.success('Kupon oluşturuldu', { description: result.code });
            queryClient.invalidateQueries({ queryKey: ['credit-overview'] });
        } catch (error: any) {
            toast.error(error.message || 'Kupon oluşturulamadı');
        } finally {
            setRedeeming(null);
        }
    };

    if (isLoading || !data) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
        );
    }

    const activeCoupons = data.coupons.filter(c => !c.used && !c.expired);
    const pastCoupons = data.coupons.filter(c => c.used || c.expired);

    return (
        <div className="min-h-screen bg-white">
            <PageBand
                breadcrumb={
                    <>
                        <Link to="/" className="hover:text-brand-800 transition-colors">Ana sayfa</Link>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <Link to="/home/learning" className="hover:text-brand-800 transition-colors">Eğitimlerim</Link>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-700">Edurce Kredi</span>
                    </>
                }
                title="Edurce Kredi"
                subtitle="Kurs aldıkça ve tamamladıkça kredi kazan, indirim kuponuna çevir."
            />

            <div className="container mx-auto px-5 sm:px-8 lg:px-10 max-w-[1280px] py-10">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

                    <div className="lg:col-span-8 min-w-0">
                        {/* Bakiye */}
                        <div className="flex flex-wrap items-end gap-x-10 gap-y-4 pb-7 border-b border-slate-200">
                            <div>
                                <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-700">
                                    Bakiye
                                </p>
                                <p className="font-montserrat text-[40px] font-extrabold text-slate-900 tabular-nums leading-none mt-2">
                                    {data.balance.toLocaleString('tr-TR')}
                                </p>
                                <p className="text-[13px] text-slate-500 mt-1.5">kredi</p>
                            </div>
                            <div>
                                <p className="font-montserrat text-[24px] font-extrabold text-slate-900 tabular-nums leading-none">
                                    {data.lifetimeEarned.toLocaleString('tr-TR')}
                                </p>
                                <p className="text-[13px] text-slate-500 mt-1.5">Bugüne kadar kazanılan</p>
                            </div>
                            <div>
                                <p className="font-montserrat text-[24px] font-extrabold text-slate-900 tabular-nums leading-none">
                                    {activeCoupons.length}
                                </p>
                                <p className="text-[13px] text-slate-500 mt-1.5">Kullanılabilir kupon</p>
                            </div>
                        </div>

                        {/* Nasıl kazanılır */}
                        <section className="mt-9">
                            <h2 className="font-montserrat text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">
                                Nasıl kazanılır
                            </h2>
                            <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-2.5 mb-5" />

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-5">
                                    <p className="font-montserrat text-[26px] font-extrabold text-brand-800 tabular-nums leading-none">
                                        {data.purchaseRate} kredi
                                    </p>
                                    <p className="text-[14.5px] font-semibold text-slate-900 mt-2.5">
                                        Her 10 ₺ alışverişte
                                    </p>
                                    <p className="text-[13.5px] text-slate-600 leading-relaxed mt-1">
                                        Satın aldığın her kurs bakiyene kredi ekler.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-5">
                                    <p className="font-montserrat text-[26px] font-extrabold text-brand-800 tabular-nums leading-none">
                                        {data.completeReward} kredi
                                    </p>
                                    <p className="text-[14.5px] font-semibold text-slate-900 mt-2.5">
                                        Tamamlanan her kurs
                                    </p>
                                    <p className="text-[13.5px] text-slate-600 leading-relaxed mt-1">
                                        Bir kursu %100 bitirdiğinde bir kez verilir.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Kupona çevir */}
                        <section className="mt-10 pt-8 border-t border-slate-200">
                            <h2 className="font-montserrat text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">
                                Kupona çevir
                            </h2>
                            <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-2.5" />
                            <p className="text-[14px] text-slate-500 mt-2.5 mb-5">
                                Oluşturduğun kupon 90 gün geçerlidir ve ödeme adımında kullanılır.
                            </p>

                            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                {data.couponTiers.map(tier => (
                                    <div
                                        key={tier.key}
                                        className={cn(
                                            'rounded-xl border p-4 flex flex-col transition-colors',
                                            tier.affordable
                                                ? 'border-slate-200 hover:border-brand-300'
                                                : 'border-slate-200 bg-slate-50/60'
                                        )}
                                    >
                                        <p className="font-montserrat text-[24px] font-extrabold text-slate-900 leading-none">
                                            {formatPrice(tier.discount)}
                                        </p>
                                        <p className="text-[13px] text-slate-500 mt-2">
                                            {tier.credits.toLocaleString('tr-TR')} kredi
                                        </p>

                                        <button
                                            onClick={() => redeem(tier)}
                                            disabled={!tier.affordable || redeeming === tier.key}
                                            className={cn(
                                                'h-9 mt-4 rounded-md text-[13px] font-semibold transition-colors',
                                                tier.affordable
                                                    ? 'bg-brand-700 hover:bg-brand-800 text-white'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            )}
                                        >
                                            {redeeming === tier.key
                                                ? 'Oluşturuluyor…'
                                                : tier.affordable
                                                    ? 'Kupon al'
                                                    : `${(tier.credits - data.balance).toLocaleString('tr-TR')} kredi eksik`}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Hareketler */}
                        {data.history.length > 0 && (
                            <section className="mt-10 pt-8 border-t border-slate-200">
                                <h2 className="font-montserrat text-[20px] font-extrabold text-slate-900 tracking-[-0.02em]">
                                    Hareketler
                                </h2>
                                <span className="block w-9 h-[3px] rounded-full bg-brand-700 mt-2.5 mb-5" />

                                <div className="border-t border-slate-200 divide-y divide-slate-100">
                                    {data.history.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between gap-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-[14.5px] text-slate-900 truncate">
                                                    {item.description || REASON_LABELS[item.reason] || item.reason}
                                                </p>
                                                <p className="text-[12.5px] text-slate-400 mt-0.5">
                                                    {formatDate(item.date)}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                'text-[14.5px] font-semibold tabular-nums shrink-0',
                                                item.amount > 0 ? 'text-brand-800' : 'text-slate-500'
                                            )}>
                                                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── Sağ ray: kuponlar ──────────────────────────────── */}
                    <aside className="lg:col-span-4">
                        <div className="lg:sticky lg:top-20 space-y-8">
                            <div>
                                <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-3">
                                    Kuponlarım
                                </p>

                                {activeCoupons.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeCoupons.map(coupon => (
                                            <div
                                                key={coupon.code}
                                                className="rounded-xl border border-brand-200 bg-brand-50/50 p-4"
                                            >
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <span className="font-mono text-[15px] font-bold tracking-wider text-brand-900">
                                                        {coupon.code}
                                                    </span>
                                                    <span className="font-montserrat text-[17px] font-extrabold text-slate-900">
                                                        {formatPrice(coupon.discount)}
                                                    </span>
                                                </div>
                                                <p className="text-[12.5px] text-slate-500 mt-2">
                                                    Son kullanım: {formatDate(coupon.expiresAt)}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard?.writeText(coupon.code);
                                                        toast.success('Kod kopyalandı');
                                                    }}
                                                    className="text-[12.5px] font-semibold text-brand-700 hover:text-brand-900 hover:underline mt-2"
                                                >
                                                    Kodu kopyala
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[14px] text-slate-500">
                                        Henüz kuponun yok. Yeterli kredi biriktiğinde buradan oluşturabilirsin.
                                    </p>
                                )}
                            </div>

                            {pastCoupons.length > 0 && (
                                <div>
                                    <p className="font-montserrat text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-3">
                                        Geçmiş kuponlar
                                    </p>
                                    <div className="space-y-1.5">
                                        {pastCoupons.map(coupon => (
                                            <div
                                                key={coupon.code}
                                                className="flex items-center justify-between gap-3 text-[13px] text-slate-400"
                                            >
                                                <span className="font-mono line-through truncate">{coupon.code}</span>
                                                <span className="shrink-0">
                                                    {coupon.used ? 'Kullanıldı' : 'Süresi doldu'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Gamification;
