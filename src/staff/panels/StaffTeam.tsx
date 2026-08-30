import React, { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../staffApi';
import type { StaffUser } from '../StaffPortal';
import { Card, Loading, ErrorBox, Tag, Button, Field, inputClass, formatDate } from '../ui';

/**
 * Ekip yönetimi.
 *
 * Sahip (owner) rolü bu ekrandan verilemiyor; sunucu da reddediyor. Sahiplik
 * yalnızca sunucudaki grant-staff betiğiyle atanabilir — panelden sahiplik
 * dağıtılabilseydi, tek bir hesabın ele geçirilmesi platformun tamamının
 * kaybı olurdu.
 */
const StaffTeam: React.FC<{ staff: StaffUser }> = ({ staff }) => {
    const [items, setItems] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [role, setRole] = useState('content_moderator');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await staffApi.staffList();
            setItems(data.items);
            setRoles(data.roles.filter((r: any) => r.key !== 'owner'));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const add = async () => {
        setBusy(true);
        setError(null);
        try {
            await staffApi.addStaff(email.trim(), role, note.trim());
            setEmail(''); setNote('');
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const selectedRole = roles.find(r => r.key === role);

    return (
        <div className="space-y-7">
            <Card className="p-5 max-w-2xl">
                <h2 className="text-[15px] font-bold text-slate-900 mb-4">Ekibe ekle</h2>
                {error && <div className="mb-3"><ErrorBox message={error} /></div>}

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="E-posta" hint="Kişinin platformda kayıtlı hesabı olmalı.">
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={inputClass}
                            placeholder="ornek@edurce.com"
                        />
                    </Field>
                    <Field label="Rol">
                        <select value={role} onChange={e => setRole(e.target.value)} className={inputClass}>
                            {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                    </Field>
                </div>

                {selectedRole && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {selectedRole.permissions.map((p: string) => <Tag key={p}>{p}</Tag>)}
                    </div>
                )}

                <div className="mt-4">
                    <Field label="Not" hint="İsteğe bağlı.">
                        <input value={note} onChange={e => setNote(e.target.value)} className={inputClass} />
                    </Field>
                </div>

                <div className="mt-4">
                    <Button variant="primary" disabled={!email.trim() || busy} onClick={add}>
                        {busy ? '…' : 'Ekle'}
                    </Button>
                </div>
            </Card>

            <section>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                    Ekip üyeleri
                </h2>
                {loading ? <Loading /> : (
                    <div className="space-y-2">
                        {items.map(m => (
                            <Card key={m.id} className="p-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-[14px] font-semibold text-slate-900">{m.name}</span>
                                        <Tag tone={m.role === 'owner' ? 'danger' : 'info'}>{m.roleLabel}</Tag>
                                        {!m.is_active && <Tag tone="neutral">kapalı</Tag>}
                                        {!m.totp_enabled && <Tag tone="warn">2FA kurulmadı</Tag>}
                                        {m.user_id === staff.user_id && <Tag tone="ok">siz</Tag>}
                                    </div>
                                    <p className="text-[12.5px] text-slate-500 mt-1">
                                        {m.email}
                                        <span className="mx-1.5 text-slate-300">·</span>
                                        {m.last_seen_at ? `son giriş ${formatDate(m.last_seen_at)}` : 'hiç girmedi'}
                                    </p>
                                    {m.note && <p className="text-[12.5px] text-slate-500 mt-0.5">{m.note}</p>}
                                </div>

                                {m.is_active && m.role !== 'owner' && m.user_id !== staff.user_id && (
                                    <Button
                                        variant="danger"
                                        onClick={async () => {
                                            if (!confirm(`${m.email} için ekip yetkisi kaldırılsın mı? Açık oturumları da kapanacak.`)) return;
                                            await staffApi.disableStaff(m.user_id);
                                            load();
                                        }}
                                    >
                                        Yetkiyi kaldır
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default StaffTeam;
