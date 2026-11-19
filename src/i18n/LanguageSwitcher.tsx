import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLang, LANGUAGES, Lang, onLangChange, setLang } from './index';

export function useLang(): Lang {
    const [lang, set] = useState<Lang>(getLang);
    useEffect(() => onLangChange(set), []);
    return lang;
}

/**
 * Dil anahtarı: TR | EN. Yazıları çevrilmesin diye translate="no".
 * `tone="dark"` koyu zemin için.
 */
export const LanguageSwitcher: React.FC<{ className?: string; tone?: 'light' | 'dark'; withIcon?: boolean }> = ({
    className, tone = 'light', withIcon = true,
}) => {
    const lang = useLang();
    return (
        <div
            translate="no"
            role="radiogroup"
            aria-label="Dil / Language"
            className={cn(
                'inline-flex items-center gap-0.5 rounded-full p-0.5 text-[12px] font-bold',
                tone === 'dark' ? 'bg-white/10' : 'bg-[#eef1f0]',
                className
            )}
        >
            {withIcon && (
                <Globe aria-hidden className={cn('w-3.5 h-3.5 mx-1.5', tone === 'dark' ? 'text-white/70' : 'text-[#4a6360]')} />
            )}
            {LANGUAGES.map(l => {
                const on = l.code === lang;
                return (
                    <button
                        key={l.code}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        title={l.label}
                        onClick={() => { if (!on) setLang(l.code); }}
                        className={cn(
                            'h-6 min-w-[2rem] px-2 rounded-full transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/50',
                            on
                                ? tone === 'dark' ? 'bg-[#9cf2e8] text-[#00201d]' : 'bg-[#00201d] text-white'
                                : tone === 'dark' ? 'text-white/75 hover:text-white' : 'text-[#3d5754] hover:text-[#00201d]'
                        )}
                    >
                        {l.short}
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageSwitcher;
