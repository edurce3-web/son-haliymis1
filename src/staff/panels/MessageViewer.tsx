import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Empty, Loading, ErrorBox, Tag, inputClass, formatDate } from '../ui';

/**
 * Yazışma görüntüleyici.
 *
 * Solda yazışmalar (her çift için son mesaj), sağda seçilen yazışmanın
 * tamamı. Moderatörün sadece okuma yetkisi var; panelden mesaj gönderilmiyor.
 *
 * Bir yazışmanın açılması denetim günlüğüne yazılıyor. Özel yazışmaları
 * okumak gereken bir yetki ama iz bırakmadan kullanılmamalı.
 */
const MessageViewer: React.FC = () => {
    const [q, setQ] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState<{ a: number; b: number; title: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await staffApi.messages({ q, limit: 60 });
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [q]);

    useEffect(() => {
        const t = setTimeout(load, q ? 350 : 0);
        return () => clearTimeout(t);
    }, [load, q]);

    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Kişi veya mesaj içeriğinde ara"
                    className={`${inputClass} max-w-sm`}
                />
            </div>

            {error && <ErrorBox message={error} />}

            <div className="grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4">
                <div>
                    {loading ? <Loading /> : items.length === 0 ? (
                        <Empty text="Yazışma bulunamadı." />
                    ) : (
                        <Card className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                            {items.map(m => {
                                const isActive = active?.a === m.sender_id && active?.b === m.receiver_id;
                                return (
                                    <button
                                        key={m.message_id}
                                        onClick={() => setActive({
                                            a: m.sender_id,
                                            b: m.receiver_id,
                                            title: `${m.sender_name} ↔ ${m.receiver_name}`,
                                        })}
                                        className={`w-full px-4 py-3 text-left transition-colors ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                                                {m.sender_name} ↔ {m.receiver_name}
                                            </span>
                                            <Tag tone="neutral">{m.message_count}</Tag>
                                        </div>
                                        <p className="text-[12.5px] text-slate-600 mt-1 line-clamp-2">
                                            {m.message_content}
                                        </p>
                                        <p className="text-[11.5px] text-slate-400 mt-1 tabular-nums">
                                            {formatDate(m.sent_at)}
                                        </p>
                                    </button>
                                );
                            })}
                        </Card>
                    )}
                </div>

                <div>
                    {active ? (
                        <Thread a={active.a} b={active.b} title={active.title} />
                    ) : (
                        <Empty text="Soldan bir yazışma seçin." />
                    )}
                </div>
            </div>
        </div>
    );
};

const Thread: React.FC<{ a: number; b: number; title: string }> = ({ a, b, title }) => {
    const [items, setItems] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setItems(null);
        staffApi.messageThread(a, b)
            .then(d => setItems(d.items))
            .catch(e => setError(e.message));
    }, [a, b]);

    if (error) return <ErrorBox message={error} />;

    return (
        <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-[13.5px] font-semibold text-slate-900">{title}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Bu yazışmayı açtığınız kayda geçti.
                </p>
            </div>

            {!items ? <Loading /> : items.length === 0 ? (
                <p className="p-6 text-[13.5px] text-slate-500">Mesaj yok.</p>
            ) : (
                <div className="p-4 space-y-3 max-h-[62vh] overflow-y-auto">
                    {items.map(m => {
                        const fromFirst = m.sender_id === a;
                        return (
                            <div
                                key={m.message_id}
                                className={`max-w-[80%] ${fromFirst ? '' : 'ml-auto'}`}
                            >
                                <div
                                    className={`rounded-lg px-3.5 py-2.5 ${fromFirst
                                        ? 'bg-slate-100 text-slate-800'
                                        : 'bg-slate-800 text-slate-100'
                                        }`}
                                >
                                    {m.subject && (
                                        <p className="text-[12px] font-semibold opacity-70 mb-1">{m.subject}</p>
                                    )}
                                    <p className="text-[13.5px] leading-relaxed whitespace-pre-line break-words">
                                        {m.message_content}
                                    </p>
                                </div>
                                <p className={`text-[11px] text-slate-400 mt-1 tabular-nums ${fromFirst ? '' : 'text-right'}`}>
                                    {m.sender_name} · {formatDate(m.sent_at)}
                                    {!m.is_read && ' · okunmadı'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

export default MessageViewer;
