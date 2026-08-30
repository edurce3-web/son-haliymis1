import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import { Card, Loading, ErrorBox, Tag, Button, Field, inputClass, textareaClass, formatDate } from '../ui';

const AUDIENCES = [
    { value: 'all', label: 'Herkes' },
    { value: 'students', label: 'Yalnızca öğrenciler' },
    { value: 'instructors', label: 'Yalnızca eğitmenler' },
    { value: 'staff', label: 'Yalnızca ekip' },
];

/**
 * Toplu duyuru.
 *
 * Gönderim geri alınamıyor; bu yüzden gönder düğmesi ikinci bir onay
 * istiyor ve kaç kişiye gideceği önceden yazıyor. Duyurular bildirim olarak
 * iletiliyor, e-posta olarak değil — pazarlama e-postası göndermeme
 * ilkesiyle çelişmemesi için.
 */
const Announcements: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [audience, setAudience] = useState('all');
    const [actionUrl, setActionUrl] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [sending, setSending] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await staffApi.announcements();
            setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const canSend = title.trim().length >= 3 && body.trim().length >= 10;

    const send = async () => {
        setSending(true);
        setError(null);
        try {
            const res: any = await staffApi.sendAnnouncement({
                title: title.trim(), body: body.trim(), audience,
                actionUrl: actionUrl.trim() || undefined,
            });
            setTitle(''); setBody(''); setActionUrl(''); setConfirming(false);
            await load();
            alert(`Duyuru ${res.recipients} kişiye gönderildi.`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-7">
            <Card className="p-5 max-w-2xl">
                <h2 className="text-[15px] font-bold text-slate-900 mb-4">Yeni duyuru</h2>
                {error && <div className="mb-3"><ErrorBox message={error} /></div>}

                <div className="space-y-4">
                    <Field label="Başlık">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={160}
                            className={inputClass}
                            placeholder="Örn: Bakım çalışması"
                        />
                    </Field>

                    <Field label="İçerik" hint="Bildirim olarak iletilir; kısa ve net olması yeterli.">
                        <textarea
                            rows={4}
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className={textareaClass}
                        />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Alıcı">
                            <select value={audience} onChange={e => setAudience(e.target.value)} className={inputClass}>
                                {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Bağlantı" hint="İsteğe bağlı. Bildirime tıklayınca açılır.">
                            <input
                                value={actionUrl}
                                onChange={e => setActionUrl(e.target.value)}
                                className={inputClass}
                                placeholder="/help"
                            />
                        </Field>
                    </div>

                    {confirming ? (
                        <div className="rounded-md border border-amber-300 bg-amber-50 p-3.5">
                            <p className="text-[13px] text-amber-900 leading-relaxed">
                                Bu duyuru <strong>{AUDIENCES.find(a => a.value === audience)?.label.toLowerCase()}</strong>{' '}
                                grubuna gönderilecek. Gönderim geri alınamaz.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <Button variant="primary" onClick={send} disabled={sending}>
                                    {sending ? 'Gönderiliyor…' : 'Evet, gönder'}
                                </Button>
                                <Button onClick={() => setConfirming(false)} disabled={sending}>Vazgeç</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="primary" disabled={!canSend} onClick={() => setConfirming(true)}>
                            Gönder
                        </Button>
                    )}
                </div>
            </Card>

            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Gönderilmiş duyurular
                </h2>
                {loading ? <Loading /> : items.length === 0 ? (
                    <p className="text-[13.5px] text-slate-500">Henüz duyuru gönderilmedi.</p>
                ) : (
                    <div className="space-y-2">
                        {items.map(a => (
                            <Card key={a.id} className="p-4">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-[14px] font-semibold text-slate-900">{a.title}</span>
                                    <Tag tone="info">
                                        {AUDIENCES.find(x => x.value === a.audience)?.label || a.audience}
                                    </Tag>
                                    <Tag tone="neutral">{a.recipients_count} alıcı</Tag>
                                    <span className="text-[12px] text-slate-400 tabular-nums">
                                        {formatDate(a.sent_at || a.created_at)}
                                    </span>
                                </div>
                                <p className="text-[13.5px] text-slate-700 leading-relaxed mt-2 whitespace-pre-line">
                                    {a.body}
                                </p>
                                {a.created_by_name && (
                                    <p className="text-[11.5px] text-slate-400 mt-2">{a.created_by_name}</p>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Announcements;
