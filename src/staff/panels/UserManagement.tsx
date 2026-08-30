import React, { useCallback, useEffect, useState } from 'react';
import { staffApi, PERMISSIONS as P } from '../staffApi';
import type { StaffUser } from '../StaffPortal';
import {
    Card, Empty, Loading, ErrorBox, Tag, Button, Tabs, ReasonBox,
    inputClass, formatDate,
} from '../ui';

const STATUS_TABS = [
    { value: '', label: 'Hepsi' },
    { value: 'active', label: 'Etkin' },
    { value: 'suspended', label: 'Askıda' },
    { value: 'banned', label: 'Kapalı' },
];

const SANCTION_REASONS = [
    { value: 'spam', label: 'Spam' },
    { value: 'fraud', label: 'Dolandırıcılık' },
    { value: 'copyright', label: 'Telif ihlali' },
    { value: 'harassment', label: 'Taciz' },
    { value: 'fake_reviews', label: 'Sahte değerlendirme' },
    { value: 'coupon_abuse', label: 'Kupon istismarı' },
    { value: 'policy', label: 'Politika ihlali' },
    { value: 'other', label: 'Diğer' },
];

const STATUS_TONE: Record<string, string> = { active: 'ok', suspended: 'warn', banned: 'danger' };
const STATUS_LABEL: Record<string, string> = { active: 'Etkin', suspended: 'Askıda', banned: 'Kapalı' };

const UserManagement: React.FC<{ staff: StaffUser }> = ({ staff }) => {
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffApi.users({ status, q, limit: 50 });
            setItems(data.items);
            setTotal(data.total);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [status, q]);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            <Tabs value={status} onChange={(v) => { setStatus(v); setOpenId(null); }} options={STATUS_TABS} />

            <div className="flex items-center gap-3 mb-4">
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Ad veya e-posta ara"
                    className={`${inputClass} max-w-xs`}
                />
                <span className="text-[13px] text-slate-500 tabular-nums">{total} kayıt</span>
            </div>

            {error && <ErrorBox message={error} />}
            {loading ? <Loading /> : items.length === 0 ? <Empty text="Kayıt yok." /> : (
                <div className="space-y-2">
                    {items.map(user => (
                        <UserRow
                            key={user.user_id}
                            user={user}
                            staff={staff}
                            expanded={openId === user.user_id}
                            onToggle={() => setOpenId(openId === user.user_id ? null : user.user_id)}
                            onChanged={load}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const UserRow: React.FC<{
    user: any;
    staff: StaffUser;
    expanded: boolean;
    onToggle: () => void;
    onChanged: () => void;
}> = ({ user, staff, expanded, onToggle, onChanged }) => {
    const [detail, setDetail] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<null | 'warning' | 'suspension' | 'ban' | 'lift'>(null);
    const [reason, setReason] = useState('policy');
    const [days, setDays] = useState(7);

    useEffect(() => {
        if (!expanded || detail) return;
        staffApi.user(user.user_id).then(setDetail).catch(e => setError(e.message));
    }, [expanded, detail, user.user_id]);

    const canSanction = staff.permissions.includes(P.USER_SANCTION);

    const apply = async (note: string) => {
        setError(null);
        try {
            if (mode === 'lift') {
                await staffApi.liftSanction(user.user_id, note);
            } else {
                await staffApi.sanction(user.user_id, { type: mode, reason, note, days });
            }
            setMode(null);
            setDetail(null);
            onChanged();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <Card>
            <button
                onClick={onToggle}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[14.5px] font-semibold text-slate-900">
                            {user.first_name} {user.last_name}
                        </span>
                        <Tag tone={STATUS_TONE[user.account_status]}>{STATUS_LABEL[user.account_status]}</Tag>
                        {Boolean(user.is_instructor) && <Tag tone="info">Eğitmen</Tag>}
                        {Number(user.report_count) > 0 && (
                            <Tag tone="warn">{user.report_count} şikâyet</Tag>
                        )}
                    </div>
                    <p className="text-[12.5px] text-slate-500 mt-1.5">
                        {user.email}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {user.course_count} kurs
                        <span className="mx-1.5 text-slate-300">·</span>
                        {user.enrollment_count} kayıt
                        <span className="mx-1.5 text-slate-300">·</span>
                        {formatDate(user.created_at)}
                    </p>
                    {user.status_reason && (
                        <p className="text-[12.5px] text-red-600 mt-1">{user.status_reason}</p>
                    )}
                </div>
                <span className="text-slate-400 text-[13px] shrink-0 mt-0.5">{expanded ? '−' : '+'}</span>
            </button>

            {expanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-50/60">
                    {error && <div className="mb-3"><ErrorBox message={error} /></div>}
                    {!detail ? <Loading /> : (
                        <>
                            {detail.sanctions.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Yaptırım geçmişi
                                    </p>
                                    <div className="rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
                                        {detail.sanctions.map((s: any) => (
                                            <div key={s.id} className="px-3 py-2.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Tag tone={s.type === 'ban' ? 'danger' : s.type === 'suspension' ? 'warn' : 'neutral'}>
                                                        {s.type === 'ban' ? 'Kapatma' : s.type === 'suspension' ? 'Askı' : 'Uyarı'}
                                                    </Tag>
                                                    <span className="text-[12.5px] text-slate-500">
                                                        {SANCTION_REASONS.find(r => r.value === s.reason)?.label || s.reason}
                                                    </span>
                                                    <span className="text-[12px] text-slate-400 tabular-nums">
                                                        {formatDate(s.created_at)}
                                                    </span>
                                                    {s.lifted_at && <Tag tone="ok">kaldırıldı</Tag>}
                                                </div>
                                                <p className="text-[13px] text-slate-700 mt-1">{s.note}</p>
                                                {s.issued_by_name && (
                                                    <p className="text-[11.5px] text-slate-400 mt-0.5">{s.issued_by_name}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {detail.courses.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Kursları
                                    </p>
                                    <ul className="space-y-1">
                                        {detail.courses.slice(0, 10).map((c: any) => (
                                            <li key={c.course_id} className="text-[13px] text-slate-700 flex items-center gap-2">
                                                <span className="truncate">{c.title}</span>
                                                <Tag tone={c.review_status === 'approved' ? 'ok' : 'neutral'}>
                                                    {c.review_status}
                                                </Tag>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {canSanction && (mode === null ? (
                                <div className="flex flex-wrap gap-2">
                                    {detail.user.account_status !== 'active' ? (
                                        <Button variant="primary" onClick={() => setMode('lift')}>
                                            Kısıtlamayı kaldır
                                        </Button>
                                    ) : (
                                        <>
                                            <Button onClick={() => setMode('warning')}>Uyar</Button>
                                            <Button onClick={() => setMode('suspension')}>Askıya al</Button>
                                            <Button variant="danger" onClick={() => setMode('ban')}>Hesabı kapat</Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {mode !== 'lift' && (
                                        <div className="flex flex-wrap items-end gap-3 mb-3">
                                            <div>
                                                <label className="block text-[12px] font-semibold text-slate-700 mb-1">Sebep</label>
                                                <select
                                                    value={reason}
                                                    onChange={e => setReason(e.target.value)}
                                                    className={`${inputClass} w-48`}
                                                >
                                                    {SANCTION_REASONS.map(r => (
                                                        <option key={r.value} value={r.value}>{r.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {mode === 'suspension' && (
                                                <div>
                                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Süre (gün)</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={365}
                                                        value={days}
                                                        onChange={e => setDays(Number(e.target.value))}
                                                        className={`${inputClass} w-24`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <ReasonBox
                                        title={
                                            mode === 'lift' ? 'Kaldırma notu'
                                                : 'Açıklama — kullanıcıya bildirim olarak iletilecek'
                                        }
                                        confirmLabel={
                                            mode === 'lift' ? 'Kısıtlamayı kaldır'
                                                : mode === 'warning' ? 'Uyarı gönder'
                                                    : mode === 'suspension' ? `${days} gün askıya al` : 'Hesabı kapat'
                                        }
                                        minLength={mode === 'lift' ? 0 : 10}
                                        danger={mode === 'ban'}
                                        onCancel={() => setMode(null)}
                                        onConfirm={apply}
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </Card>
    );
};

export default UserManagement;
