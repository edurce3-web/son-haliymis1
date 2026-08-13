import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';

type ProviderName = 'google' | 'facebook' | 'apple';

interface ProviderInfo {
    enabled: boolean;
    label: string;
}

/**
 * Marka logoları. lucide-react'te bu markaların resmî işaretleri yok; her biri
 * kendi marka kılavuzunda belirli bir biçim şart koştuğu için doğrudan SVG.
 */
const ICONS: Record<ProviderName, React.ReactNode> = {
    google: (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden>
            <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 01-2.4 3.64v3h3.88c2.27-2.09 3.57-5.17 3.57-8.88z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0012 24z" />
            <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 010-4.56V6.63H1.26a12 12 0 000 10.74l4.01-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 001.26 6.63l4.01 3.09C6.22 6.87 8.87 4.75 12 4.75z" />
        </svg>
    ),
    apple: (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden>
            <path fill="currentColor" d="M17.05 12.54c-.03-2.75 2.25-4.07 2.35-4.14-1.28-1.87-3.27-2.13-3.98-2.16-1.7-.17-3.31 1-4.17 1-.86 0-2.19-.98-3.6-.95-1.85.03-3.56 1.08-4.51 2.73-1.92 3.33-.49 8.26 1.38 10.96.92 1.32 2.01 2.8 3.45 2.75 1.38-.06 1.9-.89 3.57-.89 1.67 0 2.14.89 3.6.86 1.49-.03 2.43-1.35 3.34-2.68 1.05-1.54 1.48-3.03 1.51-3.1-.03-.02-2.9-1.12-2.94-4.38zM14.3 4.2c.76-.92 1.27-2.2 1.13-3.47-1.09.04-2.42.73-3.2 1.64-.7.81-1.32 2.11-1.15 3.36 1.22.09 2.46-.62 3.22-1.53z" />
        </svg>
    ),
    facebook: (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden>
            <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
    ),
};

const ORDER: ProviderName[] = ['google', 'apple', 'facebook'];

/**
 * Sosyal giriş düğmeleri.
 *
 * Yalnızca SUNUCUDA YAPILANDIRILMIŞ sağlayıcılar gösterilir. Anahtarı olmayan
 * bir sağlayıcının düğmesi hiç çizilmez — tıklandığında hata veren ölü düğme
 * bırakmaktansa hiç göstermemek doğru.
 */
export const SocialLogin: React.FC<{ redirectAfter?: string }> = ({ redirectAfter }) => {
    const { data } = useQuery<{ providers: Record<ProviderName, ProviderInfo> }>({
        queryKey: ['auth-providers'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/auth/providers`);
            if (!res.ok) throw new Error('Sağlayıcılar alınamadı');
            return res.json();
        },
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    const available = ORDER.filter(name => data?.providers?.[name]?.enabled);
    if (available.length === 0) return null;

    const start = (name: ProviderName) => {
        const url = new URL(`${API_BASE_URL}/auth/${name}`);
        if (redirectAfter) url.searchParams.set('redirect', redirectAfter);
        // Tam sayfa yönlendirme: OAuth akışı sağlayıcının alan adında sürüyor
        window.location.href = url.toString();
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2.5">
                {available.map(name => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => start(name)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2.5 text-sm font-medium text-slate-700"
                    >
                        {ICONS[name]}
                        {data!.providers[name].label} ile devam et
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">veya</span>
                <span className="h-px flex-1 bg-slate-200" />
            </div>
        </div>
    );
};

export default SocialLogin;
