import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox, formatDate } from '../ui';

const TABS = [
    { value: 'open', label: 'Açık' },
    { value: 'in_review', label: 'İncelemede' },
    { value: 'actioned', label: 'İşlem yapıldı' },
    { value: 'dismissed', label: 'Reddedildi' },
];

const CATEGORY_LABEL: Record<string, string> = {
    spam: 'Spam', harassment: 'Taciz', copyright: 'Telif',
    misleading: 'Yanıltıcı', sexual: 'Cinsel içerik', violence: 'Şiddet', other: 'Diğer',
};

const TARGET_LABEL: Record<string, string> = {
    course: 'Kurs', lesson: 'Ders', review: 'Değerlendirme',
    question: 'Soru', answer: 'Cevap', message: 'Mesaj', user: 'Kullanıcı',
};

/**
 * Şikâyet kuyruğu.
 *
 * Karar iki seçenekli tutuldu: işlem yapıldı ya da reddedildi. Ara durumlar
 * ("belki", "sonra bakılacak") kuyruğu şişiriyor ve hiçbir zaman
 * boşalmıyordu; şikâyeti kapatmak, ilgili içeriğe ayrı bir işlem uygulamaya
 * engel değil.
 */
const ReportQueue: React.FC = () => {
    const [status, setStatus] = useState('open');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<{ id: number; action: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.reports(status);
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const targetLink = (r: any) => {
        if (r.target_type === 'course') return `https://edurce.com/course/${r.target_id}`;
        if (r.target_type === 'user') return `https://edurce.com/user/${r.target_id}`;
        return null;
    };

    return (
        <div>
            <Tabs value={status} onChange={setStatus} options={TABS} />
            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text="Bu durumda şikâyet yok." />
            ) : (
                <div className="space-y-2">
                    {items.map(report => {
                        const link = targetLink(report);
                        const isActing = acting?.id === report.id;
                        return (
                            <Card key={report.id} className="p-4">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <Tag tone="warn">{CATEGORY_LABEL[report.category] || report.category}</Tag>
                                    <span className="text-[14px] font-semibold text-slate-900">
                                        {TARGET_LABEL[report.target_type] || report.target_type} #{report.target_id}
                                    </span>
                                    <span className="text-[12px] text-slate-400 tabular-nums">
                                        {formatDate(report.created_at)}
                                    </span>
                                </div>

                                {report.detail && (
                                    <p className="text-[13.5px] text-slate-700 leading-relaxed mt-2.5 whitespace-pre-line">
                                        {report.detail}
                                    </p>
                                )}

                                <p className="text-[12.5px] text-slate-500 mt-2">
                                    Bildiren: {report.reporter_name || 'anonim'}
                                </p>

                                {report.resolution && (
                                    <p className="text-[12.5px] text-slate-600 mt-2 border-l-2 border-slate-200 pl-2.5">
                                        {report.resolution}
                                    </p>
                                )}

                                {['open', 'in_review'].includes(report.status) && (
                                    isActing ? (
                                        <ReasonBox
                                            title={acting.action === 'actioned'
                                                ? 'Ne yapıldı? — kayda geçecek'
                                                : 'Neden işlem yapılmadı? — kayda geçecek'}
                                            confirmLabel={acting.action === 'actioned' ? 'İşlem yapıldı olarak kapat' : 'Reddet'}
                                            danger={acting.action === 'actioned'}
                                            onCancel={() => setActing(null)}
                                            onConfirm={async (note) => {
                                                await staffApi.resolveReport(report.id, acting.action, note);
                                                setActing(null);
                                                load();
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <Button variant="primary" onClick={() => setActing({ id: report.id, action: 'actioned' })}>
                                                İşlem yapıldı
                                            </Button>
                                            <Button onClick={() => setActing({ id: report.id, action: 'dismissed' })}>
                                                Reddet
                                            </Button>
                                            {link && (
                                                <a
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-9 px-3.5 leading-9 rounded-md border border-slate-300 text-[13px] font-semibold text-slate-700 hover:border-slate-400"
                                                >
                                                    İçeriği aç
                                                </a>
                                            )}
                                        </div>
                                    )
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReportQueue;
