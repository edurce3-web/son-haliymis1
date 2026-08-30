import React, { useCallback, useEffect, useState } from 'react';
import { staffApi, PERMISSIONS as P } from '../staffApi';
import type { StaffUser } from '../StaffPortal';
import { Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox, formatDate } from '../ui';

const TABS = [
    { value: 'received', label: 'Yeni' },
    { value: 'in_review', label: 'İncelemede' },
    { value: 'content_removed', label: 'İçerik kaldırıldı' },
    { value: 'rejected', label: 'Reddedildi' },
    { value: 'counter_claimed', label: 'Karşı bildirim' },
];

const TARGET_LABEL: Record<string, string> = {
    course: 'Kurs', lesson: 'Ders', book: 'Kitap', resource: 'Kaynak',
};

/**
 * Telif hakkı bildirimleri.
 *
 * "İçerik kaldırıldı" seçildiğinde sunucu ilgili kursu ya da dersi gerçekten
 * yayından çekiyor. Bildirimin durumunu değiştirip içeriği yayında bırakmak,
 * kayıtta çözülmüş ama gerçekte çözülmemiş bir dosya bırakırdı.
 */
const DmcaQueue: React.FC<{ staff: StaffUser }> = ({ staff }) => {
    const [status, setStatus] = useState('received');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<{ id: number; next: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.dmca(status);
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const canRemove = staff.permissions.includes(P.CONTENT_TAKEDOWN);

    return (
        <div>
            <Tabs value={status} onChange={setStatus} options={TABS} />
            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? (
                <Empty text="Bu durumda bildirim yok." />
            ) : (
                <div className="space-y-2">
                    {items.map(notice => {
                        const isActing = acting?.id === notice.id;
                        return (
                            <Card key={notice.id} className="p-4">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-[14px] font-semibold text-slate-900">
                                        DMCA-{notice.id}
                                    </span>
                                    <Tag tone="warn">{TARGET_LABEL[notice.target_type] || notice.target_type}</Tag>
                                    {notice.target_id && (
                                        <span className="text-[13px] text-slate-500">#{notice.target_id}</span>
                                    )}
                                    <span className="text-[12px] text-slate-400 tabular-nums">
                                        {formatDate(notice.created_at)}
                                    </span>
                                </div>

                                <dl className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-3">
                                    <Meta label="Hak sahibi" value={notice.claimant_name} />
                                    <Meta label="E-posta" value={notice.claimant_email} />
                                    <Meta label="Kurum" value={notice.claimant_org || '—'} />
                                </dl>

                                {notice.target_url && (
                                    <a
                                        href={notice.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-[13px] text-sky-700 hover:underline mt-2 break-all"
                                    >
                                        {notice.target_url}
                                    </a>
                                )}

                                <p className="text-[13.5px] text-slate-700 leading-relaxed mt-3 whitespace-pre-line max-h-40 overflow-y-auto">
                                    {notice.work_description}
                                </p>

                                {notice.action_note && (
                                    <p className="text-[12.5px] text-slate-600 mt-3 border-l-2 border-slate-200 pl-2.5">
                                        {notice.action_note}
                                    </p>
                                )}

                                {['received', 'in_review'].includes(notice.status) && (
                                    isActing ? (
                                        <ReasonBox
                                            title="Karar notu — dosyaya işlenecek"
                                            confirmLabel={
                                                acting.next === 'content_removed' ? 'İçeriği kaldır'
                                                    : acting.next === 'rejected' ? 'Bildirimi reddet'
                                                        : 'İncelemeye al'
                                            }
                                            minLength={acting.next === 'in_review' ? 0 : 10}
                                            danger={acting.next === 'content_removed'}
                                            onCancel={() => setActing(null)}
                                            onConfirm={async (note) => {
                                                await staffApi.resolveDmca(notice.id, acting.next, note);
                                                setActing(null);
                                                load();
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {canRemove && (
                                                <Button variant="danger" onClick={() => setActing({ id: notice.id, next: 'content_removed' })}>
                                                    İçeriği kaldır
                                                </Button>
                                            )}
                                            <Button onClick={() => setActing({ id: notice.id, next: 'rejected' })}>
                                                Reddet
                                            </Button>
                                            {notice.status === 'received' && (
                                                <Button onClick={() => setActing({ id: notice.id, next: 'in_review' })}>
                                                    İncelemeye al
                                                </Button>
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

const Meta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="min-w-0">
        <dt className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="text-[13px] text-slate-800 mt-0.5 truncate">{value}</dd>
    </div>
);

export default DmcaQueue;
