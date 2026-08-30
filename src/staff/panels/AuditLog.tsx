import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, Button, inputClass, formatDate } from '../ui';

const FILTERS = [
    { value: '', label: 'Hepsi' },
    { value: 'course', label: 'Kurs' },
    { value: 'user', label: 'Hesap' },
    { value: 'lesson', label: 'Ders' },
    { value: 'report', label: 'Şikâyet' },
    { value: 'appeal', label: 'İtiraz' },
    { value: 'dmca', label: 'Telif' },
    { value: 'review', label: 'Değerlendirme' },
    { value: 'staff', label: 'Ekip' },
    { value: 'announcement', label: 'Duyuru' },
];

/** Eylem adına göre renk — hangi tür işlem olduğu listede tek bakışta görünsün. */
const toneFor = (action: string) => {
    if (action.includes('rejected') || action.includes('ban') || action.includes('taken_down')
        || action.includes('removed') || action.includes('hidden') || action.includes('failed')) return 'danger';
    if (action.includes('approved') || action.includes('restored') || action.includes('lifted')) return 'ok';
    if (action.includes('suspension') || action.includes('warning')) return 'warn';
    return 'neutral';
};

/**
 * Denetim günlüğü.
 *
 * Yalnızca okunur. Kayıt düzenleme ya da silme uçları bilerek yazılmadı:
 * moderatörün ne yaptığını moderatörün kendisi de değiştirememeli.
 */
const AuditLog: React.FC = () => {
    const [filter, setFilter] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.audit({ action: filter, page, limit: 50 });
            setItems(data.items);
            setTotal(data.total);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => { load(); }, [load]);

    const pages = Math.max(1, Math.ceil(total / 50));

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <select
                    value={filter}
                    onChange={e => { setFilter(e.target.value); setPage(1); }}
                    className={`${inputClass} w-48`}
                >
                    {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <span className="text-[13px] text-slate-500 tabular-nums">{total} kayıt</span>
            </div>

            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? <Empty text="Kayıt yok." /> : (
                <>
                    <Card className="divide-y divide-slate-100">
                        {items.map(entry => (
                            <div key={entry.id} className="px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-[12px] text-slate-400 tabular-nums shrink-0 w-32 pt-0.5">
                                        {formatDate(entry.created_at)}
                                    </span>
                                    <Tag tone={toneFor(entry.action)}>{entry.action}</Tag>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13.5px] text-slate-800">
                                            {entry.summary || '—'}
                                        </p>
                                        <p className="text-[11.5px] text-slate-400 mt-0.5">
                                            {entry.actor_name || 'sistem'}
                                            {entry.actor_email && ` <${entry.actor_email}>`}
                                            {entry.ip && <span className="ml-2 font-mono">{entry.ip}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>

                    {pages > 1 && (
                        <div className="flex items-center gap-3 mt-4">
                            <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Önceki</Button>
                            <span className="text-[13px] text-slate-500 tabular-nums">{page} / {pages}</span>
                            <Button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Sonraki</Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLog;
