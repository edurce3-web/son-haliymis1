import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { PageBand } from '@/components/layout/PageBand';
import { cn } from '@/lib/utils';
import { Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/*
 * Edurce Kredi.
 *
 * Oranlar sunucudan geliyor (creditService.js). Kabaca 10 kredi = 1 ₺:
 * alışverişte her 10 ₺ için 3 kredi, ücretli bir kursu bitirince kurs
 * fiyatına göre en fazla 50 kredi. Kuponların en az sepet tutarı var.
 *
 * Yazı tipi Plus Jakarta Sans; rakamlar tabular. Önceki hâlde Montserrat ve
 * eş aralıklı kod yazısı vardı, sayfa sert duruyordu.
 */

interface CouponTier {
    key: string;
    credits: number;
    discount: number;
    minOrder?: number;
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
    completePer10?: number;
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

const lira = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`;
const num = (n: number) => n.toLocaleString('tr-TR');
const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

const Gamification: React.FC = () => {
    const queryClient = useQueryClient();
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

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

    const copy = (code: string) => {
        navigator.clipboard?.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(c => (c === code ? null : c)), 1600);
    };

    const band = (
        <PageBand
            breadcrumb={<><Link to="/">Ana sayfa</Link><span className="text-[#9CA3AF]">/</span><span className="text-[#111827]">Edurce Kredi</span></>}
            eyebrow="Hesabım"
            title="Edurce Kredi"
            subtitle="Kurs aldıkça ve bitirdikçe kredi biriktir, indirim kuponuna çevir."
        />
    );

    if (isLoading || !data) {
        return (
            <div className="min-h-screen bg-white font-jakarta">
                {band}
                <div className="flex justify-center py-24">
                    <Loader2 className="w-6 h-6 animate-spin text-[#9CA3AF]" />
                </div>
            </div>
        );
    }

    const activeCoupons = data.coupons.filter(c => !c.used && !c.expired);
    const pastCoupons = data.coupons.filter(c => c.used || c.expired);
    const tiers = [...data.couponTiers].sort((a, b) => a.credits - b.credits);
    const next = tiers.find(t => t.credits > data.balance);
    const prevCredits = next ? (tiers.filter(t => t.credits <= data.balance).pop()?.credits ?? 0) : 0;
    const progress = next ? Math.min(100, ((data.balance - prevCredits) / (next.credits - prevCredits)) * 100) : 100;

    return (
        <div className="min-h-screen bg-white text-[#111827] font-jakarta pb-16">
            {band}

            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-8 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
                <div className="min-w-0 space-y-6">
                    {/* Bakiye */}
                    <section className=" bg-[#B2F0C8] p-6 sm:p-8">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <p className="text-[13px] font-semibold text-[#134D30]">Bakiyen</p>
                                <p className="mt-1 text-[48px] sm:text-[56px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
                                    {num(data.balance)}
                                    <span className="ml-2 text-[18px] font-bold tracking-normal text-[#134D30]">kredi</span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className=" bg-white/60 px-4 py-3 min-w-[120px]">
                                    <p className="text-[12px] text-[#134D30]">Bugüne kadar</p>
                                    <p className="mt-0.5 text-[20px] font-extrabold tabular-nums">{num(data.lifetimeEarned)}</p>
                                </div>
                                <div className=" bg-white/60 px-4 py-3 min-w-[120px]">
                                    <p className="text-[12px] text-[#134D30]">Hazır kupon</p>
                                    <p className="mt-0.5 text-[20px] font-extrabold tabular-nums">{activeCoupons.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-7">
                            <div className="flex items-baseline justify-between gap-4 text-[13.5px]">
                                <span className="font-semibold">
                                    {next ? `${lira(next.discount)} kupona ${num(next.credits - data.balance)} kredi kaldı` : 'En büyük kupona yetecek kredin var'}
                                </span>
                                {next && <span className="tabular-nums text-[#134D30]">{`${num(data.balance)} / ${num(next.credits)}`}</span>}
                            </div>
                            <div className="mt-2.5 h-2.5 rounded-full bg-white/60 overflow-hidden">
                                <div className="h-full rounded-full bg-[#1B7A43] transition-[width] duration-700" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </section>

                    {/* Nasıl kazanılır */}
                    <section>
                        <h2 className="text-[20px] font-extrabold tracking-[-0.015em]">Nasıl kazanılır?</h2>
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                            <div className=" bg-[#F5F6F8] p-5">
                                <p className="text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">
                                    {`${data.purchaseRate} kredi`}
                                </p>
                                <p className="mt-1.5 text-[15px] font-bold">Her 10 ₺'lik alışverişte</p>
                                <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B7280]">Satın aldığın kursun tutarına göre bakiyene eklenir.</p>
                            </div>
                            <div className=" bg-[#F5F6F8] p-5">
                                <p className="text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">
                                    {`En fazla ${data.completeReward} kredi`}
                                </p>
                                <p className="mt-1.5 text-[15px] font-bold">Ücretli bir kursu bitirince</p>
                                <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B7280]">
                                    {`Kurs fiyatının her 10 ₺'si için ${data.completePer10 ?? 1} kredi, kurs başına bir kez. Ücretsiz kurslar kredi kazandırmaz.`}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Kupona çevir */}
                    <section>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className="text-[20px] font-extrabold tracking-[-0.015em]">Kupona çevir</h2>
                            <p className="text-[13px] text-[#6B7280]">Kuponlar 90 gün geçerli.</p>
                        </div>
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                            {tiers.map(tier => {
                                const missing = Math.max(0, tier.credits - data.balance);
                                const pct = Math.min(100, (data.balance / tier.credits) * 100);
                                return (
                                    <div key={tier.key} className={cn(' p-5 flex flex-col', tier.affordable ? 'bg-[#EEFBF3]' : 'bg-[#F5F6F8]')}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[30px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{lira(tier.discount)}</p>
                                                <p className="mt-2 text-[13px] text-[#6B7280]">
                                                    {tier.minOrder ? `En az ${lira(tier.minOrder)} alışverişte` : 'İndirim kuponu'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 h-7 px-2.5 inline-flex items-center rounded-full bg-white text-[12.5px] font-bold tabular-nums">
                                                {`${num(tier.credits)} kredi`}
                                            </span>
                                        </div>
                                        {!tier.affordable && (
                                            <div className="mt-4 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                                                <div className="h-full rounded-full bg-[#1B7A43]/60" style={{ width: `${pct}%` }} />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => redeem(tier)}
                                            disabled={!tier.affordable || redeeming === tier.key}
                                            className={cn(
                                                'h-10 mt-4  text-[13.5px] font-bold transition-colors',
                                                tier.affordable ? 'bg-[#1B7A43] hover:bg-[#16613A] text-white' : 'bg-white text-[#9CA3AF] cursor-not-allowed'
                                            )}
                                        >
                                            {redeeming === tier.key
                                                ? 'Oluşturuluyor…'
                                                : tier.affordable ? 'Kupona çevir' : `${num(missing)} kredi eksik`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Hareketler */}
                    {data.history.length > 0 && (
                        <section>
                            <h2 className="text-[20px] font-extrabold tracking-[-0.015em]">Hareketler</h2>
                            <div className="mt-4  bg-[#F5F6F8] p-2">
                                {data.history.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4  px-4 py-3 hover:bg-white transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-[14.5px] font-semibold truncate">
                                                {item.description || REASON_LABELS[item.reason] || item.reason}
                                            </p>
                                            <p className="text-[12.5px] text-[#9CA3AF] mt-0.5">{formatDate(item.date)}</p>
                                        </div>
                                        <span className={cn('text-[15px] font-extrabold tabular-nums shrink-0', item.amount > 0 ? 'text-[#1B7A43]' : 'text-[#6B7280]')}>
                                            {`${item.amount > 0 ? '+' : ''}${num(item.amount)}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sağ: kuponlar */}
                <aside className="lg:sticky lg:top-24 space-y-6">
                    <section className=" bg-[#F5F6F8] p-5">
                        <h2 className="text-[17px] font-extrabold">Kuponlarım</h2>
                        {activeCoupons.length > 0 ? (
                            <div className="mt-4 space-y-2.5">
                                {activeCoupons.map(coupon => (
                                    <div key={coupon.code} className="relative  bg-white p-4 overflow-hidden">
                                        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#B2F0C8]" />
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-[22px] font-extrabold tabular-nums">{lira(coupon.discount)}</span>
                                            <span className="text-[12px] text-[#6B7280]">{`${formatDate(coupon.expiresAt)} tarihine kadar`}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copy(coupon.code)}
                                            className="mt-3 w-full h-10 px-3  bg-[#F5F6F8] hover:bg-[#EEFBF3] flex items-center justify-between gap-2 transition-colors"
                                        >
                                            <span translate="no" className="text-[14.5px] font-bold tracking-[0.08em]">{coupon.code}</span>
                                            <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#1B7A43]">
                                                {copied === coupon.code ? <><Check className="w-3.5 h-3.5" /> Kopyalandı</> : <><Copy className="w-3.5 h-3.5" /> Kopyala</>}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                                Henüz kuponun yok. Yeterli kredi biriktiğinde soldan oluşturabilirsin.
                            </p>
                        )}
                    </section>

                    {pastCoupons.length > 0 && (
                        <section className="px-1">
                            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] mb-2.5">Geçmiş kuponlar</p>
                            <div className="space-y-1.5">
                                {pastCoupons.map(coupon => (
                                    <div key={coupon.code} className="flex items-center justify-between gap-3 text-[13px] text-[#9CA3AF]">
                                        <span translate="no" className="line-through truncate tracking-[0.06em]">{coupon.code}</span>
                                        <span className="shrink-0">{coupon.used ? 'Kullanıldı' : 'Süresi doldu'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Gamification;
