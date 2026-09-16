import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore — paketin tip tanımları yok, yalnızca toCanvas kullanılıyor
import QRCode from 'qrcode';
import { staffApi, staffToken, StaffApiError } from './staffApi';
import type { StaffUser } from './StaffPortal';

/**
 * Panel girişi — iki adım.
 *
 * 1. E-posta + parola sunucuya gider ve orada doğrulanır. Sunucu, kodun mu
 *    yoksa ilk kurulumun mu gerektiğini söyler.
 * 2. Kurulum gerekiyorsa QR kodu, gerekmiyorsa doğrudan kod alanı çıkar.
 *
 * Önceki sürümde ikinci ekrana geçiş tamamen tarayıcıdaydı ve sunucuya hiç
 * sorulmuyordu; parolanın doğru olup olmadığını sızdırmamak içindi. Ama o
 * durumda ilk giriş kilitleniyordu: kullanıcının henüz kodu yok, kod
 * girilmeden istek de gönderilemiyor, dolayısıyla QR hiç görünmüyordu.
 * Parolanın doğrulandığını göstermek, iki adımlı doğrulama kullanan her
 * sistemin yaptığı şey; asıl koruma zaten ikinci adımda.
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
        if (screen !== 'setup' || !setup || !qrRef.current) return;
        QRCode.toCanvas(qrRef.current, setup.otpauthUrl, { width: 190, margin: 1 })
            .catch(() => { /* çizilemezse elle girilecek anahtar zaten altta */ });
    }, [screen, setup]);

    useEffect(() => {
        if (screen !== 'credentials') codeRef.current?.focus();
    }, [screen]);

    const field =
        'w-full h-11 px-3.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-[14.5px] '
        + 'placeholder:text-slate-500 focus:outline-none focus:border-slate-500 transition-colors';

    const readError = (err: unknown) =>
        err instanceof StaffApiError
            ? (err.code === 'NETWORK_BLOCKED' ? 'Bu ağdan erişim yok.' : err.message)
            : 'Bağlantı kurulamadı';

    /** 1. adım — parolayı doğrulat, sonraki ekranı sunucu belirlesin. */
    const submitCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const data = await staffApi.beginLogin(email, password);
            if (data.needsTotpSetup) {
                setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl });
                setScreen('setup');
            } else {
                setScreen('code');
            }
            setCode('');
        } catch (err) {
            setError(readError(err));
        } finally {
            setBusy(false);
        }
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
                setNotice('Kurulum tamam. Uygulamadaki güncel kodu girin.');
                return;
            }

            const data = await staffApi.login(email, password, code);
            staffToken.set(data.token);
            onAuthenticated(data.staff);
        } catch (err) {
            setError(readError(err));
            setCode('');
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

                {/* ── 1. ekran: e-posta ve parola ───────────────────────── */}
                {screen === 'credentials' && (
                    <form onSubmit={submitCredentials} className="space-y-3.5">
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

                        {error && (
                            <p className="text-[13px] text-amber-400 leading-relaxed">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full h-11 rounded-lg bg-white text-slate-900 text-[14.5px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-40"
                        >
                            {busy ? '…' : 'Devam et'}
                        </button>
                    </form>
                )}

                {/* ── 2. ekran: ilk kurulum (QR) ────────────────────────── */}
                {screen === 'setup' && setup && (
                    <form onSubmit={submitCode} className="space-y-4">
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                            <p className="text-[13px] font-semibold text-white">
                                İlk kurulum — telefonunuzu bağlayın
                            </p>
                            <ol className="text-[12.5px] text-slate-400 leading-relaxed mt-2.5 space-y-1 list-decimal list-inside">
                                <li>Telefonunuza <strong className="text-slate-300">Google Authenticator</strong> uygulamasını indirin</li>
                                <li>Uygulamada <strong className="text-slate-300">+</strong> → “QR kodunu tara”</li>
                                <li>Aşağıdaki kareyi okutun</li>
                            </ol>

                            <div className="flex justify-center my-4">
                                <canvas ref={qrRef} className="rounded bg-white p-2" />
                            </div>

                            <p className="text-[12px] text-slate-500 mb-1.5">
                                Kamera çalışmıyorsa uygulamada “Kurulum anahtarını gir” deyin.
                                Hesap adı: <strong className="text-slate-400">Edurce</strong>, tür:
                                <strong className="text-slate-400"> Zamana dayalı</strong>. Anahtar:
                            </p>
                            <code className="block px-3 py-2.5 rounded bg-slate-950 border border-slate-800 text-[12.5px] font-mono tracking-[0.1em] text-emerald-400 break-all select-all">
                                {setup.secret}
                            </code>
                        </div>

                        <p className="text-[13px] text-slate-400 leading-relaxed">
                            Uygulamanın gösterdiği 6 haneli sayıyı yazın.
                        </p>

                        <CodeInput inputRef={codeRef} value={code} onChange={setCode} className={field} />

                        {error && <p className="text-[13px] text-amber-400 leading-relaxed">{error}</p>}

                        <button
                            type="submit"
                            disabled={busy || code.length !== 6}
                            className="w-full h-11 rounded-lg bg-white text-slate-900 text-[14.5px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-40"
                        >
                            {busy ? '…' : 'Kurulumu tamamla'}
                        </button>

                        <BackButton onClick={back} />
                    </form>
                )}

                {/* ── 2. ekran: doğrulama kodu ──────────────────────────── */}
                {screen === 'code' && (
                    <form onSubmit={submitCode} className="space-y-4">
                        <p className="text-[13px] text-slate-400 leading-relaxed">
                            Google Authenticator uygulamasındaki 6 haneli kodu girin.
                        </p>

                        <CodeInput inputRef={codeRef} value={code} onChange={setCode} className={field} />

                        {notice && <p className="text-[13px] text-emerald-400 leading-relaxed">{notice}</p>}
                        {error && <p className="text-[13px] text-amber-400 leading-relaxed">{error}</p>}

                        <button
                            type="submit"
                            disabled={busy || code.length !== 6}
                            className="w-full h-11 rounded-lg bg-white text-slate-900 text-[14.5px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-40"
                        >
                            {busy ? '…' : 'Giriş yap'}
                        </button>

                        <BackButton onClick={back} />
                    </form>
                )}

                <p className="text-[11.5px] text-slate-600 mt-8 leading-relaxed">
                    Bu sayfaya yapılan tüm giriş denemeleri kaydedilir.
                </p>
            </div>
        </div>
    );
};

const CodeInput: React.FC<{
    inputRef: React.RefObject<HTMLInputElement>;
    value: string;
    onChange: (v: string) => void;
    className: string;
}> = ({ inputRef, value, onChange, className }) => (
    <input
        ref={inputRef}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••••"
        maxLength={6}
        required
        className={`${className} h-14 text-center text-[22px] tracking-[0.55em] indent-[0.55em] font-mono`}
    />
);

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
    >
        Geri
    </button>
);

export default StaffLogin;
