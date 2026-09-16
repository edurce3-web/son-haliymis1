import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'edurce_chunk_reload';

/**
 * Parça yüklemesi başarısız olduğunda sayfayı bir kez yenileyen lazy().
 *
 * Yeni bir sürüm yayınlandığında dosya adlarındaki karma değişiyor ve
 * eskisi sunucudan kalkıyor. Tarayıcıda açık duran ya da önbellekten gelen
 * eski index dosyası hâlâ eski parçayı istiyor, istek 404 dönüyor ve
 * kullanıcı "Failed to fetch dynamically imported module" hatasıyla
 * karşılaşıyor. Tek çözümü sayfayı yeniden yüklemek; kullanıcıdan bunu
 * beklemek yerine kendimiz yapıyoruz.
 *
 * Yenileme bir kez deneniyor. Hata önbellekten değil de gerçekten eksik bir
 * dosyadan kaynaklanıyorsa, sınırsız yenileme sonsuz döngü olurdu; bayrak
 * sessionStorage'da tutuluyor ve başarılı yüklemede siliniyor.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
) {
    return lazy(async () => {
        try {
            const mod = await factory();
            try { window.sessionStorage.removeItem(RELOAD_FLAG); } catch { /* engelliyse yoksay */ }
            return mod;
        } catch (error) {
            let alreadyTried = false;
            try {
                alreadyTried = window.sessionStorage.getItem(RELOAD_FLAG) === '1';
                window.sessionStorage.setItem(RELOAD_FLAG, '1');
            } catch {
                // Depolama kapalıysa yenilemeyi denemiyoruz: döngüye girme
                // ihtimali, tek seferlik hata ekranından daha kötü.
                throw error;
            }

            if (alreadyTried) throw error;

            window.location.reload();
            // Yenileme başlarken React'in hata sınırını tetiklememesi için
            // çözülmeyen bir söz döndürülüyor.
            return new Promise<{ default: T }>(() => { });
        }
    });
}

export default lazyWithRetry;
