import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLang, LANGUAGES, Lang, onLangChange, setLang } from './index';

export function useLang(): Lang {
    const [lang, set] = useState<Lang>(getLang);
    useEffect(() => onLangChange(set), []);
    return lang;
}

/**
 * Dil seçici. Yalnızca footer'da duruyor.
 *
 * Kapalıyken: kod rozeti + dilin kendi adı. Açılınca düğmenin üstünde bir
 * liste beliriyor; her satırda dilin kendi adı (çevrilmiyor) ve altında
 * seçili arayüz dilindeki adı. Telefonda liste ekranın altından açılan bir
 * panel oluyor. Esc ya da dışarı tıklamak kapatıyor.
 */
export const LanguagePicker: React.FC<{ className?: string }> = ({ className }) => {
    const lang = useLang();
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
        window.addEventListener('keydown', onKey);
        window.addEventListener('mousedown', onDown);
        requestAnimationFrame(() => (box.current?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus());
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('mousedown', onDown);
        };
    }, [open]);

    const choose = (code: Lang) => {
        setOpen(false);
        if (code !== lang) setLang(code);
    };

    return (
        <div ref={box} className={cn('relative', className)}>
            <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label="Dil seç"
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'inline-flex items-center gap-2.5 h-11 pl-1.5 pr-4 rounded-full bg-white text-[14px] font-bold text-[#111827]',
                    ' hover:shadow-[0_6px_18px_-10px_rgba(17,24,39,0.35)] transition-shadow',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B7A43]/45'
                )}
            >
                <span translate="no" className="w-8 h-8 rounded-full bg-[#B2F0C8] text-[11.5px] font-extrabold tracking-wide flex items-center justify-center">
                    {current.short}
                </span>
                <span translate="no">{current.label}</span>
                <ChevronUp aria-hidden className={cn('w-4 h-4 text-[#6B7280] transition-transform duration-200', !open && 'rotate-180')} />
            </button>

            {open && (
                <>
                    <div aria-hidden className="sm:hidden fixed inset-0 z-[60] bg-black/30 animate-in fade-in duration-150" />
                    <div
                        role="dialog"
                        aria-label="Dil seç"
                        className={cn(
                            'z-[61] bg-white overflow-hidden',
                            'fixed inset-x-0 bottom-0 rounded-t-[28px] pb-[max(16px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 fade-in duration-200',
                            'sm:absolute sm:inset-x-auto sm:bottom-[calc(100%+10px)] sm:right-0 sm:w-[340px] sm:rounded-[24px] sm:pb-2 sm:slide-in-from-bottom-1',
                            'shadow-[0_30px_70px_-20px_rgba(17,24,39,0.45),0_0_0_1px_rgba(17,24,39,0.05)]'
                        )}
                    >
                        <div className="px-5 pt-5 pb-3">
                            <p className="text-[17px] font-extrabold tracking-[-0.01em] text-[#111827]">Dil seç</p>
                            <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">
                                Arayüz dili değişir; kurs içerikleri yazıldığı dilde kalır.
                            </p>
                        </div>
                        <ul role="radiogroup" aria-label="Diller" className="px-2 max-h-[min(60vh,420px)] overflow-y-auto">
                            {LANGUAGES.map(l => {
                                const on = l.code === lang;
                                return (
                                    <li key={l.code}>
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={on}
                                            onClick={() => choose(l.code)}
                                            className={cn(
                                                'w-full flex items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-colors',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B7A43]/45',
                                                on ? 'bg-[#EEFBF3]' : 'hover:bg-[#F5F6F8]'
                                            )}
                                        >
                                            <span
                                                translate="no"
                                                className={cn(
                                                    'w-9 h-9 shrink-0 rounded-xl text-[11.5px] font-extrabold tracking-wide flex items-center justify-center',
                                                    on ? 'bg-[#1B7A43] text-white' : 'bg-[#F1F3F5] text-[#374151]'
                                                )}
                                            >
                                                {l.short}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span translate="no" dir="auto" className="block text-[15px] font-bold text-[#111827] leading-tight">{l.label}</span>
                                                <span className="block text-[12.5px] text-[#6B7280]">{l.name}</span>
                                            </span>
                                            {on && <Check aria-hidden className="w-[18px] h-[18px] text-[#1B7A43]" strokeWidth={2.6} />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguagePicker;
