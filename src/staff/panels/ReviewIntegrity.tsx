import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Button, ReasonBox, formatDate } from '../ui';

/**
 * Şüpheli değerlendirmeler.
 *
 * Sunucu kural tabanlı bir puan üretiyor: kursa kayıtlı olmayan yorumcu,
 * on dakika içinde seri yorum, aynı metnin tekrarı, yeni hesap, kısa metinle
 * beş yıldız. Puan kesin karar değil; hangi yorumlara bakılacağını
 * söylüyor, kararı moderatör veriyor.
 *
 * Gizlenen yorum silinmiyor: katalogda görünmüyor ve kurs puanına
 * katılmıyor, ama kayıt duruyor. Silmek, hatalı kararın geri alınmasını
 * imkânsız kılardı.
 */
const ReviewIntegrity: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.suspiciousReviews();
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            <p className="text-[13.5px] text-slate-600 mb-4 max-w-2xl leading-relaxed">
                Kural tabanlı bir tarama. Puan 40 ve üzeri olan değerlendirmeler
                listeleniyor; yüksek puan kesin sahtelik değil, bakılması gereken
                kayıt anlamına geliyor.
            </p>

            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text="Şüpheli değerlendirme bulunamadı." />
            ) : (
                <div className="space-y-2">
                    {items.map(review => (
                        <Card key={review.review_id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-[14px] font-semibold text-slate-900">
                                            {review.user_name}
                                        </span>
                                        <Tag tone="neutral">{'★'.repeat(Number(review.rating))}</Tag>
                                        <span className="text-[12.5px] text-slate-500 truncate">
                                            {review.course_title}
                                        </span>
                                        <span className="text-[12px] text-slate-400 tabular-nums">
                                            {formatDate(review.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-[13.5px] text-slate-700 leading-relaxed mt-2">
                                        {review.comment || <span className="text-slate-400">(metin yok)</span>}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {review.signals.map((s: string, i: number) => (
                                            <Tag key={i} tone="warn">{s}</Tag>
                                        ))}
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className={`text-[24px] font-bold leading-none tabular-nums ${review.spam_score >= 70 ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                        {review.spam_score}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">şüphe puanı</p>
                                </div>
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
                                    <Button variant="danger" onClick={() => setActing(review.review_id)}>
                                        Gizle
                                    </Button>
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
