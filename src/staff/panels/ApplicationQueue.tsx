import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox, formatDate } from '../ui';

const TABS = [
    { value: 'pending', label: 'Bekleyen' },
    { value: 'approved', label: 'Onaylı' },
    { value: 'rejected', label: 'Reddedilen' },
];

/**
 * Eğitmen başvuruları.
 *
 * Başvuru anında otomatik onaylanıyordu; bu ekran onayı insana bağlıyor.
 * Onay verilmezse is_instructor kapalı kalıyor ve kişi eğitmen paneline
 * giremiyor.
 */
const ApplicationQueue: React.FC = () => {
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<{ id: number; approve: boolean } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.applications(status);
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const parseExpertise = (raw: any): string[] => {
        if (Array.isArray(raw)) return raw;
        if (!raw) return [];
        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : Object.values(parsed);
        } catch { return []; }
    };

    return (
        <div>
            <Tabs value={status} onChange={setStatus} options={TABS} />
            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text="Başvuru yok." />
            ) : (
                <div className="space-y-2">
                    {items.map(app => {
                        const expertise = parseExpertise(app.expertise);
                        const isActing = acting?.id === app.application_id;
                        return (
                            <Card key={app.application_id} className="p-4">
                                <div className="flex items-start gap-2.5 flex-wrap">
                                    <span className="text-[14.5px] font-semibold text-slate-900">{app.full_name}</span>
                                    {app.title && <Tag tone="info">{app.title}</Tag>}
                                    {app.account_status !== 'active' && (
                                        <Tag tone="danger">hesap {app.account_status}</Tag>
                                    )}
                                    {Number(app.course_count) > 0 && (
                                        <Tag tone="neutral">{app.course_count} kurs</Tag>
                                    )}
                                </div>
                                <p className="text-[12.5px] text-slate-500 mt-1">
                                    {app.email}
                                    <span className="mx-1.5 text-slate-300">·</span>
                                    {formatDate(app.created_at)}
                                </p>

                                {app.bio && (
                                    <p className="text-[13.5px] text-slate-700 leading-relaxed mt-3 whitespace-pre-line max-h-32 overflow-y-auto">
                                        {app.bio}
                                    </p>
                                )}

                                {expertise.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {expertise.map((e, i) => <Tag key={i}>{String(e)}</Tag>)}
                                    </div>
                                )}

                                {status === 'pending' && (
                                    isActing ? (
                                        <ReasonBox
                                            title={acting.approve ? 'Onay notu (isteğe bağlı)' : 'Red gerekçesi — başvurana iletilecek'}
                                            confirmLabel={acting.approve ? 'Onayla' : 'Reddet'}
                                            minLength={acting.approve ? 0 : 10}
                                            danger={!acting.approve}
                                            onCancel={() => setActing(null)}
                                            onConfirm={async (note) => {
                                                await staffApi.decideApplication(app.application_id, acting.approve, note);
                                                setActing(null);
                                                load();
                                            }}
                                        />
                                    ) : (
                                        <div className="flex gap-2 mt-4">
                                            <Button variant="primary" onClick={() => setActing({ id: app.application_id, approve: true })}>
                                                Onayla
                                            </Button>
                                            <Button onClick={() => setActing({ id: app.application_id, approve: false })}>
                                                Reddet
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

export default ApplicationQueue;
