import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Tabs, formatDate } from '../ui';

const TABS = [
    { value: 'completed', label: 'Tamamlanan' },
    { value: 'pending', label: 'Bekleyen' },
    { value: 'refunded', label: 'İade' },
    { value: 'cancelled', label: 'İptal' },
    { value: 'all', label: 'Hepsi' },
];

const money = (v: unknown) =>
    Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

const STATUS_TONE: Record<string, string> = {
    completed: 'ok', pending: 'warn', refunded: 'danger', cancelled: 'neutral',
};

/**
 * Satış raporu.
 *
 * Kaynak order_items — yani gerçekten ödeme yapılan kalemler. Gizli
 * paylaşımlar buraya hiç girmiyor, çünkü onların bir siparişi yok.
 *
 * Özet kutuları yalnızca tamamlanmış siparişleri sayıyor; bekleyen bir
 * ödemeyi ciroya yazmak, iptal edildiğinde rakamı geriye dönük bozardı.
 */
const Sales: React.FC = () => {
    const [status, setStatus] = useState('completed');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setData(await staffApi.sales({ status, limit: 60 }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    if (error) return <ErrorBox message={error} />;
    if (!data) return <Loading />;

    const maxDaily = Math.max(1, ...(data.daily || []).map((d: any) => Number(d.ciro)));

    return (
        <div className="space-y-7">
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Toplam ciro" value={money(data.summary.toplam.ciro)} sub={`${data.summary.toplam.adet} satış`} />
                <Stat label="Bu ay" value={money(data.summary.buAy.ciro)} sub={`${data.summary.buAy.adet} satış`} />
                <Stat label="Bugün" value={money(data.summary.bugun.ciro)} sub={`${data.summary.bugun.adet} satış`} />
                <Stat label="Verilen indirim" value={money(data.summary.toplam.indirim)} sub="tamamlanan siparişlerde" />
            </section>

            {(data.daily || []).length > 0 && (
                <section>
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                        Son 14 gün
                    </h2>
                    <Card className="p-5">
                        <div className="flex items-end gap-2 h-32">
                            {data.daily.map((d: any) => (
                                <div key={d.gun} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                    <div className="w-full flex-1 flex items-end">
                                        <div
                                            className="w-full rounded-t bg-slate-800"
                                            style={{ height: `${Math.max(3, (Number(d.ciro) / maxDaily) * 100)}%` }}
                                            title={`${money(d.ciro)} · ${d.adet} satış`}
                                        />
                                    </div>
                                    <span className="text-[10.5px] text-slate-500 tabular-nums">
                                        {new Date(d.gun).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>
            )}

            {(data.top || []).length > 0 && (
                <section>
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                        En çok kazandıran kurslar
                    </h2>
                    <Card className="divide-y divide-slate-100">
                        {data.top.map((t: any, i: number) => (
                            <div key={t.course_id} className="px-4 py-2.5 flex items-center gap-3">
                                <span className="text-[12px] text-slate-400 tabular-nums w-5">{i + 1}</span>
                                <span className="flex-1 text-[13.5px] text-slate-800 truncate">{t.title}</span>
                                <span className="text-[12.5px] text-slate-500 tabular-nums">{t.adet} satış</span>
                                <span className="text-[13.5px] font-semibold text-slate-900 tabular-nums w-28 text-right">
                                    {money(t.ciro)}
                                </span>
                            </div>
                        ))}
                    </Card>
                </section>
            )}

            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Satış kalemleri
                </h2>
                <Tabs value={status} onChange={setStatus} options={TABS} />

                {loading ? <Loading /> : data.items.length === 0 ? (
                    <Empty text="Bu durumda satış yok." />
                ) : (
                    <Card className="divide-y divide-slate-100">
                        {data.items.map((s: any) => (
                            <div key={s.order_item_id} className="px-4 py-3 flex items-start gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                                            {s.course_title}
                                        </span>
                                        <Tag tone={STATUS_TONE[s.status]}>{s.status}</Tag>
                                    </div>
                                    <p className="text-[12.5px] text-slate-500 mt-1">
                                        {s.buyer_name || 'bilinmiyor'} · {s.buyer_email}
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        eğitmen: {s.instructor_name || '—'}
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        #{s.order_id}
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        {formatDate(s.order_date)}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-[14px] font-semibold text-slate-900 tabular-nums">
                                        {money(s.price)}
                                    </p>
                                    {Number(s.discount_amount) > 0 && (
                                        <p className="text-[11.5px] text-slate-500 tabular-nums">
                                            −{money(s.discount_amount)} indirim
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Card>
                )}
            </section>
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <Card className="p-4">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-[21px] font-bold text-slate-900 leading-none tabular-nums mt-2">{value}</p>
        <p className="text-[12px] text-slate-500 mt-1.5">{sub}</p>
    </Card>
);

export default Sales;
