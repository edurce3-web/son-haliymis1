import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

/**
 * Şifre sıfırlama.
 *
 * İki adım: e-posta girilir, gelen 6 haneli kodla birlikte yeni şifre
 * belirlenir. Kod ayrı bir adımda doğrulanmıyor; tek istekte hem kod hem
 * yeni şifre gönderiliyor, böylece kullanıcı bir ekran daha az geçiyor.
 */
const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');

    const inputClass =
        'h-11 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors';

    const requestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kod gönderilemedi');

            toast.success('Kod gönderildi', {
                description: 'E-postana 6 haneli bir kod gönderdik.',
            });
            setStep('reset');
        } catch (error: any) {
            toast.error('Kod gönderilemedi', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Şifre en az 6 karakter olmalı');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Şifre güncellenemedi');

            toast.success('Şifren güncellendi', { description: 'Şimdi giriş yapabilirsin.' });
            navigate('/login');
        } catch (error: any) {
            toast.error('Şifre güncellenemedi', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

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
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                    {step === 'email' ? 'Şifremi unuttum' : 'Yeni şifre belirle'}
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                    {step === 'email'
                        ? 'Hesabının e-posta adresini gir.'
                        : `${email} adresine gönderdiğimiz kodu gir.`}
                </p>
            </div>

            {step === 'email' ? (
                <form onSubmit={requestCode} className="space-y-5">
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
            ) : (
                <form onSubmit={resetPassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                            Doğrulama kodu
                        </Label>
                        <Input
                            id="code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                            required
                            className={`${inputClass} text-center text-lg font-mono tracking-[0.4em]`}
                        />
                    </div>

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
                        <p className="text-xs text-slate-500">En az 6 karakter.</p>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-brand-700 hover:bg-brand-800 font-semibold"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Güncelleniyor</>
                            : 'Şifreyi güncelle'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="text-sm font-medium text-slate-500 hover:text-brand-800 transition-colors"
                    >
                        Farklı bir e-posta gir
                    </button>
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
