import React, { useState } from 'react';
import { staffApi, staffToken, StaffApiError } from './staffApi';
import type { StaffUser } from './StaffPortal';

/**
 * Panel girişi.
 *
 * Tek ekranda parola ve TOTP. İki adıma bölmek, ilk adımda "bu e-posta ekipte
 * var" bilgisini sızdırırdı; tek istekte doğrulanınca hangi bilginin yanlış
 * olduğu dışarıdan anlaşılmıyor.
 *
 * İki adımlı doğrulama kurulu değilse sunucu kurulum bilgisiyle dönüyor ve
 * ekran kurulum moduna geçiyor. Kurulum tamamlanmadan panele girilemiyor.
 */
const StaffLogin: React.FC<{ onAuthenticated: (staff: StaffUser) => void }> = ({ onAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);

    const field =
        'w-full h-11 px-3.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-[14.5px] '
        + 'placeholder:text-slate-500 focus:outline-none focus:border-slate-500 transition-colors';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            if (setup) {
                await staffApi.confirmTotp(email, password, code);
                setSetup(null);
                setCode('');
                setError('İki adımlı doğrulama kuruldu. Şimdi uygulamadaki kodla giriş yapın.');
                return;
            }

            const data = await staffApi.login(email, password, code);

            if (data.needsTotpSetup) {
                setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl });
                setCode('');
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

                {setup && (
                    <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
                        <p className="text-[13px] font-semibold text-white">
                            İki adımlı doğrulamayı kurun
                        </p>
                        <p className="text-[12.5px] text-slate-400 leading-relaxed mt-2">
                            Google Authenticator veya benzeri bir uygulamaya aşağıdaki anahtarı
                            elle ekleyin, sonra uygulamanın ürettiği kodu girin.
                        </p>
                        <code className="block mt-3 px-3 py-2.5 rounded bg-slate-950 border border-slate-800 text-[13px] font-mono tracking-[0.12em] text-emerald-400 break-all select-all">
                            {setup.secret}
                        </code>
                        <p className="text-[11.5px] text-slate-500 mt-2.5">
                            Bu anahtar yalnızca bir kez gösterilir.
                        </p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3.5">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="E-posta"
                        autoComplete="username"
                        required
                        disabled={Boolean(setup)}
                        className={field}
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Parola"
                        autoComplete="current-password"
                        required
                        disabled={Boolean(setup)}
                        className={field}
                    />
                    <input
                        inputMode="numeric"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        required={Boolean(setup)}
                        className={`${field} text-center tracking-[0.5em] font-mono`}
                    />

                    {error && (
                        <p className="text-[13px] text-amber-400 leading-relaxed">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full h-11 rounded-lg bg-white text-slate-900 text-[14.5px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {busy ? '…' : setup ? 'Kurulumu tamamla' : 'Giriş yap'}
                    </button>
                </form>

                <p className="text-[11.5px] text-slate-600 mt-7 leading-relaxed">
                    Bu sayfaya yapılan tüm giriş denemeleri kaydedilir.
                </p>
            </div>
        </div>
    );
};

export default StaffLogin;
