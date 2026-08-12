import React from 'react';

interface State {
    error: Error | null;
    info: React.ErrorInfo | null;
}

/**
 * Uygulama geneli hata sınırı.
 *
 * React'te yakalanmayan bir render hatası tüm ağacı söker ve geriye bomboş
 * beyaz sayfa kalır; hata yalnızca konsolda görünür. Bu bileşen hatayı yakalayıp
 * ekranda okunur bir mesaja çevirir, böylece:
 *   - Kullanıcı beyaz ekranla baş başa kalmaz, yenileme/ana sayfa seçeneği görür
 *   - Sorunun ne olduğu SSH ya da konsol açmadan anlaşılır
 *
 * Ayrıntı kutusu kasıtlı olarak açık: bu bir yönetim paneli değil, hatanın
 * bildirilmesini kolaylaştırmak istiyoruz.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state: State = { error: null, info: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Konsolda tam yığın izi kalsın
        console.error('Uygulama hatası:', error, info.componentStack);
        this.setState({ info });
    }

    private reload = () => {
        window.location.reload();
    };

    /** Eski dosya adlarına işaret eden önbelleği temizleyip yeniden yükler. */
    private hardReload = async () => {
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
        } catch { /* önbellek temizlenemese de yeniden yüklemeyi dene */ }
        window.location.replace(window.location.pathname);
    };

    render() {
        if (!this.state.error) return this.props.children;

        const { error, info } = this.state;

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h1 className="text-xl font-bold text-slate-900">Bir şeyler ters gitti</h1>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        Sayfa yüklenirken beklenmeyen bir hata oluştu. Sayfayı yenilemek
                        çoğu durumda sorunu çözer.
                    </p>

                    <div className="flex flex-wrap gap-3 mt-6">
                        <button
                            onClick={this.reload}
                            className="h-10 px-5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
                        >
                            Sayfayı yenile
                        </button>
                        <button
                            onClick={this.hardReload}
                            className="h-10 px-5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-semibold transition-colors"
                        >
                            Önbelleği temizleyip yenile
                        </button>
                        <a
                            href="/"
                            className="h-10 px-5 inline-flex items-center rounded-lg text-slate-600 hover:text-slate-900 text-sm font-semibold"
                        >
                            Ana sayfa
                        </a>
                    </div>

                    <details className="mt-7 group" open>
                        <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
                            Teknik ayrıntı
                        </summary>
                        <pre className="mt-3 text-[11px] leading-relaxed text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap break-words">
                            {error.name}: {error.message}
                            {info?.componentStack ? `\n${info.componentStack.trim()}` : ''}
                        </pre>
                        <p className="text-[11px] text-slate-400 mt-2">
                            Bu metni destekle paylaşırsan sorun çok daha hızlı çözülür.
                        </p>
                    </details>
                </div>
            </div>
        );
    }
}

export default AppErrorBoundary;
