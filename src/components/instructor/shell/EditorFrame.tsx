import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Kurs ve e-kitap hazırlama sayfalarının çerçevesi.
 *
 * Bu sayfalar panelin içinde değil, kendi başına açılıyor: menü yok, bütün
 * genişlik işe ayrılıyor. Üst şerit nerede olduğunu (logo, geri dönüş,
 * üzerinde çalışılan şeyin adı ve durumu) ve kayıt bilgisini taşıyor.
 * Renkler panelle aynı: nane (#9cf2e8) ve koyu mürekkep (#00201d).
 */

export type FrameStatus = { label: string; tone: 'live' | 'draft' | 'review' };

const TONE = {
    live: { dot: 'bg-[#0f9f8f]', text: 'text-[#00695f]' },
    draft: { dot: 'bg-[#d08a1c]', text: 'text-[#8a5a0b]' },
    review: { dot: 'bg-[#2f7fc1]', text: 'text-[#1f5f99]' },
};

export const EditorFrame: React.FC<{
    back: { to: string; label: string };
    title: string;
    status?: FrameStatus;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    width?: 'wide' | 'narrow';
}> = ({ back, title, status, meta, actions, children, width = 'wide' }) => {
    const max = width === 'wide' ? 'max-w-[1240px]' : 'max-w-[1080px]';
    return (
        <div className="min-h-screen bg-[#f3f4f4] text-[#00201d] selection:bg-[#9cf2e8] selection:text-[#00201d]">
            <header className="sticky top-0 z-30 bg-white border-b border-[#e6e8e8]">
                <div className={cn(max, 'mx-auto h-16 px-4 sm:px-6 flex items-center gap-3 sm:gap-4')}>
                    <Link to="/instructor/dashboard" className="hidden sm:block shrink-0" aria-label="Eğitmen paneli">
                        <img src="/logo-wordmark.png" alt="Edurce" className="h-6 w-auto" />
                    </Link>
                    <span aria-hidden className="hidden sm:block h-6 w-px bg-[#e6e8e8]" />
                    <Link
                        to={back.to}
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-2.5 -ml-1 sm:ml-0 rounded-lg text-[13.5px] font-semibold text-[#3d5754] hover:text-[#00201d] hover:bg-[#ecfbf8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/40"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden md:inline">{back.label}</span>
                    </Link>

                    <div className="min-w-0 flex-1 flex items-center gap-3">
                        <p className="min-w-0 truncate text-[15px] font-extrabold tracking-[-0.01em] text-[#00201d]">{title}</p>
                        {status && (
                            <span className={cn('shrink-0 hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-bold', TONE[status.tone].text)}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', TONE[status.tone].dot)} />
                                {status.label}
                            </span>
                        )}
                    </div>

                    {meta && <div className="hidden lg:flex shrink-0 items-center gap-2 text-[13px] text-[#4a6360]" aria-live="polite">{meta}</div>}
                    {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
                </div>
            </header>

            <main className={cn(max, 'mx-auto px-4 sm:px-6 py-7 lg:py-10 pb-24')}>
                {children}
            </main>
        </div>
    );
};

/** Sağ sütundaki kısa yol haritası: taslaktan sonra ne geliyor. */
export const NextSteps: React.FC<{ items: string[] }> = ({ items }) => (
    <div className="mt-6">
        <p className="text-[13px] font-bold text-[#00201d]">Sonra ne olacak?</p>
        <ol className="mt-3 space-y-2.5">
            {items.map((t, i) => (
                <li key={t} className="flex items-start gap-3 text-[13.5px] text-[#3d5754]">
                    <span className="shrink-0 w-5 h-5 mt-px rounded-full bg-[#e3f6f2] text-[#005c55] text-[11px] font-bold tabular-nums flex items-center justify-center">
                        {i + 1}
                    </span>
                    {t}
                </li>
            ))}
        </ol>
    </div>
);

/** Seçenek çipi: kategori gibi az sayıdaki seçimler için açılır listeden daha hızlı. */
export const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
    <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={onClick}
        className={cn(
            'h-10 px-4 rounded-full text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45 focus-visible:ring-offset-2',
            on
                ? 'bg-[#00201d] text-[#9cf2e8]'
                : 'bg-white text-[#1d3a37] ring-1 ring-inset ring-[#dadfdd] hover:ring-[#9cdcd3] hover:bg-[#f5f6f6]'
        )}
    >
        {children}
    </button>
);
