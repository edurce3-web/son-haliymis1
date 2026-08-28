import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Mail, ShieldCheck, KeyRound, Check } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';
import CodeInput from '@/components/auth/CodeInput';

type Step = 'email' | 'code' | 'password';

const STEPS: Array<{ key: Step; label: string }> = [
    { key: 'email', label: 'E-posta' },
    { key: 'code', label: 'Kod' },
    { key: 'password', label: 'Yeni şifre' },
];

/**
 * Şifre sıfırlama — üç adım.
 *
 * Kod ve yeni şifre bilinçli olarak ayrıldı: tek ekranda toplandığında
 * kullanıcı şifresini yazıp gönderdikten sonra "kod hatalı" cevabını alıyor,
 * hangi alanın yanlış olduğunu anlayamıyordu. Artık kod kendi adımında
 * doğrulanıyor; şifre ekranına ancak kod geçerliyse geçiliyor.
 */
const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const inputClass =
        'h-11 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors';

    const post = async (path: string, body: Record<string, string>) => {
        const res = await fetch(`${API_BASE_URL}/auth/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'İşlem tamamlanamadı');
        return data;
    };

    const sendCode = async () => {
        setLoading(true);
        try {
            await post('forgot-password', { email });
            toast.success('Kod gönderildi', {
                description: `${email} adresine 6 haneli bir kod gönderdik.`,
            });
            setCode('');
            setStep('code');
        } catch (error: any) {
            toast.error('Kod gönderilemedi', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async (submitted?: string) => {
        const value = submitted || code;
        if (value.length !== 6) return;
        setLoading(true);
        try {
            await post('verify-reset-code', { email, code: value });
            setStep('password');
        } catch (error: any) {
            toast.error('Kod doğrulanamadı', { description: error.message });
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            toast.error('Şifreler eşleşmiyor');
            return;
        }
        setLoading(true);
        try {
            await post('reset-password', { email, code, password });
            toast.success('Şifren güncellendi', {
                description: 'Şimdi yeni şifrenle giriş yapabilirsin.',
            });
            navigate('/login');
        } catch (error: any) {
            toast.error('Şifre güncellenemedi', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const heading = {
        email: {
            title: 'Şifremi unuttum',
            subtitle: 'Hesabının e-posta adresini gir, kodu oraya gönderelim.',
        },
        code: {
            title: 'Kodu gir',
            subtitle: `${email} adresine gönderdiğimiz 6 haneli kodu yaz.`,
        },
        password: {
            title: 'Yeni şifreni belirle',
            subtitle: 'Kimliğin doğrulandı. Şimdi yeni şifreni oluştur.',
        },
    }[step];

    const stepIndex = STEPS.findIndex(s => s.key === step);
    const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

    return (
        <AuthLayout
            title={<>Şifreni sıfırla</>}
            subtitle="E-posta adresine kod gönderelim, yeni şifreni birlikte belirleyelim."
            points={[
                'Kod e-postana 6 haneli olarak gelir',
                'Kod 10 dakika geçerlidir',
                'Google veya Facebook ile girdiysen şifreye ihtiyacın yok',
            ]}
        >
            {/* Adım göstergesi — kaç adım kaldığı baştan görünsün */}
            <div className="flex items-center gap-2 mb-7">
                {STEPS.map((s, i) => {
                    const done = i < stepIndex;
                    const active = i === stepIndex;
                    return (
                        <div key={s.key} className="flex items-center gap-2 flex-1">
                            <span
                                className={[
                                    'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 transition-colors',
                                    done || active ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400',
                                ].join(' ')}
                            >
                                {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                            </span>
                            <span
                                className={[
                                    'text-[12.5px] font-medium whitespace-nowrap',
                                    active ? 'text-slate-900' : 'text-slate-400',
                                ].join(' ')}
                            >
                                {s.label}
                            </span>
                            {i < STEPS.length - 1 && (
                                <span className={`h-px flex-1 ${done ? 'bg-brand-300' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mb-7">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 shrink-0">
                        {step === 'email' && <Mail className="w-5 h-5 text-brand-700" />}
                        {step === 'code' && <ShieldCheck className="w-5 h-5 text-brand-700" />}
                        {step === 'password' && <KeyRound className="w-5 h-5 text-brand-700" />}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900">{heading.title}</h2>
                </div>
                <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">{heading.subtitle}</p>
            </div>

            {step === 'email' && (
                <form
                    onSubmit={e => { e.preventDefault(); sendCode(); }}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                            E-posta
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="isim@ornek.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            autoComplete="email"
                            className={inputClass}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor</>
                            : 'Kod gönder'}
                    </Button>
                </form>
            )}

            {step === 'code' && (
                <form
                    onSubmit={e => { e.preventDefault(); verifyCode(); }}
                    className="space-y-5"
                >
                    <CodeInput value={code} onChange={setCode} autoFocus onComplete={verifyCode} />

                    <p className="text-xs text-slate-400 text-center">Kod 10 dakika geçerlidir.</p>

                    <Button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold disabled:opacity-50"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Doğrulanıyor</>
                            : 'Devam et'}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                        <button
                            type="button"
                            onClick={() => { setStep('email'); setCode(''); }}
                            className="font-medium text-slate-500 hover:text-brand-800 transition-colors"
                        >
                            E-postayı değiştir
                        </button>
                        <button
                            type="button"
                            onClick={sendCode}
                            disabled={loading}
                            className="font-semibold text-brand-700 hover:text-brand-900 transition-colors disabled:opacity-50"
                        >
                            Kodu tekrar gönder
                        </button>
                    </div>
                </form>
            )}

            {step === 'password' && (
                <form onSubmit={resetPassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                            Yeni şifre
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoFocus
                                autoComplete="new-password"
                                className={`${inputClass} pr-11`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            En az 8 karakter; harf ve rakam içermeli.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="passwordConfirm" className="text-sm font-medium text-slate-700">
                            Yeni şifre (tekrar)
                        </Label>
                        <Input
                            id="passwordConfirm"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={passwordConfirm}
                            onChange={e => setPasswordConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                            className={`${inputClass} ${mismatch ? 'border-red-300 focus:border-red-400 focus:ring-red-400/15' : ''}`}
                        />
                        {mismatch && <p className="text-xs text-red-600">Şifreler eşleşmiyor.</p>}
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !password || mismatch}
                        className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold disabled:opacity-50"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Güncelleniyor</>
                            : 'Şifreyi güncelle'}
                    </Button>
                </form>
            )}

            <p className="text-sm text-slate-500 mt-8">
                Şifreni hatırladın mı?{' '}
                <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
                    Giriş yap
                </Link>
            </p>
        </AuthLayout>
    );
};

export default ForgotPassword;
