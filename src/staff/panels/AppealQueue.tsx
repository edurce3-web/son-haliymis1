import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox, formatDate } from '../ui';

const TABS = [
    { value: 'open', label: 'Açık' },
    { value: 'in_review', label: 'İncelemede' },
    { value: 'upheld', label: 'Karar korundu' },
    { value: 'overturned', label: 'Karar bozuldu' },
];

const SUBJECT_LABEL: Record<string, string> = {
    course: 'Kurs kararı', book: 'Kitap kararı',
    account: 'Hesap kısıtlaması', review: 'Değerlendirme',
};

/**
 * İtiraz kuyruğu.
 *
 * İki sonuç var: kararı korumak (upheld) ya da bozmak (overturned). Karar
 * bozulduğunda ilgili içeriğin geri alınması ayrı bir işlem; bilerek otomatik
 * değil, çünkü hangi kısmın geri alınacağı itiraza göre değişiyor.
 */
const AppealQueue: React.FC = () => {
    const [status, setStatus] = useState('open');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<{ id: number; decision: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.appeals(status);
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            <Tabs value={status} onChange={setStatus} options={TABS} />
            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text="Bu durumda itiraz yok." />
            ) : (
                <div className="space-y-2">
                    {items.map(appeal => {
                        const isActing = acting?.id === appeal.id;
                        return (
                            <Card key={appeal.id} className="p-4">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <Tag tone="info">{SUBJECT_LABEL[appeal.subject_type] || appeal.subject_type}</Tag>
                                    {appeal.subject_id && (
                                        <span className="text-[13px] text-slate-500">#{appeal.subject_id}</span>
                                    )}
                                    <span className="text-[14px] font-semibold text-slate-900">{appeal.user_name}</span>
                                    <span className="text-[12.5px] text-slate-500">{appeal.email}</span>
                                    <span className="text-[12px] text-slate-400 tabular-nums">
                                        {formatDate(appeal.created_at)}
                                    </span>
                                </div>

                                <p className="text-[13.5px] text-slate-700 leading-relaxed mt-3 whitespace-pre-line max-h-48 overflow-y-auto">
                                    {appeal.message}
                                </p>

                                {appeal.decision_note && (
                                    <p className="text-[12.5px] text-slate-600 mt-3 border-l-2 border-slate-200 pl-2.5">
                                        {appeal.decision_note}
                                    </p>
                                )}

                                {['open', 'in_review'].includes(appeal.status) && (
                                    isActing ? (
                                        <ReasonBox
                                            title="Gerekçe — itiraz sahibine aynen iletilecek"
                                            confirmLabel={acting.decision === 'upheld' ? 'Kararı koru' : 'Kararı boz'}
                                            danger={acting.decision === 'upheld'}
                                            onCancel={() => setActing(null)}
                                            onConfirm={async (note) => {
                                                await staffApi.decideAppeal(appeal.id, acting.decision, note);
                                                setActing(null);
                                                load();
                                            }}
                                        />
                                    ) : (
                                        <div className="flex gap-2 mt-4">
                                            <Button variant="primary" onClick={() => setActing({ id: appeal.id, decision: 'overturned' })}>
                                                Kararı boz
                                            </Button>
                                            <Button onClick={() => setActing({ id: appeal.id, decision: 'upheld' })}>
                                                Kararı koru
                                            </Button>
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

export default AppealQueue;
