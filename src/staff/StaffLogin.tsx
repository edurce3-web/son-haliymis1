import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore — paketin tip tanımları yok, yalnızca toCanvas kullanılıyor
import QRCode from 'qrcode';
import { staffApi, staffToken, StaffApiError } from './staffApi';
import type { StaffUser } from './StaffPortal';

/**
 * Panel girişi.
 *
 * İki ekran ama TEK istek. Önce e-posta ve parola, sonra doğrulama kodu.
 * İkinci ekrana geçiş tamamen tarayıcıda oluyor; sunucuya hiçbir şey
 * sorulmuyor. Sebebi: "parolanız doğru, şimdi kodu girin" diyen bir ara
 * yanıt, parolanın tutup tutmadığını dışarı sızdırır. Üç kutuyu birden
 * göstermek bunu engelliyordu ama ekran ne istendiği belirsiz duruyordu;
 * bu düzen ikisini birden çözüyor.
 *
 * İki adımlı doğrulama kurulu değilse sunucu kurulum bilgisiyle dönüyor ve
 * ekran QR kodunu gösteriyor. Kurulum tamamlanmadan panele girilemiyor.
 */
type Screen = 'credentials' | 'code' | 'setup';

const StaffLogin: React.FC<{ onAuthenticated: (staff: StaffUser) => void }> = ({ onAuthenticated }) => {
    const [screen, setScreen] = useState<Screen>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);

    const qrRef = useRef<HTMLCanvasElement>(null);
    const codeRef = useRef<HTMLInputElement>(null);

    // Kare kod, kurulum bilgisi geldiğinde çiziliyor. Sunucudan gelen otpauth
    // adresi hem gizli anahtarı hem hesap adını taşıyor.
    useEffect(() => {
        if (!setup || !qrRef.current) return;
        QRCode.toCanvas(qrRef.current, setup.otpauthUrl, { width: 190, margin: 1 })
            .catch(() => { /* çizilemezse elle girilecek anahtar zaten altta */ });
    }, [setup]);

    useEffect(() => {
        if (screen !== 'credentials') codeRef.current?.focus();
    }, [screen]);

    const field =
        'w-full h-11 px-3.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-[14.5px] '
        + 'placeholder:text-slate-500 focus:outline-none focus:border-slate-500 transition-colors';

    /** 1. ekran: sunucuya gitmeden ikinci ekrana geç. */
    const goToCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setNotice(null);
        setScreen('code');
    };

    const back = () => {
        setScreen('credentials');
        setCode('');
        setSetup(null);
        setError(null);
        setNotice(null);
    };

    const submitCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            if (screen === 'setup') {
                await staffApi.confirmTotp(email, password, code);
                setSetup(null);
                setCode('');
                setScreen('code');
                setNotice('Kurulum tamam. Şimdi uygulamadaki güncel kodu girin.');
                return;
            }

            const data = await staffApi.login(email, password, code);

            if (data.needsTotpSetup) {
                setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl });
                setCode('');
                setScreen('setup');
                return;
            }

            staffToken.set(data.token);
            onAuthenticated(data.staff);
        } catch (err) {
            const message = err instanceof StaffApiError
                ? (err.code === 'NETWORK_BLOCKED' ? 'Bu ağdan erişim yok.' : err.message)
                : 'Bağlantı kurulamadı';
            setError(message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5 py-12">
            <div className="w-full max-w-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">Edurce</p>
                <h1 className="text-[22px] font-bold text-white mt-1.5">Moderasyon paneli</h1>
                <span className="block w-10 h-0.5 bg-slate-700 mt-4 mb-7" />

                {/* ── 1. ekran: kimlik ─────────────────────────────────── */}
                {screen === 'credentials' && (
                    <form onSubmit={goToCode} className="space-y-3.5">
                        <p className="text-[13px] text-slate-400 leading-relaxed">
                            Edurce hesabınızın e-posta ve parolasıyla girin.
                        </p>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="E-posta"
                            autoComplete="username"
                            required
                            autoFocus
                            className={field}
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Parola"
                            autoComplete="current-password"
                            required
                            className={field}
                        />
                        <button
                            type="submit"
                            className="w-full h-11 rounded-lg bg-white text-slate-900 text-[14.5px] font-semibold hover:bg-slate-200 transition-colors"
                        >
                            Devam et
                        </button>
                    </form>
                )}

                {/* ── 2. ekran: kod ────────────────────────────────────── */}
                {screen !== 'credentials' && (
                    <form onSubmit={submitCode} className="space-y-4">
                        {screen === 'setup' && setup && (
                            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                                <p className="text-[13px] font-semibold text-white">
                                    İlk kurulum
                                </p>
                                <p className="text-[12.5px] text-slate-400 leading-relaxed mt-2">
                                    Telefonunuzda <strong className="text-slate-300">Google Authenticator</strong>{' '}
                                    uygulamasını açın, <strong className="text-slate-300">+</strong> düğmesine basıp
                                    “QR kodunu tara” deyin ve aşağıdaki kodu okutun.
                                </p>

                                <div className="flex justify-center my-4">
                                    <canvas ref={qrRef} className="rounded bg-white p-2" />
                                </div>

                                <p className="text-[12px] text-slate-500 mb-1.5">
                                    Kamera yoksa anahtarı elle girin:
                                </p>
                                <code className="block px-3 py-2.5 rounded bg-slate-950 border border-slate-800 text-[12.5px] font-mono tracking-[0.1em] text-emerald-400 break-all select-all">
                                    {setup.secret}
                                </code>
                            </div>
                        )}

                        <p className="text-[13px] text-slate-400 leading-relaxed">
                            {screen === 'setup'
                                ? 'Uygulamanın gösterdiği 6 haneli sayıyı yazın.'
                                : 'Google Authenticator uygulamasındaki 6 haneli kodu girin.'}
                        </p>

                        <input
                            ref={codeRef}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="••••••"
                            maxLength={6}
                            required
                            className={`${field} h-14 text-center text-[22px] tracking-[0.55em] indent-[0.55em] font-mono`}
                        />

                        {notice && (
                            <p className="text-[13px] text-emerald-400 leading-relaxed">{notice}</p>
                        )}
                        {error && (
                            <p className="text-[13px] text-amber-400 leading-relaxed">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={busy || code.length !== 6}
                            className="w-full h-11 rounded-lg bg-white text-slate-900 text-[14.5px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-40"
                        >
                            {busy ? '…' : screen === 'setup' ? 'Kurulumu tamamla' : 'Giriş yap'}
                        </button>

                        <button
                            type="button"
                            onClick={back}
                            className="w-full text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Geri
                        </button>
                    </form>
                )}

                <p className="text-[11.5px] text-slate-600 mt-8 leading-relaxed">
                    Bu sayfaya yapılan tüm giriş denemeleri kaydedilir.
                </p>
            </div>
        </div>
    );
};

export default StaffLogin;
