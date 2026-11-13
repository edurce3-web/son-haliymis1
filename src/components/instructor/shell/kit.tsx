import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Eğitmen panelinin ortak parçaları. Renk dili menüden geliyor:
 * nane (#9cf2e8) zemin üstünde koyu mürekkep (#00201d). Ana düğme nane,
 * seçili durum koyu mürekkep üstünde nane — menüdeki seçili başlık gibi.
 */

export const C = {
    ink: '#00201d',
    mint: '#9cf2e8',
    teal: '#005c55',
};

const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap select-none ' +
    'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] ' +
    'disabled:opacity-50 disabled:pointer-events-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45 focus-visible:ring-offset-2';

export const btn = {
    primary: cn(base, 'bg-[#9cf2e8] text-[#00201d] hover:bg-[#86e9dd] shadow-[0_1px_2px_rgba(0,64,58,0.18)]'),
    dark: cn(base, 'bg-[#00201d] text-[#9cf2e8] hover:bg-[#03302b]'),
    outline: cn(base, 'bg-white text-[#00201d] ring-1 ring-inset ring-[#d3d9d7] hover:bg-[#ecfbf8] hover:ring-[#9cdcd3]'),
    ghost: cn(base, 'text-[#1d4a45] hover:bg-[#e8faf6] hover:text-[#00201d]'),
    danger: cn(base, 'bg-white text-[#b42318] ring-1 ring-inset ring-[#f3c9c4] hover:bg-[#fff3f1]'),
    md: 'h-10 px-4 text-[13.5px]',
    sm: 'h-8 px-3 text-[12.5px] rounded-lg',
    lg: 'h-11 px-5 text-[14px]',
};

/** Form alanları için tek sınıf: input, textarea, select. */
export const field =
    'w-full rounded-xl bg-white px-3.5 text-[14px] text-[#00201d] placeholder:text-[#7c918e] ' +
    'ring-1 ring-inset ring-[#dadfdd] border-0 outline-none transition-shadow duration-150 ' +
    'hover:ring-[#c3cbc8] focus:ring-2 focus:ring-[#005c55]/55 focus-visible:ring-2 focus-visible:ring-[#005c55]/55 ' +
    'disabled:bg-[#f3f7f6] disabled:text-[#6b827f]';

export const label = 'block text-[13px] font-bold text-[#00201d] mb-1.5';
export const hint = 'text-[12.5px] text-[#5f7774]';

export const PageHead: React.FC<{
    title: string;
    sub?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}> = ({ title, sub, actions, className }) => (
    <header className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7', className)}>
        <div className="min-w-0">
            <h1 className="text-[28px] sm:text-[32px] leading-[1.1] font-extrabold tracking-[-0.025em] text-[#00201d] text-balance">
                {title}
            </h1>
            {sub && <p className="mt-2 text-[14.5px] text-[#4a6360]">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
);

/** İçerik yüzeyi. İç içe kullanılmaz; içinde bölmek gerekiyorsa çizgi kullan. */
export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' }> = ({
    className, as: Tag = 'div', ...rest
}) => (
    <Tag
        className={cn('rounded-2xl bg-white ring-1 ring-[#e3e6e5] shadow-[0_1px_2px_rgba(0,32,29,0.04)]', className)}
        {...rest}
    />
);

export const PanelHead: React.FC<{ title: string; sub?: React.ReactNode; actions?: React.ReactNode }> = ({
    title, sub, actions,
}) => (
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-[#eceeed]">
        <div className="min-w-0">
            <h2 className="text-[16.5px] font-extrabold tracking-[-0.01em] text-[#00201d]">{title}</h2>
            {sub && <p className="mt-0.5 text-[13px] text-[#5f7774]">{sub}</p>}
        </div>
        {actions}
    </div>
);

/** Sekme grubu: seçili olan koyu mürekkep üstünde nane, menüdeki seçili başlık gibi. */
export function Segments<T extends string>({
    value, onChange, items, className,
}: {
    value: T;
    onChange: (v: T) => void;
    items: { value: T; label: string; count?: number }[];
    className?: string;
}) {
    return (
        <div role="tablist" className={cn('inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-white ring-1 ring-[#e3e6e5]', className)}>
            {items.map(it => {
                const on = it.value === value;
                return (
                    <button
                        key={it.value}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(it.value)}
                        className={cn(
                            'h-9 px-3.5 rounded-xl text-[13.5px] font-bold inline-flex items-center gap-2',
                            'transition-[background-color,color] duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005c55]/45',
                            on ? 'bg-[#00201d] text-[#9cf2e8]' : 'text-[#1d4a45] hover:bg-[#f3f4f4]'
                        )}
                    >
                        {it.label}
                        {it.count != null && (
                            <span className={cn('text-[12px] tabular-nums', on ? 'text-[#9cf2e8]/70' : 'text-[#5f7774]')}>
                                {it.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export const SearchBox: React.FC<{
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, placeholder = 'Ara', className }) => (
    <label className={cn('relative block', className)}>
        <span className="sr-only">{placeholder}</span>
        <Search aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f7774] pointer-events-none" />
        <input
            type="search"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(field, 'h-10 pl-10')}
        />
    </label>
);

export const Empty: React.FC<{
    title: string;
    text?: React.ReactNode;
    action?: { label: string; to?: string; onClick?: () => void };
    className?: string;
}> = ({ title, text, action, className }) => (
    <div className={cn('rounded-2xl bg-[#ecfbf8] px-6 py-14 text-center', className)}>
        <p className="text-[17px] font-extrabold tracking-tight text-[#00201d]">{title}</p>
        {text && <p className="mt-1.5 text-[14px] text-[#4a6360] max-w-md mx-auto">{text}</p>}
        {action && (action.to ? (
            <Link to={action.to} className={cn(btn.primary, btn.md, 'mt-6')}>{action.label}</Link>
        ) : (
            <button type="button" onClick={action.onClick} className={cn(btn.primary, btn.md, 'mt-6')}>{action.label}</button>
        ))}
    </div>
);

export const Loading: React.FC<{ label?: string }> = ({ label = 'Yükleniyor' }) => (
    <div className="flex items-center justify-center gap-2.5 min-h-[40vh] text-[14px] text-[#4a6360]" role="status">
        <Loader2 className="w-5 h-5 animate-spin text-[#005c55]" />
        {label}
    </div>
);

type Tone = 'live' | 'review' | 'draft' | 'warn' | 'bad' | 'muted' | 'mint';

/** Durum etiketi: küçük nokta + kelime. Arka plan yok; satırları kalabalıklaştırmıyor. */
export const Tag: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({ tone, children, className }) => (
    <span className={cn(
        'inline-flex items-center gap-1.5 text-[12.5px] font-bold',
        tone === 'live' && 'text-[#00695f]',
        tone === 'review' && 'text-[#1f5f99]',
        tone === 'draft' && 'text-[#8a5a0b]',
        tone === 'warn' && 'text-[#8a5a0b]',
        tone === 'bad' && 'text-[#b42318]',
        tone === 'muted' && 'text-[#5f7774]',
        tone === 'mint' && 'text-[#005c55]',
        className
    )}>
        <span aria-hidden className={cn(
            'w-1.5 h-1.5 rounded-full',
            tone === 'live' && 'bg-[#0f9f8f]',
            tone === 'review' && 'bg-[#2f7fc1]',
            (tone === 'draft' || tone === 'warn') && 'bg-[#d08a1c]',
            tone === 'bad' && 'bg-[#d92d20]',
            tone === 'muted' && 'bg-[#9bb0ad]',
            tone === 'mint' && 'bg-[#005c55]'
        )} />
        {children}
    </span>
);

/** Baş harflerden yuvarlak: nane zemin, koyu mürekkep harf. */
export const Initials: React.FC<{ name?: string; src?: string | null; size?: number; className?: string }> = ({
    name = '', src, size = 36, className,
}) => {
    const letters = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toLocaleUpperCase('tr-TR') || '?';
    if (src) return <img src={src} alt="" className={cn('rounded-full object-cover shrink-0', className)} style={{ width: size, height: size }} />;
    return (
        <span
            aria-hidden
            className={cn('rounded-full bg-[#9cf2e8] text-[#00201d] font-extrabold flex items-center justify-center shrink-0', className)}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
        >
            {letters}
        </span>
    );
};

export const lira = (n: number) =>
    `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
