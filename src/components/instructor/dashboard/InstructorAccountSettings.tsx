import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { btn, field, label, Loading, PageHead, Panel, PanelHead } from '../shell/kit';

type Step = 'form' | 'code';

export const InstructorAccountSettings: React.FC = () => {
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Şifre değiştirme akışı
    const [step, setStep] = useState<Step>('form');
    const [busy, setBusy] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [resendIn, setResendIn] = useState(0);
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
        code: '',
    });

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/instructor/settings/account`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const result = await res.json();
                    if (result.success) setAccount(result.account);
                }
            } catch (error) {
                console.error('Hesap verisi çekme hatası:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAccount();
    }, []);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setInterval(() => setResendIn(s => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(t);
    }, [resendIn]);

    // Şifre kuralları — backend ile aynı: 8+ karakter ve 4 kuraldan en az 3'ü
    const pw = form.new_password;
    const hasMinLength = pw.length >= 8;
    const criteria = [/[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/];
    const met = criteria.filter(r => r.test(pw)).length;
    const isPasswordValid = hasMinLength && met >= 3;
    const passwordsMatch = pw.length > 0 && pw === form.new_password_confirm;

    const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const requestCode = async (isResend = false) => {
        if (!isResend) {
            if (!form.current_password) return toast.error('Şu anki şifreni yaz');
            if (!isPasswordValid) return toast.error('Yeni şifre kuralları karşılamıyor');
            if (!passwordsMatch) return toast.error('İki yeni şifre aynı değil');
        }

        setBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/account/password/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ current_password: form.current_password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kod gönderilemedi');

            setMaskedEmail(data.email || '');
            setStep('code');
            setResendIn(60);
            toast.success('Doğrulama kodu gönderildi', { description: `${data.email} adresini kontrol et.` });
        } catch (e: any) {
            toast.error('Kod gönderilemedi', { description: e.message });
        } finally {
            setBusy(false);
        }
    };

    const confirmChange = async () => {
        setBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/account/password/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    code: form.code,
                    new_password: form.new_password,
                    new_password_confirm: form.new_password_confirm,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Şifre değiştirilemedi');

            toast.success('Şifren değişti');
            setStep('form');
            setForm({ current_password: '', new_password: '', new_password_confirm: '', code: '' });
        } catch (e: any) {
            toast.error('Şifre değiştirilemedi', { description: e.message });
        } finally {
            setBusy(false);
        }
    };


    if (loading) return <Loading label="Hesap bilgilerin yükleniyor" />;

    const eyeBtn = (key: keyof typeof show) => (
        <button
            type="button"
            onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
            aria-label={show[key] ? 'Şifreyi gizle' : 'Şifreyi göster'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#5f7774] hover:text-[#00201d] hover:bg-[#e8faf6]"
        >
            {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
    );

    const Rule: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) => (
        <li className={cn('flex items-center gap-2 text-[13px]', ok ? 'text-[#005c55] font-semibold' : 'text-[#4a6360]')}>
            {ok ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-[#b9cfcb]" />}
            {children}
        </li>
    );

    return (
        <div className="max-w-3xl">
            <PageHead title="Hesap ayarları" sub="Giriş bilgilerin ve hesabının güvenliği" />

            <Panel as="section" className="mb-6">
                <PanelHead title="Hesabın" />
                <dl className="divide-y divide-[#eef5f3]">
                    <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
                        <div className="min-w-0">
                            <dt className="text-[13px] font-bold text-[#00201d]">E-posta</dt>
                            <dd className="text-[14px] text-[#1d3a37] mt-0.5 truncate">{account?.email || '—'}</dd>
                        </div>
                        <span className="text-[12.5px] text-[#5f7774] shrink-0">Değiştirilemez</span>
                    </div>
                    {account?.created_at && (
                        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4">
                            <dt className="text-[13px] font-bold text-[#00201d]">Üyelik tarihi</dt>
                            <dd className="text-[14px] text-[#1d3a37] tabular-nums">
                                {new Date(account.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </dd>
                        </div>
                    )}
                </dl>
            </Panel>

            <Panel as="section">
                <PanelHead
                    title="Şifre değiştir"
                    sub={step === 'form' ? 'Güvenlik için e-postana 6 haneli bir kod göndereceğiz; şifre kodu girince değişir.' : undefined}
                />

                {step === 'form' ? (
                    <form
                        className="p-5 sm:p-6 space-y-5"
                        onSubmit={e => { e.preventDefault(); requestCode(false); }}
                    >
                        <div>
                            <label htmlFor="ac-cur" className={label}>Şu anki şifren</label>
                            <div className="relative">
                                <input id="ac-cur" type={show.current ? 'text' : 'password'} value={form.current_password}
                                    onChange={e => set('current_password', e.target.value)} autoComplete="current-password" className={cn(field, 'h-11 pr-11')} />
                                {eyeBtn('current')}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="ac-new" className={label}>Yeni şifre</label>
                            <div className="relative">
                                <input id="ac-new" type={show.next ? 'text' : 'password'} value={form.new_password}
                                    onChange={e => set('new_password', e.target.value)} autoComplete="new-password" className={cn(field, 'h-11 pr-11')} />
                                {eyeBtn('next')}
                            </div>
                            <ul className="mt-2.5 space-y-1.5">
                                <Rule ok={hasMinLength}>En az 8 karakter</Rule>
                                <Rule ok={met >= 3}>Küçük harf, büyük harf, rakam, özel karakterden en az 3'ü ({met}/4)</Rule>
                            </ul>
                        </div>
                        <div>
                            <label htmlFor="ac-rep" className={label}>Yeni şifre, tekrar</label>
                            <div className="relative">
                                <input id="ac-rep" type={show.confirm ? 'text' : 'password'} value={form.new_password_confirm}
                                    onChange={e => set('new_password_confirm', e.target.value)} autoComplete="new-password"
                                    aria-invalid={form.new_password_confirm.length > 0 && !passwordsMatch}
                                    className={cn(field, 'h-11 pr-11')} />
                                {eyeBtn('confirm')}
                            </div>
                            {form.new_password_confirm.length > 0 && !passwordsMatch && (
                                <p className="mt-1.5 text-[12.5px] font-semibold text-[#b42318]">İki şifre aynı değil.</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={busy || !form.current_password || !isPasswordValid || !passwordsMatch}
                            className={cn(btn.primary, btn.lg)}
                        >
                            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor</> : 'Doğrulama kodu gönder'}
                        </button>
                    </form>
                ) : (
                    <form
                        className="p-5 sm:p-6"
                        onSubmit={e => { e.preventDefault(); if (form.code.length === 6) confirmChange(); }}
                    >
                        <p className="text-[14.5px] text-[#1d3a37]">
                            <b className="font-bold text-[#00201d]">{maskedEmail}</b> adresine 6 haneli bir kod gönderdik. Kod 10 dakika geçerli.
                        </p>
                        <label htmlFor="ac-code" className="sr-only">Doğrulama kodu</label>
                        <input
                            id="ac-code"
                            value={form.code}
                            onChange={e => set('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            placeholder="000000"
                            className={cn(field, 'mt-4 h-14 max-w-[260px] text-center text-[26px] font-extrabold tabular-nums tracking-[0.45em] indent-[0.45em]')}
                        />
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <button type="submit" disabled={busy || form.code.length !== 6} className={cn(btn.primary, btn.lg)}>
                                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Değiştiriliyor</> : 'Şifreyi değiştir'}
                            </button>
                            <button type="button" onClick={() => requestCode(true)} disabled={resendIn > 0 || busy} className={cn(btn.ghost, btn.lg)}>
                                {resendIn > 0 ? `Tekrar gönder (${resendIn} sn)` : 'Kodu tekrar gönder'}
                            </button>
                            <button type="button" onClick={() => setStep('form')} className={cn(btn.ghost, btn.lg)}>
                                <ArrowLeft className="w-4 h-4" /> Geri
                            </button>
                        </div>
                    </form>
                )}
            </Panel>
        </div>
    );
};

export default InstructorAccountSettings;
