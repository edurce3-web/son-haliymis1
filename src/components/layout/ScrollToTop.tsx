import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Sayfa değişince en üste dön.
 *
 * Tek sayfa uygulamasında tarayıcı kaydırma konumunu kendiliğinden
 * sıfırlamıyor; bir listenin ortasından bir detaya geçince yeni sayfa
 * ortasından açılıyordu.
 *
 * Üç durumu ayırıyoruz:
 *   - Geri/ileri (POP): tarayıcının kendi geri yükleme davranışına
 *     dokunmuyoruz, kullanıcı listede kaldığı yere dönsün.
 *   - Adreste #bölüm varsa: o bölüme gidilir, en üste değil.
 *   - Diğer her gezinme: anında en üste.
 *
 * Yalnızca pathname'e bakıyoruz. Arama/filtre değişiklikleri query string'i
 * değiştiriyor; onlarda sayfa başına atlamak istemiyoruz (katalog kendi
 * içinde zaten yönetiyor).
 */
export const ScrollToTop = () => {
    const { pathname, hash } = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        if (navigationType === 'POP') return;

        if (hash) {
            // Hedef öğe henüz basılmamış olabilir; bir kare bekle.
            requestAnimationFrame(() => {
                const el = document.getElementById(hash.slice(1));
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else window.scrollTo(0, 0);
            });
            return;
        }

        window.scrollTo(0, 0);
    }, [pathname, hash, navigationType]);

    return null;
};

export default ScrollToTop;
