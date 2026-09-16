import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox, formatDate } from '../ui';

const TABS = [
    { value: 'low', label: 'Düşük puanlı' },
    { value: 'suspicious', label: 'Şüpheli' },
];

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

/**
 * Değerlendirme denetimi — iki liste.
 *
 * "Düşük puanlı": 1-2 yıldızlı yorumlar. Kötü yorum bir ihlal değil, ama
 * eğitmen-öğrenci anlaşmazlıklarının çoğu buradan çıkıyor; moderatörün
 * görmesi gereken ilk yer.
 *
 * "Şüpheli": sunucunun kural tabanlı puanı — kursa kayıtlı olmayan yorumcu,
 * seri yorum, kopya metin, yeni hesap. Puan kesin karar değil; hangi
 * yorumlara bakılacağını söylüyor.
 *
 * Gizlenen yorum silinmiyor: katalogda görünmüyor, kurs puanına katılmıyor,
 * ama kayıt duruyor. Silmek, hatalı kararın geri alınmasını imkânsız kılardı.
 */
const ReviewIntegrity: React.FC = () => {
    const [tab, setTab] = useState('low');
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (tab === 'low') {
                const data = await staffApi.lowReviews({ max: 2, limit: 60 });
                setItems(data.items);
                setTotal(data.total);
            } else {
                const data = await staffApi.suspiciousReviews();
                setItems(data.items);
                setTotal(null);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            <Tabs value={tab} onChange={setTab} options={TABS} />

            <p className="text-[13.5px] text-slate-600 mb-4 max-w-2xl leading-relaxed">
                {tab === 'low'
                    ? `1 ve 2 yıldızlı değerlendirmeler${total !== null ? ` (${total})` : ''}. Düşük puan tek başına bir ihlal değil; burada listelenmesi yalnızca bakılmasını kolaylaştırıyor.`
                    : 'Kural tabanlı tarama. Puan 40 ve üzeri olanlar listeleniyor; yüksek puan kesin sahtelik değil, bakılması gereken kayıt anlamına geliyor.'}
            </p>

            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text={tab === 'low' ? 'Düşük puanlı değerlendirme yok.' : 'Şüpheli değerlendirme bulunamadı.'} />
            ) : (
                <div className="space-y-2">
                    {items.map(review => (
                        <Card key={review.review_id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className={`text-[14px] tabular-nums ${Number(review.rating) <= 2 ? 'text-red-600' : 'text-amber-600'
                                            }`}>
                                            {stars(Number(review.rating))}
                                        </span>
                                        <span className="text-[14px] font-semibold text-slate-900">
                                            {review.user_name}
                                        </span>
                                        {review.is_hidden ? <Tag tone="neutral">gizli</Tag> : null}
                                        {Number(review.report_count) > 0 && (
                                            <Tag tone="warn">{review.report_count} şikâyet</Tag>
                                        )}
                                        <span className="text-[12px] text-slate-400 tabular-nums">
                                            {formatDate(review.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-[12.5px] text-slate-500 mt-1">
                                        {review.course_title}
                                        {review.instructor_name && (
                                            <>
                                                <span className="mx-1.5 text-slate-300">·</span>
                                                eğitmen: {review.instructor_name}
                                            </>
                                        )}
                                    </p>

                                    <p className="text-[13.5px] text-slate-700 leading-relaxed mt-2.5">
                                        {review.comment || <span className="text-slate-400">(metin yok)</span>}
                                    </p>

                                    {review.signals?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                            {review.signals.map((s: string, i: number) => (
                                                <Tag key={i} tone="warn">{s}</Tag>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {tab === 'suspicious' && (
                                    <div className="shrink-0 text-right">
                                        <p className={`text-[24px] font-bold leading-none tabular-nums ${review.spam_score >= 70 ? 'text-red-600' : 'text-amber-600'
                                            }`}>
                                            {review.spam_score}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">şüphe puanı</p>
                                    </div>
                                )}
                            </div>

                            {acting === review.review_id ? (
                                <ReasonBox
                                    title="Gizleme gerekçesi — kayda geçecek"
                                    confirmLabel="Yorumu gizle"
                                    danger
                                    onCancel={() => setActing(null)}
                                    onConfirm={async (note) => {
                                        await staffApi.hideReview(review.review_id, true, note);
                                        setActing(null);
                                        load();
                                    }}
                                />
                            ) : (
                                <div className="flex gap-2 mt-4">
                                    {review.is_hidden ? (
                                        <Button
                                            onClick={async () => {
                                                await staffApi.hideReview(review.review_id, false, '');
                                                load();
                                            }}
                                        >
                                            Geri al
                                        </Button>
                                    ) : (
                                        <Button variant="danger" onClick={() => setActing(review.review_id)}>
                                            Gizle
                                        </Button>
                                    )}
                                    <a
                                        href={`https://edurce.com/course/${review.course_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-9 px-3.5 leading-9 rounded-md border border-slate-300 text-[13px] font-semibold text-slate-700 hover:border-slate-400"
                                    >
                                        Kursu aç
                                    </a>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewIntegrity;
