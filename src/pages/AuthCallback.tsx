import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Sosyal giriş dönüş sayfası.
 *
 * Sunucu, JWT'yi adres FRAGMENT'inde (#) gönderir. Sorgu dizesi yerine
 * fragment kullanılmasının sebebi: fragment sunucuya hiç gitmez, dolayısıyla
 * erişim loglarına ve Referer başlığına düşmez.
 *
 * Burada jeton okunur, depolanır, adres çubuğundan temizlenir ve kullanıcı
 * geldiği sayfaya yönlendirilir.
 */
const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Sıkı mod'da efekt iki kez çalışır; girişi tek sefer işle
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const token = hash.get('token');
        const rawUser = hash.get('user');

        // Jeton adres çubuğunda kalmasın
        window.history.replaceState(null, '', window.location.pathname);

        if (!token || !rawUser) {
            toast.error('Giriş tamamlanamadı', { description: 'Lütfen tekrar deneyin.' });
            navigate('/login', { replace: true });
            return;
        }

        try {
            const user = JSON.parse(rawUser);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success('Giriş başarılı', { description: `Hoş geldin, ${user.first_name}!` });

            // AuthContext kullanıcıyı localStorage'dan okuyarak kuruluyor;
            // tam yükleme en temiz yol (yarım kalmış durum bırakmıyor).
            const redirect = searchParams.get('redirect') || '/';
            window.location.replace(redirect);
        } catch {
            toast.error('Giriş bilgileri okunamadı');
            navigate('/login', { replace: true });
        }
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="w-7 h-7 animate-spin text-brand-600 mx-auto mb-4" />
                <p className="text-sm text-slate-600">Giriş yapılıyor…</p>
            </div>
        </div>
    );
};

export default AuthCallback;
