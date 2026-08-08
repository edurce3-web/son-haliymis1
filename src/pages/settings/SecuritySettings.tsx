import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Key, Mail, Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft,
    CheckCircle2, Circle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

type Step = 'form' | 'code';

const SecuritySettings: React.FC = () => {
    const { user } = useAuth();

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
        if (resendIn <= 0) return;
        const t = setInterval(() => setResendIn(s => (s <= 1 ? 0 : s - 1)), 1000);
        return () => clearInterval(t);
    }, [resendIn]);

    // Backend ile aynı kural: 8+ karakter ve 4 kriterden en az 3'ü
    const pw = form.new_password;
    const hasMinLength = pw.length >= 8;
    const criteria = [/[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/];
    const met = criteria.filter(r => r.test(pw)).length;
    const isPasswordValid = hasMinLength && met >= 3;
    const passwordsMatch = pw.length > 0 && pw === form.new_password_confirm;

    const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const requestCode = async (isResend = false) => {
        if (!isResend) {
            if (!form.current_password) return toast.error('Mevcut parolanızı girin');
            if (!isPasswordValid) return toast.error('Yeni parola güvenlik kriterlerini karşılamıyor');
            if (!passwordsMatch) return toast.error('Yeni parolalar eşleşmiyor');
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
            toast.success('Doğrulama kodu gönderildi', { description: `${data.email} adresini kontrol edin.` });
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
            if (!res.ok) throw new Error(data.error || 'Parola değiştirilemedi');

            toast.success('Parolanız güncellendi');
            setStep('form');
            setForm({ current_password: '', new_password: '', new_password_confirm: '', code: '' });
        } catch (e: any) {
            toast.error('Parola değiştirilemedi', { description: e.message });
        } finally {
            setBusy(false);
        }
    };

    const eyeBtn = (key: keyof typeof show) => (
        <button
            type="button"
            onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
            {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
    );

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-6 h-6 text-slate-400" /> Hesap Güvenliği
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Parolanı değiştir ve giriş bilgilerini görüntüle.</p>
            </div>

            {/* E-posta */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <header className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">E-posta</h2>
                </header>
                <div className="p-6 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm text-slate-700 truncate">{user?.email || '—'}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            E-posta değişikliği için destek ile iletişime geçmelisin.
                        </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">değiştirilemez</span>
                </div>
            </section>

            {/* Parola */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <header className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Parola değiştir</h2>
                </header>

                {step === 'form' ? (
                    <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-sm text-slate-700">Mevcut parolan</Label>
                            <div className="relative">
                                <Input
                                    type={show.current ? 'text' : 'password'}
                                    value={form.current_password}
                                    onChange={e => set('current_password', e.target.value)}
                                    autoComplete="current-password"
                                    className="h-11 rounded-xl border-slate-200 pr-10"
                                />
                                {eyeBtn('current')}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm text-slate-700">Yeni parola</Label>
                            <div className="relative">
                                <Input
                                    type={show.next ? 'text' : 'password'}
                                    value={form.new_password}
                                    onChange={e => set('new_password', e.target.value)}
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl border-slate-200 pr-10"
                                />
                                {eyeBtn('next')}
                            </div>

                            {pw.length > 0 && (
                                <div className="bg-slate-50 rounded-xl p-3 mt-2 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs">
                                        {hasMinLength
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                        <span className={hasMinLength ? 'text-emerald-600' : 'text-slate-500'}>
                                            En az 8 karakter
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {met >= 3
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                        <span className={met >= 3 ? 'text-emerald-600' : 'text-slate-500'}>
                                            Küçük harf, büyük harf, rakam, özel karakter — en az 3'ü ({met}/4)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm text-slate-700">Yeni parola (tekrar)</Label>
                            <div className="relative">
                                <Input
                                    type={show.confirm ? 'text' : 'password'}
                                    value={form.new_password_confirm}
                                    onChange={e => set('new_password_confirm', e.target.value)}
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl border-slate-200 pr-10"
                                />
                                {eyeBtn('confirm')}
                            </div>
                            {form.new_password_confirm.length > 0 && !passwordsMatch && (
                                <p className="text-xs text-red-500">Parolalar eşleşmiyor.</p>
                            )}
                        </div>

                        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Güvenlik için e-posta adresine 6 haneli bir doğrulama kodu göndereceğiz.
                                Parola ancak kodu girdikten sonra değişir.
                            </p>
                        </div>

                        <Button
                            onClick={() => requestCode(false)}
                            disabled={busy || !form.current_password || !isPasswordValid || !passwordsMatch}
                            className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                        >
                            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor</> : 'Doğrulama kodu gönder'}
                        </Button>
                    </div>
                ) : (
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-center py-2">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 text-center">
                            <span className="font-medium">{maskedEmail}</span> adresine 6 haneli bir kod gönderdik.
                        </p>

                        <div className="space-y-1.5 max-w-xs mx-auto">
                            <Input
                                value={form.code}
                                onChange={e => set('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                className="h-14 rounded-xl border-slate-200 text-center text-2xl font-semibold tracking-[0.5em] indent-[0.5em]"
                            />
                            <p className="text-xs text-slate-400 text-center">Kod 10 dakika geçerlidir.</p>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <Button
                                onClick={confirmChange}
                                disabled={busy || form.code.length !== 6}
                                className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                            >
                                {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Değiştiriliyor</> : 'Parolayı değiştir'}
                            </Button>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setStep('form')}
                                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Geri
                                </button>
                                <button
                                    onClick={() => requestCode(true)}
                                    disabled={resendIn > 0 || busy}
                                    className="text-xs font-medium text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                                >
                                    {resendIn > 0 ? `Tekrar gönder (${resendIn}s)` : 'Kodu tekrar gönder'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default SecuritySettings;
